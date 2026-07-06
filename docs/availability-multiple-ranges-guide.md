# 후보 슬롯별 여러 가능 시간 구간 구현 순서

## 목표

참가자가 후보 슬롯 하나 안에서 여러 개의 가능한 시간 구간을 선택할 수 있게 만든다.

예시:

```text
후보 슬롯: 14:00 ~ 18:00
참가자 A: 14:00 ~ 15:00 가능, 16:00 ~ 17:00 가능
```

이 기능은 참가자가 `CandidateSlot` 자체를 수정하는 기능이 아니다. 방장이 만든 후보 슬롯은 그대로 두고, 참가자의 응답인 `Availability` 아래에 여러 개의 가능 시간 구간을 저장하는 구조로 바꾼다.

최종 구조:

```text
Meeting
  └─ CandidateSlot
       └─ Availability
            └─ AvailabilityTimeRange 여러 개
```

## 0. 현재 구조 이해하기

먼저 현재 관련 파일을 확인한다.

```text
backend/src/main/java/com/makeapp/backend/entity/Availability.java
backend/src/main/java/com/makeapp/backend/dto/request/AvailabilitySubmitRequest.java
backend/src/main/java/com/makeapp/backend/service/AvailabilityService.java
backend/src/main/java/com/makeapp/backend/repository/AvailabilityRepository.java
backend/src/main/java/com/makeapp/backend/service/ParticipantService.java
backend/src/main/java/com/makeapp/backend/service/ResultService.java
backend/src/main/resources/db/migration/V5__create_availabilities.sql
backend/src/main/resources/db/migration/V16__add_participant_times_to_availabilities.sql
```

현재 `AVAILABILITIES` 테이블에는 이 제약이 있다.

```sql
CONSTRAINT uq_avail UNIQUE (participant_id, candidate_slot_id)
```

그래서 한 참가자는 한 후보 슬롯에 대해 `Availability`를 1개만 가진다. 이 구조는 유지한다. 대신 `Availability` 1개 아래에 여러 개의 `AvailabilityTimeRange`를 붙인다.

## 1. DB 마이그레이션 추가

새 파일을 만든다.

```text
backend/src/main/resources/db/migration/V18__create_availability_time_ranges.sql
```

내용 예시:

```sql
CREATE TABLE availability_time_ranges (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    availability_id NUMBER(19,0) NOT NULL,
    start_time      TIMESTAMP    NOT NULL,
    end_time        TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at      TIMESTAMP,
    CONSTRAINT fk_avail_range_availability
        FOREIGN KEY (availability_id) REFERENCES availabilities(id)
);

CREATE INDEX idx_avail_range_availability
    ON availability_time_ranges(availability_id);
```

프로젝트의 기존 시퀀스 방식에 맞추려면 다음 마이그레이션을 추가로 만들거나 같은 파일에 이어서 작성한다.

```sql
CREATE SEQUENCE SEQ_AVAILABILITY_TIME_RANGES START WITH 1 INCREMENT BY 50;

ALTER TABLE availability_time_ranges
  MODIFY id DROP IDENTITY;

ALTER TABLE availability_time_ranges
  MODIFY id DEFAULT SEQ_AVAILABILITY_TIME_RANGES.NEXTVAL NOT NULL;
```

참고:

- 현재 Java 코드는 `LocalTime`을 사용한다.
- 기존 `V16__add_participant_times_to_availabilities.sql`은 `TIMESTAMP`를 사용했다.
- 우선 프로젝트 기존 흐름에 맞춰 `TIMESTAMP`를 유지해도 된다.

## 2. `AvailabilityTimeRange` 엔티티 추가

새 파일을 만든다.

```text
backend/src/main/java/com/makeapp/backend/entity/AvailabilityTimeRange.java
```

예시:

