import type {
  CreateMeetingRequest,
  CreateMeetingResponse,
  MeetingDetail,
} from "../types/meeting";
import { request } from "./httpClient";

/**
 * 모임 생성(리더)
 * POST /api/meetings
 * 로그인 쿠키가 필요하며, requests()가 credentials로 자동 전송
 */
export function createMeeting(
  body: CreateMeetingRequest,
): Promise<CreateMeetingResponse> {
  return request<CreateMeetingResponse>("/api/meetings", {
    method: "POST",
    body, // request()가 JSON.stringify 해서 보냄
  });
}

/**
 * 초대 URL로 모임 조회 (팔로워 첫 진입)
 * GET /api/meetings/invite/{inviteToken}
 */
export function getMeetingByInviteToken(
  inviteToken: string,
): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/api/meetings/invite/${inviteToken}`);
}

/**
 * 결과 URL로 모임 조회 (결과 화면)
 * GET /api/meetings/result/{resultToken}
 */
export function getMeetingByResultToken(
  resultToken: string,
): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/api/meetings/result/${resultToken}`);
}
