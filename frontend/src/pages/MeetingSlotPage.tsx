import { useNavigate } from "react-router";
import { useMeetingDraftStore } from "../stores/meetingDraftStore";
import { useEffect, useRef, useState } from "react";
import Header from "../layouts/Header";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import Button from "../components/Button";
import type { CandidateSlot, DraftSlot } from "../types/meeting";
import { createMeeting } from "../api/meetingApi";
import { getApiErrorMessage } from "../api/httpClient";

// 요일 라벨 - getDay()는 0=일 ~ 6=토 를 돌려줌
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 연/월/일 => "YYYY-MM-DD" 문자열 (month는 0부터라 +1)
function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// 화면용 슬롯(DraftSlot[])을 서버용(CandidateSlot[])으로 변환
// 기간(slotDate~endDate) 슬롯은 하루씩 펼쳐 하루짜리 슬롯 여러 개로 보냄
// 서버 응답 (AVAILABILITIES)은 슬롯(candidateSlotId) 단위로만 저장되므로
// 하루 = 슬롯 1개여야 참여자가 날짜별로 가능/불가능을 따로 남길 수 있음
function toCandidateSlots(slots: DraftSlot[]): CandidateSlot[] {
  const END_OF_DAY = "23:59"; // LocalTIme엔 24:00이 없어서 하루의 끝을 "23:59"로 표현
  const result: CandidateSlot[] = [];
  for (const slot of slots) {
    const [sy, sm, sd] = slot.slotDate.split("-").map(Number);
    const [ey, em, ed] = slot.endDate.split("-").map(Number);
    const cur = new Date(sy, sm - 1, sd);
    const last = new Date(ey, em - 1, ed);
    while (cur <= last) {
      const date = toDateString(
        cur.getFullYear(),
        cur.getMonth(),
        cur.getDate(),
      );
       const isFirst = date === slot.slotDate; // 기간의 첫날인가
       const isLast = date === slot.endDate; // 기간의 마지막날인가
      result.push({
        startDate: date, // 하루짜리라 startDate == endDate
        endDate: date,
        // 첫날만 시작시간부터, 나머지 날은 00:00부터
        startTime: isFirst ? slot.startTime : "00:00",
        // 마지막날만 종료시간까지, 나머지 날은 하루 끝(23:59)까지
        endTime: isLast ? slot.endTime : END_OF_DAY,
      });
      cur.setDate(cur.getDate() + 1);
    }
  }
  return result;
}

// 달력 칸 배열: 1일 앞의 빈칸(null) + 1일~말일
function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay(); // 1일의 요일 = 앞 빈칸 수
  const lastDate = new Date(year, month + 1, 0).getDate(); // 이 달 마지막 날짜
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null); // 앞 빈칸
  for (let d = 1; d <= lastDate; d++) cells.push(d); // 실제 날짜
  return cells;
}

// 30분 간격 시간 목록 ["00:00", "00:30", ..., "23:30"]
function buildTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
}

// 카드용 한국어 날짜: "2026년 6월 23일 (화)"
function formatKoreanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}

// 시간 목록은 한 번만 만들면 되므로 컴포넌트 바깥에 위치
const TIME_OPTIONS = buildTimeOptions();

type TimeColumnProps = {
  value: string; // 현재 선택된 시간
  onSelect: (time: string) => void; // 시간을 고르면 부모에게 알림
};

