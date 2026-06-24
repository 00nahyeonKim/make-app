// 후보 슬롯 1개 (날짜 + 시작 시간 + 종료 시간)
export type CandidateSlot = {
  slotDate: string; // "YYYY-MM-DD" 형식
  startTime: string; // "HH:mm"형식
  endTime: string; // "HH:mm"형식
};

// 화면에서만 쓰는 슬롯 (목록에서 삭제/구분하기 위한 고유 id가 붙음)
export type DraftSlot = CandidateSlot & {
  id: string; // 화면 구분용 임시 id
  endDate: string; // 종료 날짜(하루 모드면 slotDate와 동일, 기간 모드면 마지막 날)
};

// 모임 생성 과정에서 페이지를 넘나들며 모으는 임시 데이터 묶음
export type MeetingDraft = {
  name: string; // 약속 이름
  expectedCount: number | null; // 예상 인원 (안 정했으면 null)
  slots: DraftSlot[]; // 추가한 후보 슬롯들
};