```java
package com.makeapp.backend.entity;

import java.time.LocalTime;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "AVAILABILITY_TIME_RANGES")
@Getter
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AvailabilityTimeRange extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "availability_time_range_seq")
    @SequenceGenerator(
            name = "availability_time_range_seq",
            sequenceName = "SEQ_AVAILABILITY_TIME_RANGES",
            allocationSize = 50
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "availability_id", nullable = false)
    private Availability availability;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Builder
    public AvailabilityTimeRange(Availability availability, LocalTime startTime, LocalTime endTime) {
        this.availability = availability;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
```

## 3. `Availability` 엔티티 수정

파일:

```text
backend/src/main/java/com/makeapp/backend/entity/Availability.java
```

현재 단일 구간 필드는 더 이상 사용하지 않는다.

```java
@Column(name = "participant_start_time")
private LocalTime participantStartTime;

@Column(name = "participant_end_time")
private LocalTime participantEndTime;
```

대신 여러 구간을 가진다.

```java
@OneToMany(mappedBy = "availability", cascade = CascadeType.ALL, orphanRemoval = true)
private List<AvailabilityTimeRange> timeRanges = new ArrayList<>();
```

필요 import:

```java
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
```

상태 변경 메서드와 시간 구간 교체 메서드를 추가한다.

```java
public void updateStatus(AvailabilityStatus status) {
    this.status = status;
}

public void replaceTimeRanges(List<AvailabilityTimeRange> ranges) {
    this.timeRanges.clear();
    this.timeRanges.addAll(ranges);
}
```

생성자도 단일 시간 필드를 받지 않도록 바꾼다.

```java
@Builder
public Availability(Participant participant, CandidateSlot candidateSlot, AvailabilityStatus status) {
    this.participant = participant;
    this.candidateSlot = candidateSlot;
    this.status = status;
}
```

## 4. 요청 DTO 수정

파일:

```text
backend/src/main/java/com/makeapp/backend/dto/request/AvailabilitySubmitRequest.java
```

현재는 슬롯 하나당 `startTime`, `endTime` 하나만 받는다.

```java
private LocalTime startTime;
private LocalTime endTime;
```

이 필드를 제거하고, 슬롯 하나당 여러 시간 구간을 받도록 바꾼다.

```java
@Valid
private List<TimeRangeItem> timeRanges;

@Getter
@NoArgsConstructor
public static class TimeRangeItem {

    @NotNull(message = "시작 시간을 입력해주세요.")
    private LocalTime startTime;

    @NotNull(message = "종료 시간을 입력해주세요.")
    private LocalTime endTime;
}
```

최종 요청 JSON은 이런 형태가 된다.

```json
{
  "availabilities": [
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
    },
    {
      "candidateSlotId": 11,
      "status": "UNAVAILABLE",
      "timeRanges": []
    }
  ]
}
```

## 5. `AvailabilityService.upsert()` 저장 로직 수정

파일:

```text
backend/src/main/java/com/makeapp/backend/service/AvailabilityService.java
```

현재는 `Availability` 하나에 `startTime`, `endTime`을 직접 저장한다.

```java
Availability avail = availabilityRepository
        .findByParticipantAndCandidateSlot(participant, slot)
        .orElseGet(() -> Availability.builder()
                .participant(participant)
                .candidateSlot(slot)
                .status(status)
                .participantStartTime(startTime)
                .participantEndTime(endTime)
                .build());
avail.update(status, startTime, endTime);
availabilityRepository.save(avail);
```

이 흐름으로 바꾼다.

1. `Availability`는 참가자 + 후보 슬롯 기준으로 1개만 찾는다.
2. 없으면 새로 만든다.
3. `status`를 갱신한다.
4. `UNAVAILABLE`이면 시간 구간을 비운다.
5. `AVAILABLE`이면 `timeRanges`를 검증한 뒤 새로 저장한다.

예시:

