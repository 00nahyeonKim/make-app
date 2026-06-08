package com.makeapp.backend.dto.response;

import java.time.LocalDateTime;

import com.makeapp.backend.entity.Participant;

import lombok.Getter;

@Getter
public class ParticipantResponse {  // 참가자 정보를 외부에 응답할 모

    private final Long id;
    private final String displayName;
    private final String type;
    private final boolean submitted;
    private final LocalDateTime submittedAt; // 가용 시간 제출 여부

    // 생성자는 private -> 외부에서는 of()로만 생성(엔티티에서 필요한 값만 골라 복사)
    private ParticipantResponse(Participant p) {
        this.id = p.getId();
        this.displayName = p.getDisplayName();
        this.type = p.getType().name(); // enum 문자열
        this.submitted = p.isSubmitted();
        this.submittedAt = p.getSubmittedAt();
    }

    public static ParticipantResponse of(Participant p) {
        return new ParticipantResponse(p);
    }
}
