import { useNavigate, useParams } from "react-router";
import type { ServerSlot } from "../types/meeting";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { getMeetingByInviteToken } from "../api/meetingApi";
import { getApiErrorMessage } from "../api/httpClient";
import LoadingSpinner from "../components/LoadingSpinner";
import Header from "../layouts/Header";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../components/Button";
import { useGuestStore } from "../stores/guestStore";
import { useAuthStore } from "../stores/authStore";
import type { AvailabilityInput } from "../types/availability";
import { submitAvailabilities } from "../api/availabilityApi";
import {
  getMyParticipation,
  submitMyParticipation,
} from "../api/participantApi";

// 요일 라벨 - getDay()는 0=일 ~ 6=토 를 돌려줌
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatColumnDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${mm}.${dd}(${weekday})`;
}

const STEP = 30; // 한 칸 = 30분

// "13:30" -> 810(자정부터 몇 분인지)
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// 810 -> "13:30" (분 -> "HH:mm")
function toTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 셀(슬롯 + 시작분)을 하나의 문자열 키로. 선택 Set에 담는 값.
function cellKey(slotId: number, date: string, minutes: number): string {
  return `${slotId}|${date}|${minutes}`;
}

// 고른 칸들(Set)을 서버가 원하는 슬롯 단위 배열로 변환
// selectedCells 원소는 "slotId|date|minutes" 형태의 키
function buildAvailabilites(
  slots: ServerSlot[],
  selectedCells: Set<string>,
): AvailabilityInput[] {
  // 1) slotId 별로 "고른 시작분"들을 모음
  const pickedBySlot = new Map<number, number[]>();
  for (const key of selectedCells) {
    const [slotIdStr, , minuteStr] = key.split("|"); // 가운데(date)는 안 씀
    const slotId = Number(slotIdStr);
    const minute = Number(minuteStr);
    const list = pickedBySlot.get(slotId) ?? [];
    list.push(minute);
    pickedBySlot.set(slotId, list);
  }

  // 2) 슬롯마다 응답 1건을 만든다 (안 고른 슬롯도 UNAVAILABLE로 명시)
  return slots.map((slot): AvailabilityInput => {
    const picked = pickedBySlot.get(slot.id) ?? [];
    if (picked.length === 0) {
      return {
        candidateSlotId: slot.id,
        status: "UNAVAILABLE",
        timeRanges: [],
      };
    }
    // 고른 30분 칸들의 최소 시작 ~ (최대 시작 + 30분)을 가용 범위로
    const slotEnd = toMinutes(slot.endTime); // 이 슬롯의 종료(분)
    const sorted = [...new Set(picked)].sort((a, b) => a - b);
    const timeRanges: { startTime: string; endTime: string }[] = [];
    let rangeStart = sorted[0];
    let previous = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      if (current === previous + STEP) {
        previous = current;
        continue;
      }

      timeRanges.push({
        startTime: toTimeLabel(rangeStart),
        endTime: toTimeLabel(Math.min(previous + STEP, slotEnd)),
      });
      rangeStart = current;
      previous = current;
    }

    timeRanges.push({
      startTime: toTimeLabel(rangeStart),
      endTime: toTimeLabel(Math.min(previous + STEP, slotEnd)),
    });
    return {
      candidateSlotId: slot.id,
      status: "AVAILABLE",
      timeRanges,
    };
  });
}

type DayColumn = {
  slotId: number; // 원본 후보 슬롯 id
  date: string; // 이 컬럼의 날짜 "YYYY-MM-DD"
  startTime: string;
  endTime: string;
};

// 기간 슬롯(startDate~endDate)을 하루씩 컬럼으로 펼침
function buildDayColumns(slots: ServerSlot[]): DayColumn[] {
  const columns: DayColumn[] = [];
  for (const slot of slots) {
    const [sy, sm, sd] = slot.startDate.split("-").map(Number);
    const [ey, em, ed] = slot.endDate.split("-").map(Number);
    const cur = new Date(sy, sm - 1, sd);
    const last = new Date(ey, em - 1, ed);
    while (cur <= last) {
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      const dd = String(cur.getDate()).padStart(2, "0");
      columns.push({
        slotId: slot.id,
        date: `${cur.getFullYear()}-${mm}-${dd}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      cur.setDate(cur.getDate() + 1);
    }
  }
  // 날짜 빠른 순 정렬 (같은 날짜면 시작 시간 순)
  // "YYYY-MM-DD" / "HH-mm"는 문자열 비교가 곧 시간 순서라 localeCompare로 충분
  columns.sort((a, b) =>
    a.date === b.date
      ? a.startTime.localeCompare(b.startTime)
      : a.date.localeCompare(b.date),
  );
  return columns;
}

