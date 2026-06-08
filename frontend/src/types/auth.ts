/** 
 * 로그인한 소셜 사용자 정보
 * 
 * 백엔드 AuthResponse.UserInfo와 맞춘 타입
 */
export interface AuthUser {
    id: number;
    name: string;
}

/**
 * 카카오로그인 콜백 요청 타입
 * 
 * 프런트의 KakaoCallbackPage에서 URL query string의 code를 꺼낸 뒤
 * 백엔드 /api/auth/kakao/callback으로 보낼 때 사용
 */
export interface KakaoCallbackRequest {
    code: string;
}

/**
 * 카카오로그인 성공시 백엔드가 data 안에 내려주는 응답 타입
 * 
 * 브라우저 프런트에서는 localStorage에 저장하지 않고
 * 실제 인증은 백엔드가 Set-Cookie로 내려준 HttpOnly Cookie가 담당
 */
export interface AuthLoginResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

/**
 * 토큰 재발급 응답 타입
 */
export interface RefreshAccessTokenResponse {
    accessToken: string;
}

/**
 * 프런트에서 관리할 로그인 상태
 * 
 * checking: 앱 시작시 로그인 여부 확인 중
 * authenticated: 로그인된 상태
 * unauthenticated: 로그인되지 않은 상태
 */
export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * Zustand authStore의 전체 상태 타입
 */
export interface AuthState {
    user: AuthUser | null; // 현재 로그인한 사용자 정보, 비로그인 상태면 null
    status: AuthStatus;  // 현재 인증 상태
    isLoggedIn: boolean;  // 로그인 여부를 화면에서 쉽게 쓰기 위한 값
    setChecking: () => void;  // 앱 시작시 또는 인증 확인 API 호출 전에 상태를 checking으로 바꿀 때 사용
    setAuthenticated: (user: AuthUser) => void;  // 로그인 성공시 사용자 정보를 저장하고 로그인 상태로 변경
    setUnauthenticated: () => void;  // 로그아웃 또는 401 발생시 인증 상태 초기화
    updateUser: (user: AuthUser) => void;  // 사용자 이름 변경 등 사용자 정보만 갱신할 때 사용
}