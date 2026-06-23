import { useNavigate } from "react-router";
import { useMeetingDraftStore } from "../stores/meetingDraftStore";
import { useState } from "react";
import Header from "../layouts/Header";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
} from "lucide-react";
import Button from "../components/Button";

// 요일 라벨 - getDay()는 0=일 ~ 6=토 를 돌려줌
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 연/월/일 => "YYYY-MM-DD" 문자열 (month는 0부터라 +1)
function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
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
  label: string; // "부터" 또는 "까지"
  value: string; // 현재 선택된 시간
  onSelect: (time: string) => void; // 시간을 고르면 부로에게 알림
};

function TimeColumn({ label, value, onSelect }: TimeColumnProps) {
  return (
    <div className="h-40 overflow-y-auto rounded-lg border border-[#eeeeee]">
      {TIME_OPTIONS.map((time) => {
        const isSelected = time === value;
        return (
          <button
            key={time}
            type="button"
            onClick={() => onSelect(time)}
            className={[
              "flex w-full items-center justify-center py-1.5 text-[14px] transition",
              isSelected
                ? "font-bold text-[#f59a58]"
                : "text-[#bbbbbb] hover:text-[#777777]",
            ].join(" ")}>
            {time}
            {isSelected && <span className="ml-1 text-[12px]">{label}</span>}
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
  const [selectedDate, setSelectedDate] = useState(""); // 달력에서 고른 날짜
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");

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

  // 날짜 칸 클릭 → 선택 날짜로 저장 (과거는 무시)
  const handleSelectDate = (day: number) => {
    const dateStr = toDateString(viewYear, viewMonth, day);
    if (dateStr < today) return;
    setSelectedDate(dateStr);
    setError("");
  };

  // 후보 시간 추가
  const handleAddSlot = () => {
    if (!selectedDate) {
      setError("날짜를 먼저 선택해주세요.");
      return;
    }
    // "HH:mm" 문자열은 사전순=시간순이라 그대로 비교 가능
    if (endTime <= startTime) {
      setError("종료 시간은 시작 시간보다 늦어야 해요.");
      return;
    }
    // 같은 날짜 + 시간 중복 방지(some - 하나라도 같으면 true)
    const isDuplicate = slots.some(
      (s) =>
        s.slotDate === selectedDate &&
        s.startTime === startTime &&
        s.endTime === endTime,
    );
    if (isDuplicate) {
      setError("이미 추가한 후보 시간이에요.");
      return;
    }

    addSlot({
      id: crypto.randomUUID(), // 목록 구분,삭제용 고유 id
      slotDate: selectedDate,
      startTime,
      endTime,
    });
    setError("");
  };

  // 다음 버튼
  const handleNext = () => {
    if (slots.length === 0) {
      setError("후보 시간을 최소 1개 이상 추가해주세요.");
      return;
    }
    console.log("모임 생성 요청 준비 완료:", slots);
    // navigate("/meetings/new/confirm");
  };

  return (
    <section className="flex min-h-full flex-col bg-white">
      <Header
        title="날짜/시간대 선택"
        left={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로 가기"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f5f5f5]">
            <ChevronLeft size={24} />
          </button>
        }
      />

      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        {/* 월 이동 */}
        <div className="flex items-center justify-center gap-5">
          <button type="button" onClick={handlePrevMonth} aria-label="이전 달">
            <ChevronLeft size={20} className="text-[#c4c4c4]" />
          </button>
          <span className="text-[15px] font-bold text-[#2d2d2d]">
            {viewYear}년 {viewMonth + 1}월
          </span>
          <button type="button" onClick={handleNextMonth} aria-label="다음 달">
            <ChevronRight size={20} className="text-[#c4c4c4]" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="mt-4 grid grid-cols-7 text-center text-[13px] font-bold">
          {WEEKDAYS.map((label, index) => (
            <div
              key={label}
              className={
                index === 0
                  ? "text-[#fc3a3a]"
                  : index === 6
                    ? "text-[#3a7afc]"
                    : "text-[#7a7a7a]"
              }>
              {label}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="mt-2 grid grid-cols-7 gap-y-2 text-center">
          {calendarDays.map((day, index) => {
            // 앞 빈칸은 빈 div로 자리만 차지
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }
            const dateStr = toDateString(viewYear, viewMonth, day);
            const isPast = dateStr < today;
            const isSelected = dateStr === selectedDate;
            const hasSlot = slots.some((s) => s.slotDate === dateStr);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleSelectDate(day)}
                disabled={isPast}
                className={[
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold transition",
                  isPast ? "text-[#d4d4d4]" : "text-[#3a3a3a]",
                  isSelected ? "bg-[#f59a58] text-white" : "",
                  !isSelected && hasSlot ? "bg-[#fde3cf] text-[#e07b34]" : "",
                ].join(" ")}>
                {day}
              </button>
            );
          })}
        </div>

        {/* 시간 선택: 부터 / 까지 */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <TimeColumn label="부터" value={startTime} onSelect={setStartTime} />
          <TimeColumn label="까지" value={endTime} onSelect={setEndTime} />
        </div>

        {error && (
          <p className="mt-3 text-xs font-semibold text-[#fc3a3a]">{error}</p>
        )}

        <Button
          type="button"
          variant="orange"
          fullWidth
          onClick={handleAddSlot}
          className="mt-3">
          후보 시간 추가
        </Button>

        {/* 추가된 슬롯 카드 목록 */}
        <ul className="mt-5 space-y-3">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between rounded-xl border border-[#eeeeee] px-4 py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#333333]">
                  <CalendarIcon size={15} className="text-[#9b9b9b]" />
                  {formatKoreanDate(slot.slotDate)}
                </div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#777777]">
                  <Clock size={15} className="text-[#9b9b9b]" />
                  {slot.startTime} 부터 {slot.endTime} 까지
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                aria-label="이 후보 시간 삭제"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#bbbbbb] transition hover:bg-[#f5f5f5] hover:text-[#fc3a3a]">
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>

        {/* 슬롯이 하나도 없을 때 안내 (빈 상태) */}
        {slots.length === 0 && (
          <p className="mt-5 text-center text-sm font-semibold text-[#c4c4c4]">
            아직 추가된 후보 시간이 없어요.
          </p>
        )}
      </div>

      <div className="px-5 pb-6">
        <Button type="button" fullWidth onClick={handleNext}>
          다음
        </Button>
      </div>
    </section>
  );
}

export default MeetingSlotPage;
