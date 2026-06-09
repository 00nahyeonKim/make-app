import type { ApiResponse } from "../types/api";
import type { AuthLoginResponse, KakaoCallbackRequest } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 카카오 로그인 콜백 API
 */
export async function loginWithKakao(
    code: string,
): Promise<AuthLoginResponse> {
    // 백엔드에 보낼 요청 body를 만듬
    const requestBody: KakaoCallbackRequest = {
        code,
    };

    // 백엔드 카카오 로그인 콜백 API를 호출
    const response = await fetch(`${API_BASE_URL}/api/auth/kakao/callback`, {
        method: "POST",

        // 요청 body가 JSON 형식이라는 것을 백엔드에 알림
        headers: {
            "Content-Type": "application/json",
        },

        // HttpOnly Cookie를 주고받기 위해 필요
        credentials: "include",

        // JavaScript 객체를 JSON 문자열로 바꿔서 보냄
        body: JSON.stringify(requestBody),
    });

    // 백엔드 응답 JSON을 JavaScript 객체로 변환하고 타입을 지정
    const result = (await response.json()) as ApiResponse<AuthLoginResponse>;

    // HTTP 상태 코드가 실패이거나, 응답 body의 success가 false이면 에러 처리
    if (!response.ok || !result.success) {
        // 백엔드가 error.message를 내려줬으면 그 메시지 사용하고, 아니면 기본 에러 메시지 사용
        const message = !result.success
            ? result.error.message
            : "카카오 로그인에 실패했습니다.";

        // 이 함수를 호출한 KakaoCallbackPage의 catch로 에러를 넘김
        throw new Error(message);
    }

    // 성공 응답의 data만 반환
    return result.data;
}