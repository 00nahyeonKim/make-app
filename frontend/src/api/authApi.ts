import type {
  AuthLoginResponse,
  KakaoCallbackRequest,
  RefreshAccessTokenResponse,
} from "../types/auth";
import { request } from "./httpClient";

/**
 * 카카오 로그인 콜백 API
 *
 * 카카오가 발급한 인가 코드를 백엔드에 전달
 * 백엔드는 로그인 처리 후 access_token과 refresh_token을
 * HttpOnly Cookie로 발급함
 */
export function loginWithKakao(code: string): Promise<AuthLoginResponse> {
  // 백엔드에 보낼 요청 body를 만듬
  const requestBody: KakaoCallbackRequest = {
    code,
  };
  return request<AuthLoginResponse>("/api/auth/kakao/callback", {
    method: "POST",
    body: requestBody,
  });
}
/**
 * Access Token 재발급 API
 *
 * refresh_token은 HttpOnly Cookie로 저장되어 있으므로
 * 프런트엔드에서 직접 읽거나 request body에 넣지 않음
 *
 * 브라우저가 request()의 credentials: "include" 설정을 통해
 * refresh_token Cookie를 자동으로 백엔드에 전달
 */
export function refreshAccessToken(): Promise<RefreshAccessTokenResponse> {
  return request<RefreshAccessTokenResponse>("/api/auth/refresh", {
    method: "POST",
  });
}

/**
 * 로그아웃 API
 *
 * 백엔드는 access_token과 refresh_token Cookie를
 * Max-Age=0으로 내려 브라우저에서 삭제
 *
 * 성공 응답은 204 No Content이므로 반환 데이터가 없음
 */
export function logout(): Promise<void> {
  return request<void>("/api/auth/logout", {
    method: "POST",
  });
}
