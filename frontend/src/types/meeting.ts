// 후보 슬롯 1개 (날짜 + 시작 시간 + 종료 시간)
export type CandidateSlot = {
  startDate: string; // "YYYY-MM-DD" 시작 날짜
  endDate: string; // "YYYY-MM-DD" 종료 날짜
  startTime: string; // "HH:mm"형식
  endTime: string; // "HH:mm"형식
};

// 화면에서만 쓰는 슬롯 (UI 명칭: slotDate=시작일) + 고유 id
export type DraftSlot = {
  id: string; // 화면 구분용 임시 id
  slotDate: string; // 시작 날짜 (UI 명칭)
  endDate: string; // 종료 날짜(하루 모드면 slotDate와 동일)
  startTime: string; // "HH:mm"형식
  endTime: string; // "HH:mm"형식
};

// 모임 생성 과정에서 페이지를 넘나들며 모으는 임시 데이터 묶음
export type MeetingDraft = {
  name: string; // 약속 이름
  expectedCount: number | null; // 예상 인원 (안 정했으면 null)
  slots: DraftSlot[]; // 추가한 후보 슬롯들
};

// 모임 상태값
export type MeetingStatus = "OPEN" | "CONFIRMED" | "EXPIRED" | "CANCELLED";

// 모임 생성 요청 body (POST /api/meetings 로 보냄)
export type CreateMeetingRequest = {
  name: string;
  expectedCount: number | null; // 안 정했으면 null
  candidateSlots: CandidateSlot[]; // 날짜별 후보 슬롯들
};

// 모임 생성 성공 시 서버가 data 안에 내려주는 응답
export type CreateMeetingResponse = {
  id: number;
  name: string;
  expectedCount: number | null;
  status: MeetingStatus;
  inviteToken: string; // 초대 토큰
  resultToken: string; // 결과 토큰
  inviteUrl: string; // 초대 URL (공유 화면에서 사용)
  resultUrl: string; // 결과 URL
  createdAt: string;
};

// 서버가 내려주는 후보 슬롯 (조회 시에 id가 붙어 있음)
export type ServerSlot = CandidateSlot & {
  id: number;
};

// 초대/결과 URL로 조회한 모임 상세 (GET 응답 data)
export type MeetingDetail = {
  id: number;
  name: string;
  expectedCount: number | null;
  status: MeetingStatus;
  ownerName?: string; // 초대 조회에만 있음
  isOwner?: boolean; // 로그인한 요청자가 이 모임의 방장이면 true
  resultToken?: string; // 확정 응답 등 방장 확인이 끝난 응답에만 들어옴
  candidateSlots?: ServerSlot[];
  confirmedSlot?: ServerSlot; // 확정된 경우에만 있음
  createdAt?: string;
};
