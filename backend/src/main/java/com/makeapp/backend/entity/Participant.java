package com.makeapp.backend.entity;

import java.time.LocalDateTime;

import org.flywaydb.core.api.ErrorCode;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import lombok.Builder;

public class Participant extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "participant_seq")
    @SequenceGenerator(name = "participant_seq", sequenceName = "SEQ_PARTICIPANTS", allocationSize = 50)
    private Long Id;

    @ManyToOne(fetch = FetchType.LAZY) // 하나의 Meeting에 여러 Participant가 있을 수 있다.
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.LAZY) // 하나의 User가 여러 모임에 참가할 수 있다.
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_token", length = 64) // 비회원 본인 식별용 토큰 - 나중에 다시 왔을 때 같은 사람인지 확인(기기나 브라우저가 바뀌면 인식 못함 이슈로 다른 기기로 접속하고 싶으면 소셜 로그인 해야 함.)
    private String guestToken;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipantType type;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Builder
    public Participant(Meeting meeting, User user, String guestToken,
                       String displayName, ParticipantType type) {
        this.meeting = meeting;
        this.user = user;
        this.guestToken = guestToken;
        this.displayName = displayName;
        this.type = type;
    }

    public void submit() {
        this.submittedAt = LocalDateTime.now();
    }

    // submittedAt이 null이면 미제출, 값이 있으면 제출 완료
    // → 직접 null 비교 대신 이 메서드를 호출해서 내부 구현을 캡슐화
    public boolean isSubmitted() {
        return this.submittedAt != null;
    }

    @PrePersist // 엔터티가 처음 DB에 저장되기 직전에 실행
    @PreUpdate // 엔터티가 DB에 수정되기 직전에 실행
    // 소셜/비회원 둘 중 어느쪽으로든 로그인한 사림인지 검증
    private void validate() {
        if (user == null && guestToken == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
    }
}
