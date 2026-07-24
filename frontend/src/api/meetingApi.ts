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

/**
 * 일정 확정 (방장만)
 * POST /api/meetings/{meetingId}/confirm
 * body: { confirmedSlotId }
 *
 * 로그인 쿠키가 필요하며, 서버가 "요청자 == 주최자"인지 다시 검사
 * 응답에는 confirmedSlot과 resultToken(이동할 결과 주소)이 담겨옴
 */
export function confirmMeeting(
  meetingId: number,
  confirmedSlotId: number,
): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/api/meetings/${meetingId}/confirm`, {
    method: "POST",
    body: { confirmedSlotId }, // request()가 JSON.stringify 해서 보냄
  });
}