function TimeColumn({ value, onSelect }: TimeColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null); // 스크롤되는 바깥 박스
  const selectedRef = useRef<HTMLButtonElement>(null); // 선택되는 시간 버튼

  // 처음 그려질 때, 선택된 시간이 박스 가운데 오도록 스크롤(한 번만)
  useEffect(() => {
    const container = containerRef.current;
    const selected = selectedRef.current;
    if (!container || !selected) return;
    // 선택 버튼의 위치 - 박스 절반 높이 + 버튼 절반 높이 = 가운데 정렬
    container.scrollTop =
      selected.offsetTop -
      container.clientHeight / 2 +
      selected.clientHeight / 2;
  }, []);

  return (
    <div
      ref={containerRef}
      className="scrollbar-hide relative h-36 overflow-y-auto rounded-lg border border-[#eeeeee]"
    >
      {TIME_OPTIONS.map((time) => {
        const isSelected = time === value;
        return (
          <button
            key={time}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            onClick={() => onSelect(time)}
            className={[
              "flex w-full items-center justify-center py-1.5 text-[14px] transition",
              isSelected
                ? "bg-[#fde3cf] font-bold text-[#e07b34]"
                : "text-[#bbbbbb] hover:text-[#777777]",
            ].join(" ")}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}

function MeetingSlotPage() {
  const navigate = useNavigate();

  // 스토어에서 슬롯 목록과 추가/삭제 함수를 꺼냄
  const slots = useMeetingDraftStore((state) => state.slots);
  const addSlot = useMeetingDraftStore((state) => state.addSlot);
  const removeSlot = useMeetingDraftStore((state) => state.removeSlot);
  // 모임 생성에 필요한 기본 정보 + 결과 저장 함수
  const name = useMeetingDraftStore((state) => state.name);
  const expectedCount = useMeetingDraftStore((state) => state.expectedCount);
  const setCreated = useMeetingDraftStore((state) => state.setCreated);

  // 오늘 날짜(과거 날짜 선택 막기)
  const todayObj = new Date();
  const today = toDateString(
    todayObj.getFullYear(),
    todayObj.getMonth(),
    todayObj.getDate(),
  );

  // 상태 선언 - 이 화면에서만 쓰므로 useState
  const [viewYear, setViewYear] = useState(todayObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayObj.getMonth()); // 0~11

  const [selectionMode, setSelectionMode] = useState<"single" | "range">(
    "single",
  ); // 하루/기간
  const [selectedDate, setSelectedDate] = useState(""); // single 모드에서 고른 날짜
  const [rangeStart, setRangeStart] = useState(""); // range 시작 날짜
  const [rangeEnd, setRangeEnd] = useState(""); // range 종료 날짜
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("18:00");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 생성 요청 중 여부

  // 지금 보여줄 달의 날짜 칸 배열
  const calendarDays = buildCalendarDays(viewYear, viewMonth);

  // 이전 달 (1월에서 누르면 작년 12월로)
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  // 다음 달 (12월에서 누르면 내년 1월로)
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // 선택 모드 변경(하루/기간) - 바꿀 때 기존 선택은 초기화
  const handleChangeMode = (mode: "single" | "range") => {
    setSelectionMode(mode);
    setSelectedDate("");
    setRangeStart("");
    setRangeEnd("");
    setError("");
  };

  const handleSelectDate = (day: number) => {
    const dateStr = toDateString(viewYear, viewMonth, day);
    if (dateStr < today) return; // 과거는 무시
    setError("");

    // 하루 모드: 그 날짜만 선택
    if (selectionMode === "single") {
      setSelectedDate(dateStr);
      return;
    }

    // 기간 모드
    // 시작/종료가 모두 정해진 상태
    if (rangeStart && rangeEnd) {
      if (dateStr === rangeStart) {
        // 시작 다시 누름 -> 전체 취소
        setRangeStart("");
        setRangeEnd("");
      } else if (dateStr === rangeEnd) {
        // 종료를 다시 누름 -> 종료만 취소
        setRangeEnd("");
      } else {
        // 그 외 날짜 -> 새 시작으로 다시 시작
        setRangeStart(dateStr);
        setRangeEnd("");
      }
      return;
    }

    // 시작만 있는 상태
    if (rangeStart) {
      if (dateStr === rangeStart) {
        setRangeStart(""); // 시작을 다시 누름 -> 선택 취소
      } else if (dateStr < rangeStart) {
        setRangeStart(dateStr); // 시작보다 앞이면 시작 재지정
      } else {
        setRangeEnd(dateStr); // 뒤면 종료로 확정
      }
      return;
    }

    // 아무것도 없는 상태 -> 시작 지정
    setRangeStart(dateStr);
  };

  // 후보 시간 추가
  const handleAddSlot = () => {
    // "HH:mm" 문자열은 사전순=시간순이라 그대로 비교 가능
    if (endTime <= startTime) {
      setError("종료 시간은 시작 시간보다 늦어야 해요.");
      return;
    }

    // 리스트에 하루/기간이 섞이지 않도록 검사
    // (슬롯이 slotDate === endDate면 하루, 다르면 기간)
    const hasSingle = slots.some((s) => s.slotDate === s.endDate);
    const hasRange = slots.some((s) => s.slotDate !== s.endDate);
    if (selectionMode === "single" && hasRange) {
      setError(
        "기간 일정이 담겨있어요. 선택한 일정을 비우고 하루 일정을 추가해주세요.",
      );
      return;
    }
    if (selectionMode === "range" && hasSingle) {
      setError(
        "하루 일정이 담겨있어요. 선택한 일정을 비우고 기간 일정을 추가해주세요.",
      );
      return;
    }

    // 추가할 슬롯의 시작/종료 날짜를 모드에 따라 결정
    let slotDate = "";
    let endDate = "";
    if (selectionMode === "single") {
      if (!selectedDate) {
        setError("날짜를 먼저 선택해주세요.");
        return;
      }
      slotDate = selectedDate;
      endDate = selectedDate; // 하루모드: 시작날짜 = 종료날짜
    } else {
      if (!rangeStart || !rangeEnd) {
        setError("시작 날짜와 종료 날짜를 모두 선택해주세요.");
        return;
      }
      slotDate = rangeStart;
      endDate = rangeEnd; // 기간모드: 종료 날짜 따로
    }

    // 같은 일정 중복 방지
    const isDuplicate = slots.some(
      (s) =>
        s.slotDate === slotDate &&
        s.endDate === endDate &&
        s.startTime === startTime &&
        s.endTime === endTime,
    );
    if (isDuplicate) {
      setError("이미 추가한 후보 시간이에요.");
      return;
    }

    // 슬롯 1개 추가
    addSlot({
      id: crypto.randomUUID(),
      slotDate,
      endDate,
      startTime,
      endTime,
    });
    setError("");
  };

  // 다음 버튼 -> 모임 생성 API 호출
  const handleNext = async () => {
    if (slots.length === 0) {
      setError("후보 시간을 최소 1개 이상 추가해주세요.");
      return;
    }

    setError("");
    setIsSubmitting(true); // 로딩 시작 (버튼 잠금)

    try {
      // 서버로 보낼 요청 DTO 만들기 (화면 데이터 -> API 데이터 변환)
      const response = await createMeeting({
        name,
        expectedCount,
        candidateSlots: toCandidateSlots(slots),
      });

      // 성공: 초대/결과 URL을 저장하고 공유 화면으로 이동
      setCreated(response);
      navigate(`/invite/${response.inviteToken}`);
    } catch (error) {
      // 실패: 에러 메시지 표시
      setError(
        getApiErrorMessage(error, "모임 생성에 실패했어요. 다시 시도해주세요."),
      );
    } finally {
      setIsSubmitting(false); // 성공이든 실패든 로딩 해제
    }
  };

  return (
    <section className="flex h-full flex-col bg-white">
      <Header
        title="날짜/시간대 선택"
        left={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로 가기"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f5f5f5]"
          >
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-6">
        <div className="flex items-center justify-between">
          {/* 월 이동 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="이전 달"
            >
              <ChevronLeft size={20} className="text-[#c4c4c4]" />
            </button>
            <span className="text-[15px] font-bold text-[#2d2d2d]">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="다음 달"
            >
              <ChevronRight size={20} className="text-[#c4c4c4]" />
            </button>
          </div>

          {/* 하루/기간 선택 토글 (오른쪽 상단) */}
          <div className="inline-flex rounded-full bg-[#f4f4f4] p-0.5 text-[13px] font-bold">
            <button
              type="button"
              onClick={() => handleChangeMode("single")}
              className={[
                "rounded-full px-3 py-1 transition",
                selectionMode === "single"
                  ? "bg-white text-[#f59a58] shadow-sm"
                  : "text-[#9b9b9b]",
              ].join(" ")}
            >
              하루
            </button>
            <button
              type="button"
              onClick={() => handleChangeMode("range")}
              className={[
                "rounded-full px-3 py-1 transition",
                selectionMode === "range"
                  ? "bg-white text-[#f59a58] shadow-sm"
                  : "text-[#9b9b9b]",
              ].join(" ")}
            >
              기간
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="mt-6 grid grid-cols-7 text-center text-[15px] font-bold">
          {WEEKDAYS.map((label, index) => (
            <div
              key={label}
              className={
                index === 0
                  ? "text-[#fc3a3a]"
                  : index === 6
                    ? "text-[#3a7afc]"
                    : "text-[#7a7a7a]"
              }
            >
              {label}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="mt-4 grid grid-cols-7 gap-y-0.5 text-center">
          {calendarDays.map((day, index) => {
            // 앞 빈칸은 빈 div로 자리만 차지
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }
            const dateStr = toDateString(viewYear, viewMonth, day);
            const isPast = dateStr < today;
            // 모드 별로 "선택됨" 판정이 다름
            const isSelected =
              selectionMode === "single"
                ? dateStr === selectedDate
                : dateStr === rangeStart || dateStr === rangeEnd;
            // 기간 모드에서 시작~종료 사이 (양 끝 제외)
            const isInRange =
              selectionMode === "range" &&
              rangeStart !== "" &&
              rangeEnd !== "" &&
              dateStr > rangeStart &&
              dateStr < rangeEnd;

            const hasSlot = slots.some((s) => s.slotDate === dateStr);
            // 기간 모드에서 시작/종료 날짜 아래에 띄울 작은 라벨
            const rangeLabel =
              selectionMode === "range" && dateStr === rangeStart
                ? "시작"
                : selectionMode === "range" && dateStr === rangeEnd
                  ? "종료"
                  : "";

            return (
              <div key={dateStr} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  disabled={isPast}
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-semibold transition",
                    isPast ? "text-[#d4d4d4]" : "text-[#3a3a3a]",
                    isSelected ? "bg-[#f59a58] text-white" : "",
                    !isSelected && (isInRange || hasSlot)
                      ? "bg-[#fde3cf] text-[#e07b34]"
                      : "",
                  ].join(" ")}
                >
                  {day}
                </button>
                {/* 시작/종료 라벨(빈 글자라도 자리 차지->줄높이 유지) */}
                <span className="mt-0.5 h-4 text-[10px] font-bold leading-none text-[#f59a58]">
                  {rangeLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* 여기부터(시간 선택 ~ 일정 리스트)가 스크롤되는 영역 */}
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* 시간 선택: 시작 시간 / 종료 시간 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[13px] font-bold text-[#4a4a4a]">
                시작 시간
              </p>
              <TimeColumn value={startTime} onSelect={setStartTime} />
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-bold text-[#4a4a4a]">
                종료 시간
              </p>
              <TimeColumn value={endTime} onSelect={setEndTime} />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="mt-3 text-sm font-semibold text-[#fc3a3a]">{error}</p>
          )}

          <button
            type="button"
            onClick={handleAddSlot}
            className="mt-3 inline-flex items-center gap-1 self-end rounded-full bg-[#f59a58] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#ef8840]"
          >
            <Plus size={16} />
            가능한 시간 추가
          </button>

          {/* 추가된 슬롯 카드 목록 */}
          <ul className="mt-5 space-y-3 pb-2">
            {slots.map((slot) => {
              // 시작일 + 종료일이면 기간 일정
              const isRange = slot.slotDate !== slot.endDate;
              return (
                <li
                  key={slot.id}
                  className="flex items-center justify-between rounded-xl border border-[#eeeeee] px-4 py-3"
                >
                  <div className="space-y-1">
                    {isRange ? (
                      // 기간: 시작 줄 / 종료 줄(2줄)
                      <>
                        <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#333333]">
                          <CalendarIcon size={15} className="text-[#9b9b9b]" />
                          {formatKoreanDate(slot.slotDate)} {slot.startTime}{" "}
                          부터
                        </div>
                        <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#333333]">
                          <CalendarIcon size={15} className="text-[#9b9b9b]" />
                          {formatKoreanDate(slot.endDate)} {slot.endTime} 까지
                        </div>
                      </>
                    ) : (
                      // 하루: 날짜 / 시간 줄(기존 형태)
                      <>
                        <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#333333]">
                          <CalendarIcon size={15} className="text-[#9b9b9b]" />
                          {formatKoreanDate(slot.slotDate)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#777777]">
                          <Clock size={15} className="text-[#9b9b9b]" />
                          {slot.startTime} 부터 {slot.endTime} 까지
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    aria-label="이 후보 시간 삭제"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#bbbbbb] transition hover:bg-[#f5f5f5] hover:text-[#fc3a3a]"
                  >
                    <Trash2 size={17} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 슬롯이 하나도 없을 때 안내 (빈 상태) */}
          {slots.length === 0 && (
            <p className="mt-5 text-center text-sm font-semibold text-[#c4c4c4]">
              아직 추가된 후보 시간이 없어요.
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#f0f0f0] px-6 pb-4 pt-4">
        <Button
          type="button"
          fullWidth
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? "모임 만드는 중..." : "다음"}
        </Button>
      </div>
    </section>
  );
}

export default MeetingSlotPage;
