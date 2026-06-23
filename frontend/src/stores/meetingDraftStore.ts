import { create } from "zustand";
import type { DraftSlot, MeetingDraft } from "../types/meeting";

// 스토어가 들고 있을 "상태값" + "상태를 바꾸는 함수들" 타입
type MeetingDraftState = MeetingDraft & {
  // 1페이지(모임명,인원)에서 받은 기본 정보 저장
  setBasicInfo: (info: { name: string; expectedCount: number | null }) => void;
  addSlot: (slot: DraftSlot) => void; // 슬롯 1개 추가
  removeSlot: (id: string) => void; // 특정 id의 슬롯 삭제
  reset: () => void; // 전부 초기화
};

// 처음 상태값 - 나중에 reset에서도 재사용
const initialState: MeetingDraft = {
  name: "",
  expectedCount: null,
  slots: [],
};

export const useMeetingDraftStore = create<MeetingDraftState>((set) => ({
  // 초기 상태 펼치기
  ...initialState,

  // 기본 정보 저장: 받은 값만 덮어쓰기
  setBasicInfo: (info) => {
    set({
      name: info.name,
      expectedCount: info.expectedCount,
    });
  },

  // 추가: 기존 slots을 펼치고(...) 뒤에 새 슬롯을 붙인 새 배열로 교체
  addSlot: (slot) => {
    set((state) => ({
      slots: [...state.slots, slot],
    }));
  },

  // 삭제: id가 다른 것만 남긴 새 배열(= 그 id를 제외)
  removeSlot: (id) => {
    set((state) => ({
      slots: state.slots.filter((slot) => slot.id !== id),
    }));
  },

  // 처음 상태로 되돌리기
  reset: () => {
    set({ ...initialState });
  },
}));