// 세로축(30분 행) 계산: 모든 슬롯을 통틀어 가장 이른 시작 ~ 가장 이른 종료
// 예) 9:00~12:00이면 -> [540, 570, 600, ..., 690] (690분 행 = 11:30~12:00)
function buildTimeRows(slots: ServerSlot[]): number[] {
  if (slots.length === 0) return [];
  const start =
    Math.floor(Math.min(...slots.map((s) => toMinutes(s.startTime))) / 60) * 60;
  const end =
    Math.ceil(Math.max(...slots.map((s) => toMinutes(s.endTime))) / 60) * 60;
  const rows: number[] = [];
  for (let t = start; t < end; t += STEP) rows.push(t);
  return rows;
}

function buildHourRows(timeRows: number[]): number[] {
  return timeRows.filter((minutes) => minutes % 60 === 0);
}

function getTimeRowBorderClass(minutes: number, lastMinutes: number): string {
  if (minutes === lastMinutes) return ""; // 마지막 행: 아래선 없음(외곽선과 겹침 방지)
  return minutes % 60 === 0 ? "border-b border-dashed" : "border-b";
}

function AvailabilityPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>(); // URL의 :inviteToken
  const navigate = useNavigate();

  // 현재 참여자 이름: 비회원이면 게스트, 소셜 로그인이면 사용자 이름
  const guest = useGuestStore((state) => state.guest);
  const user = useAuthStore((state) => state.user);
  const displayName = guest?.displayName ?? user?.name ?? "";

  const [slots, setSlots] = useState<ServerSlot[]>([]); // 후보 슬롯(=컬럼) 목록
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set()); // 내가 고른 칸들
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false); // 저장 요청 중인가

  // 가로 스크롤(날짜 넘기기)에 쓸 컬럼들을 감싼 div를 가리키는 손잡이
  const columnsRef = useRef<HTMLDivElement>(null);

  // 드래그 상태: 매우 자주 바뀌지만 화면을 다시 그릴 필요는 없는 값이라
  // useState 대신 useRef에 보관한다 (ref를 바꿔도 리렌더가 안 일어남)
  const draggingRef = useRef(false); // 지금 드래그 중인가
  const dragModeRef = useRef<"add" | "remove">("add"); // 채우기/지우기 모드

  // 화면이 처음 뜰 때 후보 슬롯을 한 번 불러옴
  useEffect(() => {
    if (!inviteToken) return;
    setLoading(true);
    getMeetingByInviteToken(inviteToken)
      .then((meeting) => setSlots(meeting.candidateSlots ?? []))
      .catch((e) =>
        setError(getApiErrorMessage(e, "후보 시간을 불러올 수 없어요.")),
      )
      .finally(() => setLoading(false));
  }, [inviteToken]);

  // 수정 버튼 클릭 시 초기값은 기존 선택 슬롯
  useEffect(() => {
    if (!inviteToken || slots.length === 0) return;
    getMyParticipation(inviteToken)
      .then((me) => {
        const next = new Set<string>();
        const columns = buildDayColumns(slots);
        for (const a of me.availabilities as AvailabilityInput[]) {
          if (a.status !== "AVAILABLE") continue;
          for (const col of columns) {
            if (col.slotId !== a.candidateSlotId) continue;
            for (const r of a.timeRanges) {
              for (
                let m = toMinutes(r.startTime);
                m < toMinutes(r.endTime);
                m += STEP
              ) {
                next.add(cellKey(col.slotId, col.date, m));
              }
            }
          }
        }
        setSelectedCells(next);
      })
      .catch(() => {}); // 미등록(신규 +)이면 빈 상태 그대로
  }, [inviteToken, slots]);

  // 참여(쿠키) 안 했으면 등록 못 하니 참여 화면으로 보냄
  useEffect(() => {
    if (!guest && !user) {
      navigate(`/invite/${inviteToken}/guest`, { replace: true });
    }
  }, [guest, user, inviteToken, navigate]);

  const timeRows = buildTimeRows(slots); // 세로축(30분 행)
  const hourRows = buildHourRows(timeRows);
  const lastMinutes = timeRows[timeRows.length - 1]; // 그리드 맨 아래 행의 분
  const dayColumns = buildDayColumns(slots);

  // (슬롯, 시작분) 칸이 선택 가능한가? = 그 30분이 슬롯의 시간 범위 안인가
  const isSelectable = (col: DayColumn, minutes: number): boolean => {
    return (
      toMinutes(col.startTime) <= minutes && minutes < toMinutes(col.endTime)
    );
  };

  // 한 칸을 "현재 모드" 대로 칠함 (add=채우기 / remove=지우기)
  const paintCell = (slotId: number, date: string, minutes: number) => {
    const key = cellKey(slotId, date, minutes);
    setSelectedCells((prev) => {
      const next = new Set(prev); // * 항상 새 Set을 만듬
      if (dragModeRef.current === "add") next.add(key);
      else next.delete(key);
      return next;
    });
  };

  // ① 누른 순간: 드래그 시작 + 모드 결정 + 그 칸부터 칠하기
  const handlePointerDown = (
    e: ReactPointerEvent<HTMLButtonElement>,
    slotId: number,
    date: string,
    minutes: number,
  ) => {
    e.preventDefault(); // 드래그 중 글자/이미지가 선택되는 것 방지
    draggingRef.current = true;
    // 시작 칸이 이미 선택돼 있으면 "지우기", 비어있으면 "채우기"
    dragModeRef.current = selectedCells.has(cellKey(slotId, date, minutes))
      ? "remove"
      : "add";
    paintCell(slotId, date, minutes); // 누른 칸을 바로 반영(=클릭 한 번도 동작)
  };

  // ② 끌기 / ③ 뗌: 칸은 손가락을 "잡아두기" 때문에(터치) window에서 추적
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!draggingRef.current) return; // 드래그 중일 때만
      // 손가락/커서 바로 아래의 DOM을 찾아서, 그게 칸이면 정보를 읽는다
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest<HTMLElement>("[data-slot]");
      if (!cell) return; // 회색 칸/빈 영역이면 무시
      paintCell(
        Number(cell.dataset.slot),
        String(cell.dataset.date),
        Number(cell.dataset.minute),
      );
    };
    const handleUp = () => {
      draggingRef.current = false; // 손을 떼면 드래그 끝
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  // < > 버튼: 컬럼 영역을 한 칸 너비만큼 좌/우로 부드럽게 스크롤
  const scrollColumns = (direction: 1 | -1) => {
    columnsRef.current?.scrollBy({ left: direction * 112, behavior: "smooth" });
  };

  // 등록하기: 고른 칸들을 변환해서 서버에 저장(PUT)
  const handleSubmit = async () => {
    if (!inviteToken) return;
    const availabilities = buildAvailabilites(slots, selectedCells);

    setSubmitting(true);
    try {
      await submitAvailabilities(inviteToken, {
        availabilities,
      });
      await submitMyParticipation(inviteToken);
      navigate(`/invite/${inviteToken}`);
    } catch (e) {
      alert(
        getApiErrorMessage(e, "응답 완료에 실패했어요. 다시 시도해주세요."),
      );
    } finally {
      setSubmitting(false); // 성공/실패와 무관하게 버튼 다시 활성화
    }
  };

  if (loading) {
    return (
      <LoadingSpinner fullScreen message="후보 시간을 불러오는 중이에요" />
    );
  }

  if (error) {
    return (
      <section className="flex h-full flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[15px] font-bold text-[#2d2d2d]">{error}</p>
      </section>
    );
  }

  const selectedCount = selectedCells.size; // 지금 고른 칸 개수

  return (
    <section className="flex h-full flex-col bg-white">
      <Header title="일정 등록" showMenu />

      <div className="px-6 pt-5">
        <h1 className="text-[20px] font-bold leading-snug text-[#2d2d2d]">
          {displayName ? `${displayName}님의 ` : ""}되는 시간을
          <br />
          일정으로 선택해주세요
        </h1>
      </div>

      {/* 그리드 (세로 스크롤) */}
      <div className="flex-1 overflow-y-auto pt-6 px-8 pb-4">
        {timeRows.length === 0 ? (
          <p className="mt-10 text-center text-sm font-semibold text-[#c4c4c4]">
            아직 후보 시간이 없어요.
          </p>
        ) : (
          <div className="mx-auto w-fit max-w-full">
            {/* 날짜 넘기기 < > : 그리드와 같은 폭, 양 끝 */}
            {dayColumns.length > 3 && (
              <div className="mb-2 flex w-full items-center justify-between">
                <button
                  type="button"
                  onClick={() => scrollColumns(-1)}
                  aria-label="이전 날짜"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e5e5] text-[#9b9b9b] transition hover:bg-[#f5f5f5]"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollColumns(1)}
                  aria-label="다음 날짜"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e5e5] text-[#9b9b9b] transition hover:bg-[#f5f5f5]"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* 그리드 본체 */}
            <div className="flex w-fit max-w-full select-none overflow-hidden rounded-xl border border-[#f3b682]">
              {/* 왼쪽 고정 시간축 */}
              <div className=" w-7 shrink-0">
                {/* 날짜 헤더와 높이, 보더를맞춘 빈 헤더 칸 */}
                <div className="h-8 shrink-0 border-b border-[#f3b682] bg-[#fafafa]" />

                {/* 30분 두 칸을 1시간 한 칸으로 합침 */}
                <div className="flex flex-col">
                  {hourRows.map((minutes, index) => {
                    const isLastHour = index === hourRows.length - 1;
                    return (
                      <div
                        key={minutes}
                        className={[
                          "flex h-16 shrink-0 items-center justify-end pr-2 text-[12px] font-semibold leading-none text-[#9b9b9b]",
                          isLastHour ? "" : "border-b border-[#f3b682]",
                        ].join(" ")}
                      >
                        {minutes / 60}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 날짜 컬럼들 (가로 스크롤) - < > 버튼이 이 영역을 움직인다 */}
              <div
                ref={columnsRef}
                className="scrollbar-hide flex min-w-0 overflow-x-auto"
              >
                {dayColumns.map((col) => (
                  <div
                    key={`${col.slotId}-${col.date}`}
                    className="flex w-28 shrink-0 flex-col border-l border-[#f3b682]"
                  >
                    {/* 컬럼 헤더(날짜) */}
                    <div className="flex h-8 shrink-0 items-center justify-center border-b border-[#f3b682] bg-[#fafafa] text-[12px] font-bold text-[#555555]">
                      {formatColumnDate(col.date)}
                    </div>

                    {/* 시간 칸들 */}
                    <div className="flex flex-col">
                      {timeRows.map((minutes) => {
                        const selectable = isSelectable(col, minutes);
                        const borderClass = getTimeRowBorderClass(
                          minutes,
                          lastMinutes,
                        );

                        if (!selectable) {
                          return (
                            <div
                              key={minutes}
                              className={`h-8 w-full shrink-0 box-border border-[#f3b682] bg-[#eeeeee] ${borderClass}`}
                            />
                          );
                        }

                        const selected = selectedCells.has(
                          cellKey(col.slotId, col.date, minutes),
                        );

                        return (
                          <button
                            key={minutes}
                            type="button"
                            data-slot={col.slotId}
                            data-date={col.date}
                            data-minute={minutes}
                            onPointerDown={(e) =>
                              handlePointerDown(
                                e,
                                col.slotId,
                                col.date,
                                minutes,
                              )
                            }
                            className={[
                              "block h-8 w-full shrink-0 box-border border-[#f3b682] touch-none appearance-none p-0 transition",
                              borderClass,
                              selected
                                ? "bg-[#ffdbb9]"
                                : "bg-white hover:bg-[#fff3e9]",
                            ].join(" ")}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="shrink-0 border-t border-[#f0f0f0] px-6 pb-6 pt-4">
        <Button
          type="button"
          variant="orange"
          fullWidth
          disabled={selectedCount === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting
            ? "저장 중..."
            : selectedCount > 0
              ? "등록하기"
              : "가능한 시간을 선택해주세요"}
        </Button>
      </div>
    </section>
  );
}

export default AvailabilityPage;
