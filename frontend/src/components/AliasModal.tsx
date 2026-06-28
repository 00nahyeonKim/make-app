import { useState } from "react";
import Button from "./Button";

type AliasModalProps = {
  open: boolean; // 열림 여부
  loading?: boolean; // 재요청 중
  error?: string; // 별칭도 중복 등 에러
  onSubmit: (alias: string) => void; // 별칭 제출
  onClose: () => void; // 닫기 (배경 클릭/취소)
};

function AliasModal({
  open,
  loading,
  error,
  onSubmit,
  onClose,
}: AliasModalProps) {
  const [alias, setAlias] = useState("");

  // 닫혀 있으면 아무것도 안 그림(ShareModal과 동일)
  if (!open) return null;

  return (
    // ShareModal의 '복사 완료' 가운데 카드 패턴 그대로
    <div className="absolute inset-0 z-50 flex items-center justify-center px-10">
      {/* 어두운 배경 (누르면 닫힘) - ShareModal 바텀시트와 동일 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative w-full max-w-75 rounded-2xl bg-white px-6 pb-6 pt-7 text-center">
        <p className="text-[17px] font-bold text-[#2d2d2d]">
          이 모임에서 쓸 별칭
        </p>
        <p className="mt-1 text-[13px] text-[#8a8a8a]">
          같은 이름이 이미 있어요. <br/> 이 모임에서 사용할 별칭을 입력해주세요.
        </p>

        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          maxLength={20}
          placeholder="별칭을 입력하세요"
          className="mt-4 h-12 w-full rounded-lg border border-[#cfcfcf] px-4 text-center outline-none focus:border-[#f59a58]"
        />

        {error && (
          <p className="mt-2 text-xs font-semibold text-[#fc3a3a]">{error}</p>
        )}

        <Button
          type="button"
          variant="orange"
          fullWidth
          disabled={loading || !alias.trim()}
          onClick={() => onSubmit(alias.trim())}
          className="mt-5"
        >
          {loading ? "참여 중..." : "별칭으로 참여하기"}
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

export default AliasModal;
