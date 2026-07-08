# LocalTime과 23:30~24:00 시간 처리 개선 가이드

## 1. 이 문서의 목적

현재 프로젝트에서는 프론트에서 선택한 시간을 백엔드로 보낼 때 `HH:mm` 문자열을 사용하고, 백엔드에서는 이 값을 `LocalTime`으로 받는다.

대부분의 시간은 문제없이 처리된다.

```text
14:00
14:30
18:00
```

하지만 하루의 마지막 시간대인 `23:30~24:00`을 표현할 때 문제가 생긴다.

Java의 `LocalTime`은 `24:00`을 표현할 수 없기 때문이다.

그래서 현재 프론트에서는 하루 끝을 `23:59`로 대신 표현하고 있다.

```ts
const END_OF_DAY = "23:59";
```

이 문서는 현재 코드에서 시간이 어떻게 프론트에서 백엔드로 전달되는지, 왜 `23:59` 때문에 문제가 생겼는지, 그리고 전체적으로 어떤 방향으로 수정하면 안전한지 정리한다.

---

## 2. 현재 프론트에서 백엔드로 시간을 보내는 흐름

시간이 백엔드로 전달되는 흐름은 크게 2가지다.

1. 방장이 모임 후보 시간을 생성할 때
2. 참가자가 후보 시간 중 가능한 시간을 제출할 때

---

## 3. 방장이 모임 후보 시간을 생성할 때

관련 파일:

```text
frontend/src/pages/MeetingSlotPage.tsx
frontend/src/api/meetingApi.ts
frontend/src/types/meeting.ts
backend/src/main/java/com/makeapp/backend/dto/request/MeetingCreateRequest.java
backend/src/main/java/com/makeapp/backend/service/MeetingService.java
backend/src/main/java/com/makeapp/backend/entity/CandidateSlot.java
```

### 3.1 프론트 시간 선택 UI

`MeetingSlotPage.tsx`에는 30분 단위 시간 목록을 만드는 코드가 있다.

```ts
function buildTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
}
```

이 함수가 만드는 값은 다음과 같다.

```text
00:00
00:30
01:00
01:30
...
23:00
23:30
```

여기에는 `24:00`이 없다.

이유는 자바스크립트 UI에서도 보통 하루 안의 시간 목록은 `00:00~23:30`까지만 보여주기 때문이다.

하지만 사용자가 `23:30`부터 하루 끝까지 가능하다고 표현하려면 실제 의미는 다음과 같다.

```text
23:30 ~ 24:00
```

문제는 이 `24:00`을 백엔드의 `LocalTime`이 받을 수 없다는 점이다.

---

### 3.2 현재 후보 슬롯 변환 로직

`MeetingSlotPage.tsx`의 `toCandidateSlots()`가 화면에서 선택한 `DraftSlot`을 서버로 보낼 `CandidateSlot` 배열로 바꾼다.

현재 핵심 코드는 다음과 같다.

```ts
function toCandidateSlots(slots: DraftSlot[]): CandidateSlot[] {
  const END_OF_DAY = "23:59";
  const result: CandidateSlot[] = [];

  for (const slot of slots) {
    ...
    result.push({
      startDate: date,
      endDate: date,
      startTime: isFirst ? slot.startTime : "00:00",
      endTime: isLast ? slot.endTime : END_OF_DAY,
    });
    ...
  }

  return result;
}
```

이 로직은 기간 후보를 하루 단위 후보 슬롯으로 쪼개기 위해 존재한다.

예를 들어 방장이 이렇게 선택했다고 하자.

```text
2026-07-08 14:00 ~ 2026-07-10 18:00
```

그러면 프론트는 백엔드로 다음처럼 여러 개의 후보 슬롯을 보낸다.

```json
[
  {
    "startDate": "2026-07-08",
    "endDate": "2026-07-08",
    "startTime": "14:00",
    "endTime": "23:59"
  },
  {
    "startDate": "2026-07-09",
    "endDate": "2026-07-09",
    "startTime": "00:00",
    "endTime": "23:59"
  },
  {
    "startDate": "2026-07-10",
    "endDate": "2026-07-10",
    "startTime": "00:00",
    "endTime": "18:00"
  }
]
```

