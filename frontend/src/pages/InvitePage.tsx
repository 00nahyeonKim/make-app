import { useNavigate, useParams } from "react-router";
import { useMeetingDraftStore } from "../stores/meetingDraftStore";
import Button from "../components/Button";
import Header from "../layouts/Header";
import { useEffect, useState } from "react";
import { buildInviteUrl } from "../utils/urlBuilder";
import { Plus, Share2 } from "lucide-react";
import ShareModal from "../components/ShareModal";
import { useGuestStore } from "../stores/guestStore";
import type { MeetingDetail } from "../types/meeting";
import { getMeetingByInviteToken } from "../api/meetingApi";
import { getApiErrorMessage } from "../api/httpClient";
import LoadingSpinner from "../components/LoadingSpinner";
import type { AvailabilitiesStatus } from "../types/availability";
import { getAvailabilities } from "../api/availabilityApi";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const STEP = 30; // 한 칸 = 30분

// "13:30" -> 810 (자정부터 몇 분)
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// "2026-05-21" -> "05.21(목)"
function formatColumnDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}(${weekday})`;
}

// 슬롯 1개(=하루) 타입. AvailabilitiesStatus 안의 slots 원소 타입을 그대로 재사용
type StatusSlot = AvailabilitiesStatus["slots"][number];

// 이 칸(슬롯, 시작분)에 "가능"이라고 한 사람 수
// 참여자에 startTime/endTime이 없으면 슬롯 전체 가능으로 본다
function countAvailable(slot: StatusSlot, minutes: number): number {
  return slot.availableParticipants.filter((p) => {
    const start = p.startTime
      ? toMinutes(p.startTime)
      : toMinutes(slot.startTime);
    const end = p.endTime ? toMinutes(p.endTime) : toMinutes(slot.endTime);
    return start <= minutes && minutes < end;
  }).length;
}

function StatusGrid({ slots }: { slots: StatusSlot[] }) {
  // 날짜 빠른 순 정렬 (같은 날이면 시작 시간 순)
  const columns = [...slots].sort((a, b) =>
    a.startDate === b.startDate
      ? a.startTime.localeCompare(b.startTime)
      : a.startDate.localeCompare(b.startDate),
  );

  // 세로축(30분 행): 모든 슬롯 통틀어 가장 이른 시작 ~ 가장 늦은 종료
  const start =
    Math.floor(Math.min(...columns.map((s) => toMinutes(s.startTime))) / 60) *
    60;
  const end =
    Math.ceil(Math.max(...columns.map((s) => toMinutes(s.endTime))) / 60) * 60;
  const timeRows: number[] = [];
  for (let t = start; t < end; t += STEP) timeRows.push(t);
  const hourRows = timeRows.filter((m) => m % 60 === 0); // 정각(:00) 행만
  const lastMinutes = timeRows[timeRows.length - 1]; // 맨 아래 행의 분

  // 색 진하기 기준: 한 칸 최대 가능 인원 (0으로 나누기 방지로 최소 1)
  const maxCount = Math.max(
    1,
    ...columns.flatMap((s) => timeRows.map((m) => countAvailable(s, m))),
  );

  return (
    <div className="mt-3 px-2 overflow-x-auto">
      <div className="flex w-fit select-none overflow-hidden rounded-xl border border-[#f3b682]">
        {/* 왼쪽 시간축 */}
        <div className="w-7 shrink-0">
          {/* 날짜 헤더 높이(h-8)만큼 빈 칸 */}
          <div className="h-8 border-b border-[#f3b682] bg-[#fafafa]" />
          <div className="flex flex-col">
            {hourRows.map((m, index) => (
              <div
                key={m}
                className={[
                  "flex h-16 shrink-0 items-center justify-end pr-2 text-[11px] font-semibold leading-none text-[#9b9b9b]",
                  index === hourRows.length - 1
                    ? ""
                    : "border-b border-[#f3b682]",
                ].join(" ")}
              >
                {m / 60}
              </div>
            ))}
          </div>
        </div>

        {/* 날짜 컬럼들 */}
        {columns.map((slot) => (
          <div
            key={slot.id}
            className="w-24 shrink-0 border-l border-[#f3b682]"
          >
            {/* 날짜 헤더 */}
            <div className="flex h-8 items-center justify-center border-b border-[#f3b682] bg-[#ffffff] text-[11px] font-bold text-[#555555]">
              {formatColumnDate(slot.startDate)}
            </div>

            {/* 시간 칸들 */}
            {timeRows.map((m) => {
              const inRange =
                toMinutes(slot.startTime) <= m && m < toMinutes(slot.endTime);
              const borderClass =
                m === lastMinutes
                  ? "" // 마지막 행: 아래 선 없음(바깥 테두리와 겹쳐 두꺼워지는 것 방지)
                  : m % 60 === 0
                    ? "border-b border-dashed"
                    : "border-b";

              // 슬롯 범위 밖 = 회색 (선택 불가였던 자리)
              if (!inRange) {
                return (
                  <div
                    key={m}
                    className={`h-8 border-[#f3b682] bg-[#eeeeee] ${borderClass}`}
                  />
                );
              }

              // 가능 인원이 많을수록 진한 주황 (0명이면 투명 = 흰색)
              const count = countAvailable(slot, m);
              const alpha = count === 0 ? 0 : 0.12 + 0.45 * (count / maxCount);
              return (
                <div
                  key={m}
                  className={`h-8 border-[#f3b682] ${borderClass}`}
                  style={{ backgroundColor: `rgba(245, 154, 88, ${alpha})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function InvitePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>(); // 동적 파라미터
  const navigate = useNavigate();
  const created = useMeetingDraftStore((state) => state.created);
  const guest = useGuestStore((state) => state.guest);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [avail, setAvail] = useState<AvailabilitiesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 방금 내가 만든 모임이면(=create 토큰과 같으면) 공유 모달을 자동으로 띄움
  const justCreated = created?.inviteToken === inviteToken;
  const [shareOpen, setShareOpen] = useState(justCreated);

  // 모임 정보 조회 (리더/팔로워 공통)
  useEffect(() => {
    if (!inviteToken) return;
    setLoading(true);
    getMeetingByInviteToken(inviteToken)
      .then((data) => setMeeting(data))
      .catch((e) => setError(getApiErrorMessage(e, "모임을 찾을 수 없어요.")))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  // 실시간 등록 현황(publicAPI라 로그인 없이도 조회)
  useEffect(() => {
    if (!inviteToken) return;
    getAvailabilities(inviteToken)
      .then(setAvail)
      .catch(() => setAvail(null)); // 그리드는 없어도 화면은 떠야 하니 조용히
  }, [inviteToken]);

  if (loading) {
    return (
      <LoadingSpinner fullScreen message="모임 정보를 불러오는 중이에요" />
    );
  }

  // 잘못된/만료된 초대 링크 등
  if (error || !meeting || !inviteToken) {
    return (
      <section className="flex h-full flex-col items-center justify-center gap-2 bg-white px-6 text-center">
        <p className="text-[15px] font-bold text-[#2d2d2d]">
          {error || "모임을 찾을 수 없어요."}
        </p>
        <p className="text-[13px] text-[#9b9b9b]">
          초대 링크가 올바른지 확인해주세요.
        </p>
      </section>
    );
  }

  const inviteUrl = buildInviteUrl(inviteToken);
  const joined = guest !== null; // 이 브라우저에서 이미 참여했는지

  // 응답(등록)한 참여자 목록: 슬롯들의 가능/불가 명단을 합쳐 id로 중복 제거
  const participants = avail
    ? Array.from(
        new Map(
          avail.slots
            .flatMap((s) => [
              ...s.availableParticipants,
              ...s.unavailableParticipants,
            ])
            .map((p) => [p.id, p.displayName] as const),
        ),
      )
    : [];

  return (
    // relative: ShareModal의 absolute inset-0가 이 영역을 기준으로 덮게 함
    <section className="relative flex h-full flex-col bg-white">
      <Header
        title={meeting.name}
        showMenu
        right={
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="공유"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f5f5f5]"
          >
            <Share2 size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* 실시간 참여 현황 */}
        <h2 className="text-[16px] font-bold text-[#2d2d2d]">
          실시간 참여 현황
        </h2>
        <p className="mt-1 text-[13px] text-[#9b9b9b]">
          참여하지 않은 친구들에게 링크를 공유해 보세요!
        </p>
        {/* 참여 인원 수 */}
        <div className="mt-3 text-right text-[14px] font-bold text-[#f59a58]">
          {participants.length}{" "}
          <span className="text-[#c4c4c4]">
            / {meeting.expectedCount ?? "-"}
          </span>
        </div>
        {/* 참여도 바: 예상 인원 대비 참여 인원 비율 */}
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
          <div
            className="h-full rounded-full bg-[#f59a58] transition-all"
            style={{
              width: `${
                meeting.expectedCount
                  ? Math.min(
                      100,
                      (participants.length / meeting.expectedCount) * 100,
                    )
                  : 0
              }%`,
            }}
          />
        </div>

        {/* 참여자 이름 칩 */}
        {participants.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {participants.map(([id, name]) => (
              <span
                key={id}
                className="inline-block rounded-full bg-[#f4f4f4] px-3 py-1 text-[12px] font-semibold text-[#555555]"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <span className="mt-3 inline-block rounded-full bg-[#f4f4f4] px-3 py-1 text-[12px] font-semibold text-[#9b9b9b]">
            아직 참여한 사람이 없습니다
          </span>
        )}

        {/* 실시간 등록 현황 */}
        <h2 className="mt-7 text-[16px] font-bold text-[#2d2d2d]">
          실시간 등록 현황
        </h2>
        {avail && avail.slots.length > 0 ? (
          <StatusGrid slots={avail.slots} />
        ) : (
          <div className="mt-3 flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#e0e0e0] text-center text-[13px] font-semibold text-[#c4c4c4]">
            참여자가 시간을 등록하면 여기에 표시돼요
          </div>
        )}

        {joined && (
          <p className="mt-6 rounded-lg bg-[#fff3e9] px-4 py-3 text-[13px] font-semibold text-[#e07b34]">
            이미 참여했어요! (가능 시간 등록은 4주차에서 이어집니다)
          </p>
        )}
      </div>

      {/* 플로팅 + 버튼 */}
      <button
        type="button"
        aria-label="내 가능 시간 등록"
        onClick={() => navigate(`/invite/${inviteToken}/availability`)}
        className="absolute bottom-24 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#f59a58] text-white shadow-lg transition hover:bg-[#ef8840]"
      >
        <Plus size={24} />
      </button>

      {/* 하단: 미참여이면 '참여하기', 참여했으면 '우선순위 보기' */}
      <div className="shrink-0 border-t border-[#f0f0f0] px-6 pb-6 pt-4">
        {joined ? (
          <Button
            type="button"
            variant="orange"
            fullWidth
            onClick={() => navigate(`/invite/${inviteToken}/result`)}
          >
            우선순위 보기
          </Button>
        ) : (
          <Button
            type="button"
            variant="orange"
            fullWidth
            onClick={() => navigate(`/invite/${inviteToken}/guest`)}
          >
            참여하기
          </Button>
        )}
      </div>

      {/* 공유 모달 */}
      <ShareModal
        open={shareOpen}
        inviteUrl={inviteUrl}
        onClose={() => setShareOpen(false)}
      />
    </section>
  );
}

export default InvitePage;
