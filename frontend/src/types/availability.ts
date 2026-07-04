// 슬롯 1개에 대한 내 응답 상태
export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE";

// 서버로 보낼 응답 1건 (PUT body의 availabilities 배열 항목)
// startTime/endTime은 "부분 시간만 가능"할 때만 채운다. 없으면 슬롯 전체 가능.
export type AvailabilityInput = {
  candidateSlotId: number;
  status: AvailabilityStatus;
  startTime?: string; // "HH:mm" (선택)
  endTime?: string; // "HH:mm" (선택)
};

// PUT /api/meetings/{inviteToken}/availabilities 요청 body
export type SubmitAvailabilitiesRequest = {
  availabilities: AvailabilityInput[];
};

// PUT 응답 - 서버가 반영한 건수를 돌려준다
export type SubmitAvailabilitiesResponse = {
  updatedCount: number;
};

// GET 현황 조회에서 슬롯별로 나오는 참여자 1명
// startTime/endTime은 "부분 시간만 가능"으로 응답한 사람에게만 있다
export type ParticipantAvailability = {
  id: number;
  displayName: string;
  startTime?: string; // "HH:mm" (선택)
  endTime?: string; // "HH:mm" (선택)
};

// GET 현황 조회 - 슬롯 1개의 가능/불가 현황
export type AvailabilitySlotStatus = {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableParticipants: ParticipantAvailability[];
  unavailableParticipants: ParticipantAvailability[];
};

// GET /api/meetings/{inviteToken}/availabilities 응답 data
export type AvailabilitiesStatus = {
  slots: AvailabilitySlotStatus[];
};