```java
Availability avail = availabilityRepository
        .findByParticipantAndCandidateSlot(participant, slot)
        .orElseGet(() -> Availability.builder()
                .participant(participant)
                .candidateSlot(slot)
                .status(status)
                .build());

avail.updateStatus(status);

List<AvailabilityTimeRange> ranges = new ArrayList<>();

if (status == AvailabilityStatus.AVAILABLE) {
    if (item.getTimeRanges() == null || item.getTimeRanges().isEmpty()) {
        throw new CustomException(ErrorCode.INVALID_SLOT);
    }

    validateNoOverlap(item.getTimeRanges());

    for (var range : item.getTimeRanges()) {
        LocalTime startTime = range.getStartTime();
        LocalTime endTime = range.getEndTime();

        validateRange(slot, startTime, endTime);

        ranges.add(AvailabilityTimeRange.builder()
                .availability(avail)
                .startTime(startTime)
                .endTime(endTime)
                .build());
    }
}

avail.replaceTimeRanges(ranges);
availabilityRepository.save(avail);
```

필요 import 예시:

```java
import java.util.ArrayList;
import java.util.Comparator;
```

시간 구간이 후보 슬롯 범위 안인지 검증한다.

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

같은 후보 슬롯 안에서 참가자의 시간 구간끼리 겹치지 않는지도 검증한다.

```java
private void validateNoOverlap(List<AvailabilitySubmitRequest.TimeRangeItem> ranges) {
    List<AvailabilitySubmitRequest.TimeRangeItem> sorted = ranges.stream()
            .sorted(Comparator.comparing(AvailabilitySubmitRequest.TimeRangeItem::getStartTime))
            .toList();

    for (int i = 1; i < sorted.size(); i++) {
        LocalTime prevEnd = sorted.get(i - 1).getEndTime();
        LocalTime currentStart = sorted.get(i).getStartTime();

        if (currentStart.isBefore(prevEnd)) {
            throw new CustomException(ErrorCode.INVALID_SLOT);
        }
    }
}
```

이 검증은 `14:00~15:00`, `15:00~16:00`처럼 맞닿는 구간은 허용한다. 겹치는 `14:00~15:30`, `15:00~16:00`은 막는다.

## 6. `/participants/me` 응답 수정

파일:

```text
backend/src/main/java/com/makeapp/backend/service/ParticipantService.java
```

현재 본인 응답 조회는 `candidateSlotId`, `status`만 내려준다.

```java
item.put("candidateSlotId", a.getCandidateSlot().getId());
item.put("status", a.getStatus().name());
```

프론트가 수정 화면을 다시 그릴 수 있도록 `timeRanges`도 내려준다.

```java
item.put("timeRanges", a.getTimeRanges().stream()
        .map(range -> {
            Map<String, Object> rangeMap = new LinkedHashMap<>();
            rangeMap.put("startTime", range.getStartTime().toString());
            rangeMap.put("endTime", range.getEndTime().toString());
            return rangeMap;
        })
        .toList());
```

응답 예시:

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

## 7. `/availabilities` 전체 조회 응답 수정

파일:

```text
backend/src/main/java/com/makeapp/backend/service/AvailabilityService.java
```

현재 `participantsOf()`는 참가자별 단일 `startTime`, `endTime`만 내려준다.

```java
if (a.getParticipantStartTime() != null) m.put("startTime", a.getParticipantStartTime().toString());
if (a.getParticipantEndTime() != null) m.put("endTime", a.getParticipantEndTime().toString());
```

여러 구간 배열로 바꾼다.

```java
m.put("timeRanges", a.getTimeRanges().stream()
        .map(range -> {
            Map<String, Object> rangeMap = new LinkedHashMap<>();
            rangeMap.put("startTime", range.getStartTime().toString());
            rangeMap.put("endTime", range.getEndTime().toString());
            return rangeMap;
        })
        .toList());
```

그러면 후보 슬롯별 참가자 목록에서 각 참가자가 가능한 구간들을 볼 수 있다.

## 8. `ResultService` 결과 계산 확장