즉, 중간 날짜의 하루 전체를 표현하기 위해 `00:00~23:59`가 만들어진다.

이 부분이 현재 문제의 시작점이다.

---

### 3.3 백엔드에서 받는 DTO

백엔드에서는 `MeetingCreateRequest.SlotRequest`가 이 값을 받는다.

```java
private LocalDate startDate;
private LocalDate endDate;
private LocalTime startTime;
private LocalTime endTime;
```

프론트에서 보낸 JSON은 다음처럼 들어온다.

```json
{
  "startDate": "2026-07-09",
  "endDate": "2026-07-09",
  "startTime": "00:00",
  "endTime": "23:59"
}
```

Spring/Jackson은 `"00:00"`, `"23:59"` 문자열을 `LocalTime`으로 변환한다.

```text
"00:00" -> LocalTime.of(0, 0)
"23:59" -> LocalTime.of(23, 59)
```

이후 `MeetingService`에서 `CandidateSlot` 엔티티로 저장된다.

---

## 4. 참가자가 가능한 시간을 제출할 때

관련 파일:

```text
frontend/src/pages/AvailabilityPage.tsx
frontend/src/api/availabilityApi.ts
frontend/src/types/availability.ts
backend/src/main/java/com/makeapp/backend/dto/request/AvailabilitySubmitRequest.java
backend/src/main/java/com/makeapp/backend/service/AvailabilityService.java
backend/src/main/java/com/makeapp/backend/entity/AvailabilityTimeRange.java
```

### 4.1 참가자 화면의 30분 셀

`AvailabilityPage.tsx`에서는 후보 슬롯의 `startTime`, `endTime`을 기준으로 30분 단위 행을 만든다.

```ts
const STEP = 30;

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

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
```

후보 슬롯이 다음과 같다면:

```text
00:00 ~ 23:59
```

`toMinutes("23:59")`는 다음 값이 된다.

```text
23 * 60 + 59 = 1439
```

그리고 `Math.ceil(1439 / 60) * 60`은 다음 값이 된다.

```text
24 * 60 = 1440
```

그래서 프론트 화면에는 마지막 셀까지 그려질 수 있다.

```text
23:30 ~ 24:00
```

다만 `toTimeLabel(1440)`을 그대로 쓰면 현재 함수는 다음처럼 만들 수 있다.

```text
24:00
```

프론트 화면 표시에서는 `24:00`이 자연스러울 수 있지만, 백엔드 `LocalTime`으로는 받을 수 없다.

---

### 4.2 참가자가 선택한 셀을 timeRanges로 변환

현재 `AvailabilityPage.tsx`의 `buildAvailabilites()`는 참가자가 고른 30분 셀들을 묶어서 서버로 보낼 `timeRanges`를 만든다.

예를 들어 참가자가 다음 셀들을 선택했다고 하자.

```text
14:00~14:30
14:30~15:00
16:00~16:30
16:30~17:00
```

그러면 프론트는 서버로 다음처럼 보낸다.

```json
{
  "candidateSlotId": 10,
  "status": "AVAILABLE",
  "timeRanges": [
    {
      "startTime": "14:00",
      "endTime": "15:00"
    },
    {
      "startTime": "16:00",
      "endTime": "17:00"
    }
  ]
}
```

이 방향은 좋다.

후보 슬롯 하나가 `14:00~18:00`일 때, 참가자가 그 안에서 가능한 구간만 여러 개로 나눠 보낼 수 있기 때문이다.

---

## 5. 현재 문제가 터진 지점

문제가 직접 터진 곳은 결과 조회 쪽이었다.

관련 파일:

```text
backend/src/main/java/com/makeapp/backend/service/ResultService.java
```

문제가 되었던 코드는 다음 줄이다.

```java
result.put("timeBlocks", timeBlocks(slot, availabilities));
```

이 줄을 주석 처리하자 CPU/RAM 급증과 `results?sort=recommend` 요청 pending 문제가 바로 해결되었다.

