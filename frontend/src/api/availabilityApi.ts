import type {
  AvailabilitiesStatus,
  SubmitAvailabilitiesRequest,
  SubmitAvailabilitiesResponse,
} from "../types/availability";
import { request } from "./httpClient";

/**
 * 본인 응답 등록/수정(UPSERT)
 * PUT /api/meetings/{inviteToken}/availabilities
 * 인증: Cookie(소셜/게스트 공통) - request()가 credentials로 자동 전송
 */
export function submitAvailabilities(
  inviteToken: string,
  body: SubmitAvailabilitiesRequest,
): Promise<SubmitAvailabilitiesResponse> {
  return request<SubmitAvailabilitiesResponse>(
    `/api/meetings/${inviteToken}/availabilities`,
    {
      method: "PUT",
      body, // request()가 JSON.stringify 해서 보냄
    },
  );
}

/**
 * 응답 현황 조회 (모든 참여자의 가능/불가 목록)
 * GET /api/meetings/{inviteToken}/availabilities
 * 인증: Public - 결과 화면에서 사용
 */
export function getAvailabilities(
  inviteToken: string,
): Promise<AvailabilitiesStatus> {
  return request<AvailabilitiesStatus>(
    `/api/meetings/${inviteToken}/availabilities`,
  );
}
