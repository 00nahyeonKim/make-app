import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import type { MeetingDetail, ServerSlot } from "../types/meeting";
import { getMeetingByResultToken } from "../api/meetingApi";
import { getApiErrorMessage } from "../api/httpClient";
import LoadingSpinner from "../components/LoadingSpinner";
import { buildResultUrl } from "../utils/urlBuilder";
import Header from "../layouts/Header";
import { CalendarCheck, Home, Share2 } from "lucide-react";
import Button from "../components/Button";
import ShareModal from "../components/ShareModal";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-06-01" -> "06월 01일 (월)"
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${String(m).padStart(2, "0")}월 ${String(d).padStart(2, "0")}일 (${weekday})`;
}

// InviteResultPage에서 navigate(..., { state })로 보내준 값의 모양
type ConfirmedNavState = { confirmedSlot?: ServerSlot | null } | null;

function ResultSharePage() {
  // URL의 :resultToken 부분을 꺼냄(/result/토큰)
  const { resultToken } = useParams<{ resultToken: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 방금 확정하고 넘어온 경우에만 값이 있음 (새로고침하면 사라짐)
  const passedSlot =
    (location.state as ConfirmedNavState)?.confirmedSlot ?? null;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareOpen, setShareOpen] = useState(false); // 공유 모달 열림 여부

  // 결과 토큰으로 모임 상태 조회
  useEffect(() => {
    if (!resultToken) return;
    setLoading(true);
    getMeetingByResultToken(resultToken)
      .then(setMeeting)
      .catch((e) => setError(getApiErrorMessage(e, "결과를 불러올 수 없어요.")))
      .finally(() => setLoading(false));
  }, [resultToken]);

  // 로딩 중
  if (loading) {
    return <LoadingSpinner fullScreen message="결과를 불러오는 중이에요" />;
  }

  // 에러 / 잘못된 접근
  if (error || !meeting || !resultToken) {
    return (
      <section className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[15px] font-bold text-[#2d2d2d]">
          {error || "결과를 불러올 수 없어요."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 rounded-full bg-[#f4f4f4] px-4 py-2 text-[13px] font-semibold text-[#777777]"
        >
          홈으로
        </button>
      </section>
    );
  }

  // 일정이 확정됐는지 판단 (status가 CONFIRMED이고 확정 슬롯이 있으면)
  // ① 방금 확정하고 넘어왔으면 그 값을 바로 사용(서버 재조회를 기다리지 않음)
  // ② 아니면(링크로 직접 들어옴/새로고침) 서버에서 조회한 모임 상태 사용
  const confirmed =
    passedSlot ??
    (meeting.status === "CONFIRMED" && meeting.confirmedSlot
      ? meeting.confirmedSlot
      : null);

  // 공유할 결과 URL (지금 앱 도메인 기준으로 다시 만듦)
  const resultUrl = buildResultUrl(resultToken);

  return (
    <section className="flex h-full flex-col bg-white">
      <Header title={meeting.name} showMenu />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {confirmed ? (
          // -- 확정된 경우: 최종 일정 카드 --
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fde3cf]">
              <CalendarCheck size={28} className="text-[#f59a58]" />
            </div>
            <h1 className="mt-4 text-center text-[20px] font-bold text-[#2d2d2d]">
              {"약속이 확정되었어요!"}
            </h1>

            <div className="mt-5 rounded-2xl border border-[#f59a58] bg-[#fff7f0] p-5 text-center">
              <p className="text-[13px] font-semibold text-[#e07b34]">
                확정된 일정
              </p>
              <p className="mt-2 text-[18px] font-bold text-[#2d2d2d]">
                {formatDate(confirmed.startDate)}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-[#555555]">
                {confirmed.startTime} ~ {confirmed.endTime}
              </p>
            </div>
          </>
        ) : (
          // -- 아직 확정 전 / 취소, 만료된 경우 --
          <div className="mt-10 text-center">
            <h1 className="text-[18px] font-bold text-[#2d2d2d]">
              {meeting.status === "CANCELLED"
                ? "취소된 모임이에요"
                : meeting.status === "EXPIRED"
                  ? "마감된 모임이에요"
                  : "아직 일정이 확정되지 않았어요"}
            </h1>
            <p className="mt-2 text-[14px] text-[#8a8a8a]">
              리더가 일정을 확정하면 여기에 표시돼요
            </p>
          </div>
        )}
      </div>

      {/* 하단 바 */}
      <div className="shrink-0 border-t border-[#f0f0f0] px-6 pb-6 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="홈으로"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#f0dccb] text-[#f59a58]"
          >
            <Home size={22} />
          </button>
          <Button
            type="button"
            variant="orange"
            fullWidth
            onClick={() => setShareOpen(true)} // 공유 모달 열기
            className="flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            결과 링크 공유하기
          </Button>
        </div>
      </div>

      {/* 공유 모달 (링크 복사) */}
      <ShareModal
        open={shareOpen}
        inviteUrl={resultUrl}
        onClose={() => setShareOpen(false)}
      />
    </section>
  );
}

export default ResultSharePage;
