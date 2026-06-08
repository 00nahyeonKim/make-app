import { create } from "zustand";
import {
  getAuthUserFromStorage,
  removeAuthUserFromStorage,
  saveAuthUserToStorage,
} from "../utils/authStorage";
import type { AuthState } from "../types/auth";

// 앱이 처음 실행될 때 localStorage에서 사용자 정보를 복원
// localStorage에 저장된 값이 없으면 null이 들어감
const storedUser = getAuthUserFromStorage();

export const useAuthStore = create<AuthState>((set) => ({
  // 현재 로그인한 사용자 정보 - 로그인 상태면 AuthUser 객체, 비로그인 상태면 null
  user: storedUser,
  // 현재 인증 상태 - localStorage에 사용자 정보 있으면 일단 로그인 상태로 봄
  status: storedUser ? "authenticated" : "unauthenticated",
  // 로그인 여부를 true/false로 쉽게 확인하기 위한 값
  isLoggedIn: storedUser !== null,

  // 인증 확인 중 상태로 변경
  setChecking: () => {
    set({
      status: "checking",
    });
  },

  // 로그인 성공 시 호출하는 함수
  setAuthenticated: (user) => {
    // 새로고침 후 사용자 이름 등을 복원하기 위해 localStorage에 저장
    saveAuthUserToStorage(user);

    // Zustand 상태를 로그인 상태로 변경
    set({
      user,
      status: "authenticated",
      isLoggedIn: true,
    });
  },

  // 로그아웃 또는 인증 만료 시 호출하는 함수
  setUnauthenticated: () => {
    //localStorage에 저장된 사용자 정보 삭제
    removeAuthUserFromStorage();

    // Zustand 상태를 비로그인 상태로 변경
    set({
      user: null,
      status: "unauthenticated",
      isLoggedIn: false,
    });
  },

  // 로그인된 사용자의 정보를 갱신할 때 호출하는 함수
  updateUser: (user) => {
    // localStorage 사용자 정보 갱신
    saveAuthUserToStorage(user);

    // Zustand 사용자 정보 갱신
    set({
      user,
      isLoggedIn: true,
      status: "authenticated",
    });
  },
}));
