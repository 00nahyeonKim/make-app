// 참가자 유형
export type ParticipantType = "LEADER" | "MEMBER" | "GUEST";

// 참가자 정보 (백엔드 ParticipantResponse와 동일)
export type Participant = {
  id: number;
  displayName: string;
  type: ParticipantType;
  submitted: boolean; // 가용 시간 제출 완료 여부
  submittedAt: string | null;
};

// 비회원 게스트 등록 요청 body
export type GuestRegisterRequest = {
  inviteToken: string;
  displayName: string; // 닉네임 (최대 50자)
  pin: string; // 숫자 4자리
};

// 응답 완료(submit) POST 응답 - 완료 시각을 돌려줌
export type SubmitParticipationResponse = {
  submittedAt: string;
};
