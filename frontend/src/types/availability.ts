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