즉 문제의 직접 원인은 `timeBlocks()` 계산이었다.

---

## 6. 왜 timeBlocks()가 문제였나

현재 `timeBlocks()`는 `LocalTime`을 30분씩 더하면서 반복한다.

```java
private List<Map<String, Object>> timeBlocks(CandidateSlot slot, List<Availability> availabilities) {
    ...
    LocalTime start = slot.getStartTime();
    LocalTime slotEnd = slot.getEndTime();

    while (start.isBefore(slotEnd)) {
        LocalTime end = start.plusMinutes(30);
        if (end.isAfter(slotEnd)) {
            end = slotEnd;
        }

        ...

        start = end;
    }

    return blocks;
}
```

후보 슬롯이 다음과 같으면 처음에는 정상처럼 보인다.

```text
00:00 ~ 23:59
```

반복은 이렇게 진행된다.

```text
00:00
00:30
01:00
...
23:00
23:30
```

그 다음이 문제다.

```java
LocalTime end = start.plusMinutes(30);
```

`start`가 `23:30`이면 `start.plusMinutes(30)`의 결과는 `24:00`이 아니다.

Java `LocalTime`에는 `24:00`이 없기 때문에 결과는 다음처럼 돌아간다.

```text
23:30 + 30분 = 00:00
```

그러면 반복문 안에서 `start`가 다시 `00:00`이 된다.

그런데 반복 조건은 다음과 같다.

```java
while (start.isBefore(slotEnd))
```

`slotEnd`가 `23:59`라면 `00:00`은 당연히 `23:59`보다 이전이다.

그래서 반복문은 다시 처음부터 돈다.

```text
00:00
00:30
...
23:30
00:00
00:30
...
```

이 구조 때문에 결과 조회 API가 끝나지 않고, CPU와 RAM 사용량이 크게 올라간 것이다.

---

## 7. LocalTime의 한계

`LocalTime`은 날짜 없이 시간만 표현한다.

```text
14:00
23:30
00:00
```

하지만 다음은 표현하지 못한다.

```text
24:00
다음날 00:00
2026-07-08 23:30 ~ 2026-07-09 00:00
```

`LocalTime`에게 `00:00`은 보통 하루의 시작이다.

```text
00:00 = 하루 시작
```

그런데 사람이 `23:30~00:00`이라고 말할 때는 보통 다음 의미를 원한다.

```text
23:30 ~ 하루 끝
23:30 ~ 24:00
```

이 차이를 코드에서 명확히 처리하지 않으면 문제가 생긴다.

---

## 8. 핵심 규칙

이 프로젝트에서는 다음 규칙을 정하는 것이 좋다.

```text
DB/API 저장용 표현:
23:30 ~ 23:59

백엔드 계산용 표현:
23:30 ~ 24:00
= 1410 ~ 1440
```

즉 `23:59`는 실제 29분짜리 시간이 아니라, 프로젝트 내부 규칙상 “하루의 끝을 대신 표현한 값”으로 본다.

단, 이 규칙은 `endTime`에만 적용하는 것이 안전하다.

```text
startTime의 23:59 = 진짜 23:59
endTime의 23:59 = 하루 끝 24:00 대신 사용한 값
```

---

## 9. 개선 방향 전체 요약

전체 수정 방향은 다음과 같다.

1. 프론트에서 `23:59`를 사용하는 이유를 명확히 유지한다.
2. 백엔드 계산에서는 `endTime == 23:59`를 `1440`으로 보정한다.
3. `ResultService.timeBlocks()`는 `LocalTime.plusMinutes(30)` 반복을 사용하지 않는다.
4. 시간 계산은 전부 “분 숫자”로 변환해서 처리한다.
5. 검증 로직에서도 `23:59`를 마지막 종료 시간으로 허용할지 정책을 명확히 한다.
6. 응답 표시에서는 필요하면 `1440`을 `24:00` 또는 `23:59`로 다시 바꿔준다.

---

## 10. 가장 먼저 고쳐야 할 부분: ResultService

현재 가장 위험한 코드는 `ResultService.timeBlocks()`다.

