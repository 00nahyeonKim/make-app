import { useNavigate } from "react-router";
import { useMeetingDraftStore } from "../stores/meetingDraftStore";
import Button from "../components/Button";
import Header from "../layouts/Header";
import { useState } from "react";
import { buildInviteUrl } from "../utils/urlBuilder";
import { Plus, Share2 } from "lucide-react";
import ShareModal from "../components/ShareModal";

function InviteResultPage() {
  const navigate = useNavigate();
  const created = useMeetingDraftStore((state) => state.created);

  // 생성 직후 공유 모달을 자동으로 띄운다
  const [shareOpen, setShareOpen] = useState(true);

  // 새로고침 등으로 생성 결과가 없으면 만들기 화면으로 안내
  if (!created) {
    return (
      <section className="flex h-full flex-col items-center justify-center gap-4 bg-white px-6">
        <p className="text-sm font-semibold text-[#9b9b9b]">
          표시할 모임 정보가 없어요.
        </p>
        <Button onClick={() => navigate("/meetings/new")}>
          새 모임 만들기
        </Button>
      </section>
    );
  }

  // 모달에서 공유할 초대 링크
  const inviteUrl = buildInviteUrl(created.inviteToken);

  return (
    // relative: ShareModal의 absolute inset-0가 이 영역을 기준으로 덮게 함
    <section className="relative flex h-full flex-col bg-white">
      <Header
        title={created.name}
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
            / {created.expectedCount ?? "-"}
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
      </div>

      {/* 플로팅 + 버튼 */}
      <button
        type="button"
        aria-label="내 가능 시간 등록"
        onClick={() => {
          // TODO: navigate(`/invite/${created.inviteToken}` 등 가능시간 등록 화면
        }}
        className="absolute bottom-24 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#f59a58] text-white shadow-lg transition hover:bg-[#ef8840]"
      >
        <Plus size={24} />
      </button>

      {/* 하단 우선순위 보기 */}
      <div className="shrink-0 border-t border-[#f0f0f0] px-6 pb-6 pt-4">
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

export default InviteResultPage;
