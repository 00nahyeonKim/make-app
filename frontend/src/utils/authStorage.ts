/**
 * JWT 토큰은 저장하지 않고,
 * 로그인 사용자 정보만 localStorage에 저장/조회/삭제하는 유틸
 */

import type { AuthUser } from "../types/auth";

/**
 * localStorage key 모음
 */
const STORAGE_KEYS = {
    AUTH_USER: "make_app_auth_user",
} as const;

/**
 * 브라우저 환경인지 확인(현재 환경에서 localStorage를 사용할 수 있는지 확인)
 */
function canUseStorage() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * localStorage에서 꺼낸 값이 AuthUser 타입의 객체인지 검사
 * 
 * @param value : unknown으로 받고 직접 검사
 * localStorage에서 꺼낸 값은 문자열이고 JSON.parse() 하면 어떤 값이든 나올 수 있기 때문
 * @returns true를 반환하면 value는 AuthUser 타입
 */
function isAuthUser(value: unknown): value is AuthUser {
    // value가 객체거나 null이 아닌지 확인
    if (typeof value !== "object" || value === null) {
        return false;
    }

    // AuthUser의 모든 속성을 선택적으로 만듬
    const user = value as Partial<AuthUser>;

    // id가 number인지, name이 string인지 확인
    return typeof user.id === "number" && typeof user.name === "string";
}

/**
 * 로그인 사용자 정보를 localStorage에 저장
 * 
 * 저장 목적: 새로고침 후 화면에 사용자 이름을 빠르게 복원
 */
export function saveAuthUserToStorage(user: AuthUser) {
    if (!canUseStorage()) {
        return;
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
}

/**
 * localStorage에서 로그인 사용자 정보 꺼내기
 *
 * 값이 없거나, JSON 파싱에 실패하거나, AuthUser 형태가 아니면 null을 반환
 */
export function getAuthUserFromStorage(): AuthUser | null {
    // localStorage 사용할 수 없는 환경이면 null 반환
    if (!canUseStorage()) {
        return null;
    }

    // localStorage에서 로그인 사용자 정보 문자열을 꺼냄
    const storedValue = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

    // 저장된 사용자 정보가 없으면 null 반환
    if (!storedValue) {
        return null;
    }

    try {
        // JSON.parse로 localStorage에 저장된 JSON 문자열을 객체로 변환
        const parsedValue: unknown = JSON.parse(storedValue);

        // 변환한 값이 AuthUser 형태인지 검사하고, 아니면 잘못된 데이터이므로 삭제 후 null 반환
        if (!isAuthUser(parsedValue)) {
            removeAuthUserFromStorage();
            return null;
        }

        // AuthUser 형태이면 사용자 정보 반환
        return parsedValue;
    } catch {
        // JSON.parse 중 에러 발생하면 깨진 데이터이므로 삭제 후 null 반환
        removeAuthUserFromStorage();
        return null;
    }
}

/**
 * localStorage에 저장된 사용자 정보 삭제
 */
export function removeAuthUserFromStorage() {
    if (!canUseStorage()) {
        return;
    }

    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
}