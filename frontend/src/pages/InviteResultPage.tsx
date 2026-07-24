import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { ResultResponse, ResultSort } from "../types/result";
import type { AvailabilitiesStatus } from "../types/availability";
import { getResults } from "../api/resultApi";
import { getApiErrorMessage } from "../api/httpClient";
import { getAvailabilities } from "../api/availabilityApi";
import LoadingSpinner from "../components/LoadingSpinner";
import Header from "../layouts/Header";
import { Check, ChevronDown, Home } from "lucide-react";
import Button from "../components/Button";
import { confirmMeeting, getMeetingByInviteToken } from "../api/meetingApi";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 정렬 탭 (서버가 원하는 값 key + 사용자에게 보일 laebl)
const SORT_TABS: { key: ResultSort; label: string }[] = [
  { key: "recommend", label: "추천순" },
  { key: "date", label: "날짜순" },
  { key: "duration", label: "긴 시간순" },
];

// "2026-05-27" -> "05월 27일 (수)"
function formatResultDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${String(m).padStart(2, "0")}월 ${String(d).padStart(2, "0")}일 (${weekday})`;
}

function InviteResultPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<ResultResponse | null>(null);
  const [avail, setAvail] = useState<AvailabilitiesStatus | null>(null); // 이름용
  const [expanded, setExpanded] = useState<Set<number>>(new Set()); // 펼쳐진 카드 id들
  const [sort, setSort] = useState<ResultSort>("recommend");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isOwner, setIsOwner] = useState(false); // 서버가 알려준 방장 여부
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null); // 방장이 고른 카드
  const [confirming, setConfirming] = useState(false); // 확정 요청 중(버튼 잠금)
  const [confirmError, setConfirmError] = useState(""); // 확정 실패 메시지

  // ① 집계 결과 (인원 수, 추천 라벨, 정렬)
  useEffect(() => {
    if (!inviteToken) return;
    setLoading(true);
    getResults(inviteToken, sort)
      .then((data) => {
        setResult(data);
        setExpanded(new Set(data.slots.map((s) => s.id))); // 처음엔 다 펼쳐 둠
      })
      .catch((e) => setError(getApiErrorMessage(e, "결과를 불러올 수 없어요.")))
      .finally(() => setLoading(false));
  }, [inviteToken, sort]);

  // ② 참여자 이름 (results엔 없어서 availabilities에서 가져옴)
  useEffect(() => {
    if (!inviteToken) return;
    getAvailabilities(inviteToken)
      .then(setAvail)
      .catch(() => setAvail(null)); // 이름은 없어도 화면은 떠야 하니 조용히
  }, [inviteToken]);

  // ③ 내가 이 모임의 방장인지 (로그인 쿠키가 자동으로 실려 가서 서버가 판단해 줌)
  useEffect(() => {
    if (!inviteToken) return;
    getMeetingByInviteToken(inviteToken)
      .then((meeting) => setIsOwner(meeting.isOwner === true))
      .catch(() => setIsOwner(false)); // 실패하면 안전하게 "참여자"로 취급
  }, [inviteToken]);

  // 슬롯 id -> {가능 이름들, 불가능 이름들} (getAvailabilities에서 뽑음)
  const nameMap = new Map<
    number,
    { available: string[]; unavailable: string[] }
  >();
  avail?.slots.forEach((s) => {
    nameMap.set(s.id, {
      available: s.availableParticipants.map((p) => p.displayName),
      unavailable: s.unavailableParticipants.map((p) => p.displayName),
    });
  });

  // 카드 펼치기/접기
  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 방장: 선택한 슬롯으로 약속 확정 -> 결과 공유 화면으로 이동
  const handleConfirm = async () => {
    // 아직 결과를 못 받았거나, 아무 카드도 안 골랐으면 아무 일도 안 함
    if (!result || selectedSlotId === null) return;

    setConfirming(true);
    setConfirmError("");

    try {
      // 확정 API 호출 (서버가 주최자인지 다시 검사)
      const detail = await confirmMeeting(result.meetingId, selectedSlotId);

      // 방장에게만 오는 결과 토큰 = 이동할 주소
      if (!detail.resultToken) {
        setConfirmError("결과 링크를 받지 못했어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 확정된 일정을 state에 담아 결과 공유 화면으로 이동
      navigate(`/result/${detail.resultToken}`, {
        state: { confirmedSlot: detail.confirmedSlot ?? null },
      });
    } catch (e) {
      setConfirmError(getApiErrorMessage(e, "약속 확정에 실패했어요."));
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="결과를 불러오는 중이에요" />;
  }
  if (error || !result || !inviteToken) {
    return (
      <section className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[15px] font-bold text-[#2d2d2d]">
          {error || "결과를 불러올 수 없어요."}
        </p>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col bg-white">
      <Header title={result.meetingName} showMenu />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* 제목 */}
        <h1 className="text-[20px] font-bold leading-snug text-[#2d2d2d]">
          현재까지{" "}
          <span className="text-[#f59a58]">
            {result.submittedParticipants}명
          </span>
          의
          <br />
          약속 조율 결과예요
        </h1>

        {/* 역할별 안내 문구 */}
        <p className="mt-3 text-[14px] font-semibold text-[#9b9b9b]">
          {isOwner
            ? selectedSlotId === null
              ? "확정할 시간을 선택해주세요"
              : "선택한 시간으로 약속을 확정할 수 있어요"
            : "방장이 약속을 확정하면 결과 화면에서 볼 수 있어요"}
        </p>

        {/* 확정 실패 메시지 */}
        {confirmError && (
          <p className="mt-1 text-[12px] font-semibold text-[#e05b5b]">
            {confirmError}
          </p>
        )}

        {/* 정렬 드롭다운 */}
        <div className="mt-4 flex gap-2">
          {SORT_TABS.map((tab) => {
            const active = sort === tab.key; // 지금 선택된 탭인가?
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSort(tab.key)} // 누르면 정렬 값 변경 -> useEffect 재실행
                className={[
                  "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                  active
                    ? "bg-[#f59a58] text-white" // 선택됨: 주황색 강조
                    : "bg-[#f4f4f4] text-[#777777] hover:bg-[#ececec]", // 선택안됨: 회색
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 결과 카드들 */}
        <div className="mt-4 flex flex-col gap-3">
          {result.slots.map((slot) => {
            const open = expanded.has(slot.id);
            const names = nameMap.get(slot.id);
            const selected = selectedSlotId === slot.id; // 방장이 고른 카드인가?
            return (
              <div
                key={slot.id}
                className={[
                  "rounded-xl border p-4 transition",
                  selected
                    ? "border-[#f59a58] bg-[#fff7f0] ring-2 ring-[#f59a58]" // 선택됨: 테두리 두 겹
                    : slot.isTopRecommendation
                      ? "border-[#f59a58] bg-[#fff7f0]" // 추천 상위 강조
                      : "border-[#eeeeee] bg-white",
                ].join(" ")}
              >
                {/* 헤더 줄: (방장만) 선택 동그라미 + 날짜/시간(누르면 펼치기/접기) */}
                <div className="flex w-full items-center gap-2">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)} // 이 카드를 확정 후보로 선택
                      aria-label="이 시간으로 확정하기"
                      aria-pressed={selected}
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                        selected
                          ? "border-[#f59a58] bg-[#f59a58] text-white" // 선택됨 : 체크 표시
                          : "border-[#d9d9d9] bg-white text-transparent", // 안 선택됨: 빈 동그라미
                      ].join(" ")}
                    >
                      <Check size={12} />
                    </button>
                  )}

                    <button
                      type="button"
                      onClick={() => toggle(slot.id)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="text-[15px] font-bold text-[#2d2d2d]">
                        {formatResultDate(slot.startDate)} {slot.startTime} ~{" "}
                        {slot.endTime}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#9b9b9b] transition ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                </div>
                

                {/* 가능 라벨 (항상 표시) */}
                <p className="mt-3 text-[13px] font-bold text-[#e07b34]">
                  {slot.recommendationLabel}
                </p>

                {/* 상세 (펼쳤을 때만) */}
                {open && (
                  <>
                    {names && names.available.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {names.available.map((n) => (
                          <span
                            key={n}
                            className="rounded-full bg-[#ffe6d2] px-2.5 py-1 text-[12px] font-semibold text-[#e07b34]"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 text-[13px] font-bold text-[#9b9b9b]">
                      {result.totalParticipants}명 중 {slot.unavailableCount}명
                      불가능
                    </p>
                    {names && names.unavailable.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {names.unavailable.map((n) => (
                          <span
                            key={n}
                            className="rounded-full bg-[#f4f4f4] px-2.5 py-1 text-[12px] font-semibold text-[#9b9b9b]"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 바 */}
      <div className="shrink-0 border-t border-[#f0f0f0] px-6 pb-6 pt-4">
        {/* 실시간 등록 현황(초대 화면)으로 */}
        <button
          type="button"
          onClick={() => navigate(`/invite/${inviteToken}`)}
          className="rounded-full bg-[#f4f4f4] px-3 py-1.5 text-[12px] font-semibold text-[#777777]"
        >
          실시간 일정 등록 현황
        </button>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="홈으로"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#f0dccb] text-[#f59a58]"
          >
            <Home size={22} />
          </button>
          <Button
            type="button"
            variant="orange"
            fullWidth
            // 참여자면 항상 비활성 / 방장이어도 선택 전, 요청 중이면 비활성
            disabled={!isOwner || selectedSlotId === null || confirming}
            onClick={handleConfirm}
          >
            {confirming ? "확정하는 중..." : "약속 확정하기"}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default InviteResultPage;