이 메서드는 `LocalTime`을 직접 30분씩 더하고 있기 때문에, `23:30 -> 00:00` 문제가 생긴다.

수정 방향은 다음과 같다.

### 10.1 기존 방식

```java
LocalTime start = slot.getStartTime();
LocalTime slotEnd = slot.getEndTime();

while (start.isBefore(slotEnd)) {
    LocalTime end = start.plusMinutes(30);
    ...
    start = end;
}
```

이 방식은 사용하지 않는 것이 좋다.

### 10.2 개선 방식

시간을 분 숫자로 바꾼다.

```java
private int toStartMinute(LocalTime time) {
    return time.toSecondOfDay() / 60;
}

private int toEndMinute(LocalTime time) {
    if (isEndOfDay(time)) {
        return 1440;
    }
    return time.toSecondOfDay() / 60;
}

private boolean isEndOfDay(LocalTime time) {
    return time.equals(LocalTime.of(23, 59))
            || time.equals(LocalTime.of(23, 59, 59));
}
```

그리고 반복문은 숫자로 돌린다.

```java
int slotStart = toStartMinute(slot.getStartTime());
int slotEnd = toEndMinute(slot.getEndTime());

for (int current = slotStart; current < slotEnd; current += 30) {
    int blockEnd = Math.min(current + 30, slotEnd);
    ...
}
```

이렇게 하면 마지막 블록도 안전하다.

```text
23:30 -> 1410
하루 끝 -> 1440

1410 + 30 = 1440
```

`LocalTime.plusMinutes(30)`처럼 `00:00`으로 돌아가는 일이 없다.

---

## 11. ResultService 수정 예시

아래 코드는 방향을 보여주기 위한 예시다.

```java
private List<Map<String, Object>> timeBlocks(CandidateSlot slot, List<Availability> availabilities) {
    List<Availability> availableResponses = availabilities.stream()
            .filter(a -> a.getStatus() == AvailabilityStatus.AVAILABLE)
            .toList();

    List<Map<String, Object>> blocks = new ArrayList<>();

    int slotStart = toStartMinute(slot.getStartTime());
    int slotEnd = toEndMinute(slot.getEndTime());

    if (slotEnd <= slotStart) {
        return blocks;
    }

    for (int current = slotStart; current < slotEnd; current += 30) {
        int blockEnd = Math.min(current + 30, slotEnd);

        final int blockStartMinute = current;
        final int blockEndMinute = blockEnd;

        long availableCount = availableResponses.stream()
                .filter(a -> coversBlock(a.getTimeRanges(), blockStartMinute, blockEndMinute))
                .count();

        Map<String, Object> block = new LinkedHashMap<>();
        block.put("startTime", toTimeText(blockStartMinute));
        block.put("endTime", toTimeText(blockEndMinute));
        block.put("availableCount", (int) availableCount);
        blocks.add(block);
    }

    return blocks;
}
```

`coversBlock()`도 `LocalTime` 비교가 아니라 분 숫자로 비교한다.

```java
private boolean coversBlock(List<AvailabilityTimeRange> ranges, int blockStart, int blockEnd) {
    return ranges.stream().anyMatch(range -> {
        int rangeStart = toStartMinute(range.getStartTime());
        int rangeEnd = toEndMinute(range.getEndTime());

        return rangeStart <= blockStart && blockEnd <= rangeEnd;
    });
}
```

시간 문자열로 다시 바꾸는 메서드는 다음처럼 둔다.

```java
private String toTimeText(int minute) {
    if (minute == 1440) {
        return "24:00";
    }

    int hour = minute / 60;
    int min = minute % 60;
    return String.format("%02d:%02d", hour, min);
}
```

단, 백엔드 응답에서 `24:00`을 내려줄지 `23:59`를 내려줄지는 프론트 정책에 맞춰야 한다.

결과 화면 표시용이라면 `24:00`이 사용자가 이해하기 쉽다.

---

## 12. AvailabilityService 검증도 함께 정리해야 한다

현재 `AvailabilityService.validateRange()`는 다음처럼 검사한다.

