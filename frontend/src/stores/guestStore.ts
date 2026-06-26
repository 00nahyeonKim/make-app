import { create } from "zustand";
import type { Participant } from "../types/participant";

type GuestState = {
  guest: Participant | null; // 이 브라우저에서 참여한 게스트(없으면 null)
  setGuest: (guest: Participant) => void;
  clearGuest: () => void;
};

export const useGuestStore = create<GuestState>((set) => ({
  guest: null,
  setGuest: (guest) => set({ guest }),
  clearGuest: () => set({ guest: null }),
}));
