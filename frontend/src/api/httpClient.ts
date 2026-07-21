import { useAuthStore } from "../stores/authStore";
import type { ApiResponse } from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// refresh 자체가 401일 때 다시 refresh를 부르지 않도록 경로를 상수로 둠
const AUTH_REFRESH_PATH = "/api/auth/refresh";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * 프로젝트에서 공통으로 사용하는 API 요청 함수
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false, // 재시도로 들어온 호출인지 표시
): Promise<T> {
  const { body, headers: customHeaders, ...requestOptions } = options;
  const headers = new Headers(customHeaders);

  // body가 있으면 JSON 요청으로 설정
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,

      // HttpOnly Cookie 자동 전송
      credentials: "include",

      // 객체를 JSON 문자열로 변환
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
  }

  // 재시도가 아니고 refresh 요청 자체가 아닐 때만 시도
  if (
    response.status === 401 &&
    !isRetry &&
    path !== AUTH_REFRESH_PATH
  ) {
    try {
      // refresh_token 쿠키로 새 access_token 쿠키를 받음
      await request<unknown>(AUTH_REFRESH_PATH, {method: "POST"}, true);
    } catch {
      // refresh도 실패 = 세션 만료 -> 프론트 상태 정리 후 원래 에러 전달
      useAuthStore.getState().setUnauthenticated();
      throw new ApiError(
        "로그인이 필요해요. 먼저 로그인을 진행해주세요.",
        "UNAUTHORIZED",
        401,
      );
    }
    // refresh 성공 -> 원래 요청을 딱 1번 재시도
    return request<T>(path, options, true);
  }
  
  /**
   * 로그아웃 API는 204 No Content를 반환하므로
   * JSON 변환 없이 종료
   */
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const result = text ? (JSON.parse(text) as ApiResponse<T>) : null;

  /**
   * HTTP 상태가 실패하거나
   * 백엔드 응답의 success가 false인 경우
   */
  if (!response.ok || !result || !result.success) {
    const code = result && !result.success ? result.error.code : "HTTP_ERROR";
    const message =
      result && !result.success
        ? result.error.message
        : response.status === 401 || response.status === 403
          ? "로그인이 필요해요. 먼저 로그인을 진행해주세요."
          : `요청 처리에 실패했습니다. (${response.status})`;
    throw new ApiError(message, code, response.status);
  }

  return result.data;
}

/**
 * catch에서 에러 메시지를 안전하게 꺼내는 함수
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "요청 처리 중 오류가 발생했습니다.",
): string {
  return error instanceof Error ? error.message : fallbackMessage;
}
