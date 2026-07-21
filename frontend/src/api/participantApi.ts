import type {
  Participant,
  SubmitParticipationResponse,
} from "../types/participant";
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

/**
 * 본인 응답 완료 처리
 * POST /api/meetings/{inviteToken}/availabilities/submit
 * 본문 없음 - 누구인지는 서버가 쿠키(소셜/게스트)로 판단, submitted_at을 채움
 */
export function submitMyParticipation(
  inviteToken: string,
): Promise<SubmitParticipationResponse> {
  return request<SubmitParticipationResponse>(
    `/api/meetings/${inviteToken}/availabilities/submit`,
    { method: "POST" }, // body 없음
  );
}

export function getMyParticipation(inviteToken: string) {
  return request<{
    id: number;
    displayName: string;
    type: string;
    submittedAt: string | null;
    availabilities: unknown[];
  }>(`/api/meetings/${inviteToken}/participants/me`, { method: "GET" });
}
