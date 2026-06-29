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

function InvitePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>(); // 동적 파라미터
  const navigate = useNavigate();
  const created = useMeetingDraftStore((state) => state.created);
  const guest = useGuestStore((state) => state.guest);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
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
        <div className="mt-3 text-right text-[14px] font-bold text-[#f59a58]">
          0{" "}
          <span className="text-[#c4c4c4]">
            / {meeting.expectedCount ?? "-"}
          </span>
        </div>
        <div className="mt-2 h-px w-full bg-[#eeeeee]" />
        <span className="mt-3 inline-block rounded-full bg-[#f4f4f4] px-3 py-1 text-[12px] font-semibold text-[#9b9b9b]">
          아직 참여한 사람이 없습니다
        </span>

        {/* 실시간 등록 현황 */}
        <h2 className="mt-7 text-[16px] font-bold text-[#2d2d2d]">
          실시간 등록 현황
        </h2>
        <div className="mt-3 flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#e0e0e0] text-center text-[13px] font-semibold text-[#c4c4c4]">
          참여자가 시간을 등록하면 여기에 표시돼요
          <span className="mt-1 text-[11px]">(그리드 만들 예정)</span>
        </div>

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
            onClick={() => {
              // TODO(4주차): 결과 정렬/우선순위 화면으로 이동
            }}
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
