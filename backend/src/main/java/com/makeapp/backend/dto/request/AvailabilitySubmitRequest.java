package com.makeapp.backend.dto.request;

import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AvailabilitySubmitRequest {

    @Valid
    private List<AvailabilityItem> availabilities;

    @Getter
    @NoArgsConstructor
    public static class AvailabilityItem {

        @NotNull(message = "후보 슬롯 ID를 입력해주세요.")
        private Long candidateSlotId;

        @NotNull(message = "가능 상태를 입력해주세요.")
        private String status;

        @Valid
        private List<TimeRangeItem> timeRanges;
    }

    @Getter
    @NoArgsConstructor
    public static class TimeRangeItem {

        @NotNull(message = "시작 시간을 입력해주세요.")
        private LocalTime startTime;

        @NotNull(message = "종료 시간을 입력해주세요.")
        private LocalTime endTime;
    }
}
