import type { MeetingStatus } from "./meeting";

// 결과 슬롯 1개 (서버가 집계한 값)
export type ResultSlot = {
  id: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  startTime: string; // "HH:mm"
  endTime: string;
  availableCount: number; // 가능 인원 수
  unavailableCount: number; // 불가능 인원 수
  recommendationLabel: string; // "5명 중 4명 가능"
  durationMinutes: number; // 만남 길이(분)
  isTopRecommendation: boolean; // 추천 상위면 true (강조 대상)
};

// 확정된 슬롯 (확정 전이면 null)
export type ConfirmedSlot = {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

// GET /api/meetings/{inviteToken}/results 응답 data
export type ResultResponse = {
  meetingId: number;
  meetingName: string;
  status: MeetingStatus;
  totalParticipants: number; // 참여 등록 인원
  submittedParticipants: number; // 응답 완료 인원
  confirmedSlot: ConfirmedSlot | null;
  slots: ResultSlot[];
};

// 정렬 기준
export type ResultSort = "recommend" | "date" | "duration";