```java
private void validateRange(CandidateSlot slot, LocalTime startTime, LocalTime endTime) {
    if (startTime == null || endTime == null
            || !startTime.isBefore(endTime)
            || startTime.isBefore(slot.getStartTime())
            || endTime.isAfter(slot.getEndTime())) {
        throw new CustomException(ErrorCode.INVALID_SLOT);
    }
}
```

이 검증은 일반적인 시간에는 괜찮다.

예를 들어 후보 슬롯이 다음과 같으면:

```text
14:00 ~ 18:00
```

참가자 응답:

```text
14:00 ~ 15:00
16:00 ~ 17:00
```

정상적으로 통과할 수 있다.

하지만 후보 슬롯이 다음과 같으면:

```text
00:00 ~ 23:59
```

마지막 30분 응답을 어떻게 표현할지 정책이 필요하다.

프론트가 마지막 가능 시간을 다음처럼 보내면:

```json
{
  "startTime": "23:30",
  "endTime": "23:59"
}
```

현재 검증은 통과할 수 있다.

하지만 백엔드 계산에서는 이 값을 `23:30~24:00`으로 봐야 한다.

그래서 검증도 가능하면 분 숫자 기반으로 바꾸는 것이 좋다.

```java
private void validateRange(CandidateSlot slot, LocalTime startTime, LocalTime endTime) {
    if (startTime == null || endTime == null) {
        throw new CustomException(ErrorCode.INVALID_SLOT);
    }

    int slotStart = toStartMinute(slot.getStartTime());
    int slotEnd = toEndMinute(slot.getEndTime());
    int rangeStart = toStartMinute(startTime);
    int rangeEnd = toEndMinute(endTime);

    if (rangeStart >= rangeEnd
            || rangeStart < slotStart
            || rangeEnd > slotEnd) {
        throw new CustomException(ErrorCode.INVALID_SLOT);
    }
}
```

이렇게 하면 `23:59`를 `1440`으로 보정한 뒤 비교할 수 있다.

---

## 13. 프론트도 마지막 시간 표시 함수를 정리하는 것이 좋다

현재 프론트의 `toTimeLabel()`은 숫자를 단순히 `HH:mm`으로 바꾼다.

```ts
function toTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
```

`minutes`가 `1440`이면 결과는 다음과 같다.

```text
24:00
```

화면 표시용으로는 괜찮지만, 백엔드로 `LocalTime`에 매핑되는 값으로 보내면 안 된다.

따라서 프론트에서는 표시용 함수와 전송용 함수를 분리하는 것이 좋다.

### 13.1 표시용 함수

```ts
function toDisplayTimeLabel(minutes: number): string {
  if (minutes === 1440) return "24:00";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
```

### 13.2 백엔드 전송용 함수

```ts
function toApiTimeLabel(minutes: number): string {
  if (minutes === 1440) return "23:59";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
```

그러면 사용자는 화면에서 다음처럼 볼 수 있다.

```text
23:30 ~ 24:00
```

하지만 백엔드로는 다음처럼 보낼 수 있다.

```json
{
  "startTime": "23:30",
  "endTime": "23:59"
}
```

---

## 14. AvailabilityPage에서 수정할 부분

현재 `buildAvailabilites()`에서는 마지막 range의 endTime을 만들 때 `toTimeLabel()`을 사용한다.

```ts
timeRanges.push({
  startTime: toTimeLabel(rangeStart),
  endTime: toTimeLabel(Math.min(previous + STEP, slotEnd)),
});
```

이 부분은 백엔드 전송용이므로 `toApiTimeLabel()`을 쓰는 것이 더 안전하다.

```ts
timeRanges.push({
  startTime: toApiTimeLabel(rangeStart),
  endTime: toApiTimeLabel(Math.min(previous + STEP, slotEnd)),
});
```

그리고 중간에 range를 끊는 부분도 동일하게 바꾼다.

```ts
timeRanges.push({
  startTime: toApiTimeLabel(rangeStart),
  endTime: toApiTimeLabel(Math.min(previous + STEP, slotEnd)),
});
```

