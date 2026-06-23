package com.makeapp.backend.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor // 기본 생성자 자동 생성
public class MeetingCreateRequest {

    @NotBlank(message = "모임 이름을 입력해주세요.")
    @Size(max = 20, message = "모임 이름은 최대 20자입니다.")
    private String name;

    @Min(value = 2, message = "참가 인원은 최소 2명 이상이어야 합니다.")
    @Max(value = 99, message = "참가 인원은 최대 99명입니다.")
    private Integer expectedCount;

    @NotEmpty(message = "후보 슬롯을 1개 이상 입력해주세요.")
    @Valid
    private List<SlotRequest> candidateSlots;

    @Getter
    @NoArgsConstructor
    public static class  SlotRequest {
        
        @NotNull(message = "날짜를 입력해주세요.")
        @FutureOrPresent(message = "과거 날짜는 입력할 수 없습니다.")
        private LocalDate slotDate;

        @NotNull(message = "시작 시간을 입력해주세요.")
        private LocalTime startTime;

        @NotNull(message = "종료 시간을 입력해주세요.")
        private LocalTime endTime;

        @AssertTrue(message = "종료 시간은 시작 시간보다 늦어야 합니다.")  // 교차 필드 검증 - 이 메서드가 true를 반환하면 검증 통과
        private boolean isEndAfterStart() {
            if (startTime == null || endTime == null) return true;  // null은 @NotNull이 따로 처리
            return endTime.isAfter(startTime);
        }
    }
}
