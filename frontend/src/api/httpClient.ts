import type { ApiResponse } from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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