단, `slotEnd` 자체가 `23:59`이면 `toMinutes(slot.endTime)`은 `1439`다.

마지막 30분을 정확하게 만들려면 endTime을 분으로 바꾸는 함수도 구분하는 것이 좋다.

```ts
function toStartMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toEndMinutes(time: string): number {
  if (time === "23:59" || time === "23:59:59") {
    return 1440;
  }

  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
```

그리고 slot 종료 시간은 다음처럼 계산한다.

```ts
const slotEnd = toEndMinutes(slot.endTime);
```

이렇게 하면 마지막 셀은 정확히 다음처럼 계산된다.

```text
23:30 + 30 = 1440
```

그리고 API 전송 때만 다음처럼 바꾼다.

```text
1440 -> "23:59"
```

---

## 15. MeetingSlotPage에서 수정할 부분

현재 `MeetingSlotPage.tsx`는 하루 끝을 `23:59`로 보내고 있다.

```ts
const END_OF_DAY = "23:59";
```

이 값 자체를 당장 없애기는 어렵다.

백엔드가 `LocalTime`을 쓰는 동안에는 `"24:00"`을 보내면 역직렬화에 실패할 가능성이 높기 때문이다.

따라서 현재 구조에서는 이 방식이 현실적인 타협이다.

다만 주석을 더 명확히 쓰는 것이 좋다.

```ts
const END_OF_DAY = "23:59";
// 백엔드 LocalTime은 24:00을 받을 수 없으므로,
// API 저장용으로 하루 끝을 23:59로 보낸다.
// 백엔드 계산에서는 이 값을 1440분, 즉 24:00으로 보정해야 한다.
```

즉 `23:59`를 쓰는 것 자체가 무조건 잘못은 아니다.

문제는 백엔드 계산에서 `23:59`를 그냥 `23:59`로만 보고, `LocalTime.plusMinutes(30)`으로 반복한 것이다.

---

## 16. MeetingCreateRequest 검증 개선

현재 `MeetingCreateRequest.SlotRequest`는 다음만 검사한다.

```java
private boolean isEndAfterStart() {
    if (startTime == null || endTime == null) return true;
    return endTime.isAfter(startTime);
}
```

이 검증은 `00:00~23:59`는 통과시킨다.

하지만 다음과 같은 정책 검증은 없다.

```text
시간은 30분 단위여야 한다.
단, endTime의 23:59는 하루 끝 표현으로 허용한다.
```

추가한다면 방향은 다음과 같다.

```java
@AssertTrue(message = "시간은 30분 단위여야 합니다.")
private boolean isThirtyMinuteUnit() {
    if (startTime == null || endTime == null) return true;

    boolean startValid = startTime.getMinute() == 0 || startTime.getMinute() == 30;
    boolean endValid = endTime.getMinute() == 0
            || endTime.getMinute() == 30
            || endTime.equals(LocalTime.of(23, 59));

    return startValid && endValid;
}
```

이렇게 하면 일반 시간은 30분 단위로 제한하면서도, 하루 끝을 나타내는 `23:59`는 허용할 수 있다.

---

## 17. 더 근본적인 개선안

현재 구조를 유지한다면 `23:59`를 `1440`으로 보정하는 방식이 가장 현실적이다.

하지만 더 근본적으로 고치려면 시간 저장 방식을 바꿀 수 있다.

### 17.1 현재 방식

```java
private LocalTime startTime;
private LocalTime endTime;
```

장점:

```text
읽기 쉽다.
기존 코드와 잘 맞는다.
일반적인 시간 표현에 자연스럽다.
```

단점:

```text
24:00을 표현할 수 없다.
23:30~24:00 같은 하루 끝 구간이 애매하다.
자정 경계 계산에서 실수하기 쉽다.
```

### 17.2 개선 방식: 분 숫자로 저장

```java
private Integer startMinute;
private Integer endMinute;
```

예:

```text
00:00 -> 0
14:00 -> 840
23:30 -> 1410
24:00 -> 1440
```

장점:

```text
24:00을 정확히 표현할 수 있다.
30분 단위 계산이 쉽다.
비교와 정렬이 단순하다.
무한 반복 문제가 생기지 않는다.
```

