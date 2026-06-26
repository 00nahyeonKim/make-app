import { useState } from "react";

// 텍스트를 클립보드에 복사하고, 잠깐 "복사됨" 상태를 보여주는 커스텀 훅
export function useCopyToClipboard(resetDelay = 1500) {
  const [copied, setCopied] = useState(false);

  // 복사 실행 함수 (성공하면 true, 실패하면 false 반환)
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // 일정 시간 뒤 "복사됨" 표시를 자동으로 끈다
      setTimeout(() => setCopied(false), resetDelay);
      return true;
    } catch {
      // 권한 거부 / 구형 브라우저 / http(보안 컨텍스트 아님) 등
      setCopied(false);
      return false;
    }
  };
  return { copied, copy };
}
