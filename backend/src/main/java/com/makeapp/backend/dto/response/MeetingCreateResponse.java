package com.makeapp.backend.dto.response;

import com.makeapp.backend.entity.Meeting;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MeetingCreateResponse {             // 생성 직후 리더에게만 반환 → 토큰/URL 포함 OK

    private final Long id;
    private final String name;
    private final Integer expectedCount;
    private final String status;
    private final String inviteToken;
    private final String resultToken;
    private final String inviteUrl;              // 프론트 초대 링크 (토큰을 URL로 가공)
    private final String resultUrl;              // 프론트 결과 링크
    private final LocalDateTime createdAt;

    public MeetingCreateResponse(Meeting meeting, String frontBaseUrl) {
        this.id = meeting.getId();
        this.name = meeting.getName();
        this.expectedCount = meeting.getExpectedCount();
        this.status = meeting.getStatus().name();          // enum → 문자열
        this.inviteToken = meeting.getInviteToken();
        this.resultToken = meeting.getResultToken();
        this.inviteUrl = frontBaseUrl + "/invite/" + meeting.getInviteToken();   // 공유용 전체 URL 조립
        this.resultUrl = frontBaseUrl + "/result/" + meeting.getResultToken();
        this.createdAt = meeting.getCreatedAt();
    }
}
