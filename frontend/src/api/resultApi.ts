import type { ResultResponse, ResultSort } from "../types/result";
import { request } from "./httpClient";

/**
 * 결과 화면 데이터 조회 (집계 + 추천 + 정렬)
 * GET /api/meetings/{inviteToken}/results?sort=recommend
 * 인증: Public
 */
export function getResults(
  inviteToken: string,
  sort: ResultSort = "recommend", // 안 넘기면 추천순
): Promise<ResultResponse> {
  return request<ResultResponse>(
    `/api/meetings/${inviteToken}/results?sort=${sort}`,
  );
}
