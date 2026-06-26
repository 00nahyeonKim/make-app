import { useState } from "react";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { Check, Copy } from "lucide-react";
import Button from "./Button";

type ShareModalProps = {
  open: boolean; // 열림 여부
  inviteUrl: string; // 복사할 초대 링크
  onClose: () => void; // 닫기 요청
};

function ShareModal({ open, inviteUrl, onClose }: ShareModalProps) {
  const { copy } = useCopyToClipboard();
  const [showCopied, setShowCopied] = useState(false); // 복사 완료 모달 표시 여부

  // 닫혀 있으면 아무것도 안 그림
  if (!open) return null;

  // 복사 실행 -> 성공하면 확인 모달 표시
  const handleCopy = async () => {
    const ok = await copy(inviteUrl);
    if (ok) setShowCopied(true);
  };

  // 확인 모달의 "확인" -> 전체 닫기
  const handleConfirmClose = () => {
    setShowCopied(false);
    onClose();
  };

  // (2단계) 복사 완료 확인 모달 - 가운데
  if (showCopied) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center px-10">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative w-full max-w-75 rounded-2xl bg-white px-6 pb-6 pt-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fde3cf]">
            <Check size={26} className="text-[#f59a58]" />
          </div>
          <p className="mt-3 text-[17px] font-bold text-[#2d2d2d]">
            복사되었습니다!
          </p>
          <p className="mt-1 text-[13px] text-[#8a8a8a]">
            친구들에게 공유해보세요
          </p>
          <Button
            type="button"
            variant="orange"
            fullWidth
            onClick={handleConfirmClose}
            className="mt-5"
          >
            확인
          </Button>
        </div>
      </div>
    );
  }

  // (1단계) 공유 바텀시트 - 하단
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      {/* 어두운 배경 (누르면 닫힘) */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* 바텀시트 본체 */}
      <div className="relative w-full rounded-t-3xl bg-white px-6 pb-7 pt-6">
        <p className="text-[16px] font-bold text-[#2d2d2d]">
          모임의 공유 링크가 생성되었어요
        </p>
        <p className="mt-1 text-[14px] text-[#8a8a8a]">
          친구들이 가능한 일정을 알아보세요
        </p>

        {/* URL + 복사 아이콘 */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
          <p className="flex-1 truncate text-[13px] text-[#555555]">
            {inviteUrl}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="링크 복사"
            className="shrink-0 text-[#9b9b9b] transition hover:text-[#f59a58]"
          >
            <Copy size={18} />
          </button>
        </div>

        <Button
          type="button"
          variant="dark"
          fullWidth
          onClick={handleCopy}
          className="mt-5"
        >
          지금 공유할께요
        </Button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-[13px] font-semibold text-[#9b9b9b]"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}

export default ShareModal;
