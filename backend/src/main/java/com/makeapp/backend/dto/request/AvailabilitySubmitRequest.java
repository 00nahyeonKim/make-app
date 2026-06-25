package com.makeapp.backend.dto.request;

import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor // 기본 생성자 자동 생성
public class AvailabilitySubmitRequest {

    @Valid // 리스트 안 각 항목의 검증도 함께 수행
    private List<AvailabilityItem> availabilities; // 여러 슬롯에 대한 응답을 한 번에 받음

    @Getter
    @NoArgsConstructor
    public static class AvailabilityItem { // 슬롯 하나에 대한 가용 응

        @NotNull(message = "후보 슬롯 ID를 입력해주세요.")
        private Long candidateSlotId; // 어떤 후보 시간인지

        @NotNull(message = "가용 상태를 입력해주세요.")
        private String status; // "AVAILABLE" 또는 "UNAVAILABLE"

        private LocalTime startTime; // AVAILABLE 시 부분 가용 시작 시간 (null이면 슬롯 전체)
        private LocalTime endTime;   // AVAILABLE 시 부분 가용 종료 시간 (null이면 슬롯 전체)
    }
}
