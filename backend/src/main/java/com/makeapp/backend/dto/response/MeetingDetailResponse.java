package com.makeapp.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.makeapp.backend.entity.CandidateSlot;
import com.makeapp.backend.entity.Meeting;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
public class MeetingDetailResponse {             // 공개 조회용 → 토큰 일절 미포함(resultToken 누출 차단)

    private final Long id;
    private final String name;
    private final Integer expectedCount;
    private final String status;
    private final String ownerName;              // 주최자 닉네임 (User.name)

    @JsonProperty("isOwner") // 요청자가 이 모임의 주최자인가
    private final boolean isOwner;

    @JsonInclude(JsonInclude.Include.NON_NULL) // 주최자 확인이 끝난 응답에만 채움
    private final String resultToken;

    private final List<SlotInfo> candidateSlots;
    @JsonInclude(JsonInclude.Include.NON_NULL)   // 확정 전(null)이면 응답에서 생략
    private final SlotInfo confirmedSlot;        // 확정 전이면 null
    private final LocalDateTime createdAt;

    // 방장 정보가 필요없는 곳: 결과 토큰 조회 등
    public MeetingDetailResponse(Meeting meeting, List<CandidateSlot> slots) {
        this(meeting, slots, false, null);
    }

    // 초대 조회: 방장 여부만 알려주고 토큰은 안 준다
    public MeetingDetailResponse(Meeting meeting, List<CandidateSlot> slots, boolean isOwner) {
        this(meeting, slots, isOwner, null);
    }

    // 전체 생성자: 확정 응답처럼 주최자 검증이 끝난 경우에만 resultToken까지
    // 엔티티/슬롯을 받아 응답 필드를 채움 (조회 응답엔 프론트 URL이 없으므로 frontBaseUrl 불필요)
    public MeetingDetailResponse(Meeting meeting, List<CandidateSlot> slots,
                                 boolean isOwner, String resultToken) {
        this.id = meeting.getId();
        this.name = meeting.getName();
        this.expectedCount = meeting.getExpectedCount();
        this.status = meeting.getStatus().name();          // enum → 문자열
        this.ownerName = meeting.getOwner().getName();     // owner(User)에서 닉네임만 꺼냄
        this.isOwner = isOwner;
        this.resultToken = resultToken;
        this.candidateSlots = slots.stream().map(SlotInfo::from).toList();      // 슬롯 엔티티들 → SlotInfo들
        this.confirmedSlot = meeting.getConfirmedSlot() != null                 // 확정 전이면 null
                ? SlotInfo.from(meeting.getConfirmedSlot()) : null;
        this.createdAt = meeting.getCreatedAt();
    }

    @Getter
    public static class SlotInfo {               // 후보 시간 하나를 응답할 모양
        private final Long id;
        private final LocalDate startDate;
        private final LocalDate endDate;
        private final LocalTime startTime;
        private final LocalTime endTime;

        private SlotInfo(CandidateSlot slot) {
            this.id = slot.getId();
            this.startDate = slot.getStartDate();
            this.endDate = slot.getEndDate();
            this.startTime = slot.getStartTime();
            this.endTime = slot.getEndTime();
        }

        public static SlotInfo from(CandidateSlot slot) {   // 엔티티 → SlotInfo 변환 팩토리
            return new SlotInfo(slot);
        }
    }
}
