package com.makeapp.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
    private final List<SlotInfo> candidateSlots;
    @JsonInclude(JsonInclude.Include.NON_NULL)   // 확정 전(null)이면 응답에서 생략
    private final SlotInfo confirmedSlot;        // 확정 전이면 null
    private final LocalDateTime createdAt;

    // 엔티티/슬롯을 받아 응답 필드를 채움 (조회 응답엔 프론트 URL이 없으므로 frontBaseUrl 불필요)
    public MeetingDetailResponse(Meeting meeting, List<CandidateSlot> slots) {
        this.id = meeting.getId();
        this.name = meeting.getName();
        this.expectedCount = meeting.getExpectedCount();
        this.status = meeting.getStatus().name();          // enum → 문자열
        this.ownerName = meeting.getOwner().getName();     // owner(User)에서 닉네임만 꺼냄
        this.candidateSlots = slots.stream().map(SlotInfo::from).toList();      // 슬롯 엔티티들 → SlotInfo들
        this.confirmedSlot = meeting.getConfirmedSlot() != null                 // 확정 전이면 null
                ? SlotInfo.from(meeting.getConfirmedSlot()) : null;
        this.createdAt = meeting.getCreatedAt();
    }

    @Getter
    public static class SlotInfo {               // 후보 시간 하나를 응답할 모양
        private final Long id;
        private final LocalDate slotDate;
        private final LocalTime startTime;
        private final LocalTime endTime;

        private SlotInfo(CandidateSlot slot) {
            this.id = slot.getId();
            this.slotDate = slot.getSlotDate();
            this.startTime = slot.getStartTime();
            this.endTime = slot.getEndTime();
        }

        public static SlotInfo from(CandidateSlot slot) {   // 엔티티 → SlotInfo 변환 팩토리
            return new SlotInfo(slot);
        }
    }
}
