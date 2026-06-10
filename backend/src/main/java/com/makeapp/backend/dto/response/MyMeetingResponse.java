package com.makeapp.backend.dto.response;

import com.makeapp.backend.entity.Meeting;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MyMeetingResponse {                 // 목록 요약 → 슬롯/토큰 없이 participantCount만

    private final Long id;
    private final String name;
    private final String status;
    private final long participantCount;
    private final LocalDateTime createdAt;

    public MyMeetingResponse(Meeting meeting, long participantCount) {
        this.id = meeting.getId();
        this.name = meeting.getName();
        this.status = meeting.getStatus().name();
        this.participantCount = participantCount;
        this.createdAt = meeting.getCreatedAt();
    }
}