단점:

```text
DB 마이그레이션이 필요하다.
DTO, 엔티티, 응답 변환 로직을 많이 수정해야 한다.
화면 표시를 위해 HH:mm 변환 함수가 필요하다.
```

현재 프로젝트 단계에서는 바로 이 구조로 바꾸기보다, 우선 `LocalTime` 구조를 유지하면서 계산 로직만 안전하게 바꾸는 것이 낫다.

---

## 18. 추천 수정 순서

### 1단계: ResultService 안전화

가장 먼저 `timeBlocks()`를 분 숫자 기반으로 바꾼다.

이유:

```text
현재 CPU/RAM 급증의 직접 원인이기 때문이다.
프론트 수정 없이도 백엔드 안정성이 올라간다.
```

수정 대상:

```text
backend/src/main/java/com/makeapp/backend/service/ResultService.java
```

핵심:

```text
LocalTime.plusMinutes(30) 반복 제거
toEndMinute(23:59) -> 1440 보정
for (int current = start; current < end; current += 30) 사용
```

---

### 2단계: AvailabilityService 검증 안전화

참가자가 보내는 `timeRanges`도 분 숫자 기반으로 검증한다.

수정 대상:

```text
backend/src/main/java/com/makeapp/backend/service/AvailabilityService.java
```

핵심:

```text
slot endTime이 23:59면 1440으로 보정
range endTime이 23:59면 1440으로 보정
rangeStart < rangeEnd 검사
slotStart <= rangeStart
rangeEnd <= slotEnd 검사
```

---

### 3단계: 프론트 시간 변환 함수 분리

표시용 시간과 API 전송용 시간을 분리한다.

수정 대상:

```text
frontend/src/pages/AvailabilityPage.tsx
```

추천 함수:

```ts
function toStartMinutes(time: string): number
function toEndMinutes(time: string): number
function toDisplayTimeLabel(minutes: number): string
function toApiTimeLabel(minutes: number): string
```

핵심:

```text
화면 표시: 1440 -> "24:00"
API 전송: 1440 -> "23:59"
계산: 23:59 -> 1440
```

---

### 4단계: MeetingCreateRequest에 30분 단위 검증 추가

방장이 후보 시간을 만들 때부터 잘못된 시간이 들어오지 않게 막는다.

수정 대상:

```text
backend/src/main/java/com/makeapp/backend/dto/request/MeetingCreateRequest.java
```

정책:

```text
startTime: 00분 또는 30분만 허용
endTime: 00분 또는 30분 허용
endTime: 23:59는 하루 끝 표현으로 예외 허용
```

---

### 5단계: 필요하면 DB 구조 개선

장기적으로는 `LocalTime` 대신 `startMinute`, `endMinute` 저장을 고려할 수 있다.

하지만 이건 변경 범위가 크므로 지금 당장 필수는 아니다.

---

## 19. 최종 결론

현재 문제의 핵심은 다음이다.

```text
프론트는 하루 끝을 23:59로 보낸다.
백엔드는 이 값을 LocalTime으로 받는다.
ResultService는 LocalTime에 30분을 계속 더한다.
23:30 + 30분이 24:00이 아니라 00:00으로 돌아간다.
반복문이 끝나지 않아 결과 API가 pending되고 CPU/RAM이 튄다.
```

현재 구조에서 가장 좋은 해결책은 다음이다.

```text
API/DB 저장은 지금처럼 LocalTime을 유지한다.
하루 끝은 23:59로 저장한다.
하지만 계산할 때는 23:59를 1440분, 즉 24:00으로 보정한다.
LocalTime.plusMinutes() 반복 대신 int 분 숫자로 계산한다.
```

즉, 중요한 원칙은 이것이다.

```text
LocalTime은 저장/입출력용으로만 사용한다.
시간 구간 계산은 int minute으로 한다.
```

이렇게 바꾸면 `23:30~24:00`도 안전하게 표현할 수 있고, 결과 화면에서 추천 시간대를 세밀하게 보여주는 기능도 다시 살릴 수 있다.