파일:

```text
backend/src/main/java/com/makeapp/backend/service/ResultService.java
```

현재 결과 계산은 후보 슬롯 하나에 대해 `AVAILABLE` 참가자 수만 센다.

```java
long available = avails.stream()
        .filter(a -> a.getStatus() == AvailabilityStatus.AVAILABLE).count();
```

여러 시간 구간 기능에서는 후보 슬롯 내부를 시간 블록으로 쪼개서 계산하는 것이 좋다.

예시:

```text
후보 슬롯: 14:00 ~ 18:00

14:00 ~ 15:00 가능 2명
15:00 ~ 16:00 가능 1명
16:00 ~ 17:00 가능 3명
17:00 ~ 18:00 가능 2명
```

처음에는 30분 단위 또는 1시간 단위로 쪼개는 방식을 추천한다.

응답 예시:

```json
{
  "id": 10,
  "startTime": "14:00",
  "endTime": "18:00",
  "availableCount": 3,
  "timeBlocks": [
    {
      "startTime": "14:00",
      "endTime": "15:00",
      "availableCount": 2
    },
    {
      "startTime": "15:00",
      "endTime": "16:00",
      "availableCount": 1
    }
  ]
}
```

처음 구현할 때는 기존 `availableCount`를 유지하고 `timeBlocks`를 추가하는 방식이 프론트와 맞추기 쉽다.

## 9. 프론트 요청 JSON 변경

기존 요청이 이런 형태였다면:

```json
{
  "availabilities": [
    {
      "candidateSlotId": 10,
      "status": "AVAILABLE",
      "startTime": "14:00",
      "endTime": "15:00"
    }
  ]
}
```

새 요청은 이렇게 바꾼다.

```json
{
  "availabilities": [
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
  ]
}
```

`UNAVAILABLE`인 경우:

```json
{
  "candidateSlotId": 10,
  "status": "UNAVAILABLE",
  "timeRanges": []
}
```

## 10. 최종 체크리스트

- `V18__create_availability_time_ranges.sql`
  - `availability_time_ranges` 테이블 생성
  - 필요하면 `SEQ_AVAILABILITY_TIME_RANGES` 생성

- `AvailabilityTimeRange.java`
  - 새 엔티티 추가

- `Availability.java`
  - 단일 시간 필드 제거 또는 미사용
  - `List<AvailabilityTimeRange> timeRanges` 추가
  - `updateStatus()`, `replaceTimeRanges()` 추가

- `AvailabilitySubmitRequest.java`
  - `startTime`, `endTime` 제거
  - `List<TimeRangeItem> timeRanges` 추가

- `AvailabilityService.java`
  - `upsert()`에서 여러 구간 저장
  - 슬롯 범위 검증
  - 구간 겹침 검증
  - 전체 조회 응답에 `timeRanges` 포함

- `ParticipantService.java`
  - `/participants/me` 응답에 본인 `timeRanges` 포함

- `ResultService.java`
  - 후보 슬롯 내부 시간 블록별 가능 인원 계산 추가

- 프론트
  - 요청 JSON을 `timeRanges` 배열 구조로 변경

## 구현 후 확인할 API

저장 API:

```http
PUT /api/meetings/{inviteToken}/availabilities
Content-Type: application/json
```

요청:

```json
{
  "availabilities": [
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
    },
    {
      "candidateSlotId": 11,
      "status": "UNAVAILABLE",
      "timeRanges": []
    }
  ]
}
```

기대 동작:

- 같은 참가자와 같은 후보 슬롯의 `Availability`는 1개만 유지된다.
- `Availability` 아래에 여러 개의 `AvailabilityTimeRange`가 저장된다.
- 다시 수정하면 기존 시간 구간들이 새 요청의 `timeRanges`로 교체된다.
- `UNAVAILABLE`로 바꾸면 해당 `Availability`의 시간 구간은 비워진다.
