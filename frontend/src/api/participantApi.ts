import type { Participant } from "../types/participant";
import { request } from "./httpClient";

/**
 * 소셜 회원 참여 등록
 * POST /api/meetings/{inviteToken}/participants
 * 본문 없음 - 누구인지는 서버가 로그인 쿠키로 판단
 */
export function createParticipant(
  inviteToken: string,
  displayName?: string, // 동명 충돌 시 별칭 재요청에만 사용
): Promise<Participant> {
  return request<Participant>(`/api/meetings/${inviteToken}/participants`, {
    method: "POST",
    body: displayName ? { displayName } : undefined,
  });
}
