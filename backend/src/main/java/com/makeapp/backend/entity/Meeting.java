package com.makeapp.backend.entity;


import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 모임 자체를 나타내는 엔터티

@Entity
@Table(name = "MEETINGS")
@SQLRestriction("deleted_at IS NULL")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Meeting extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "meeting_seq")
    @SequenceGenerator(name = "meeting_seq", sequenceName = "SEQ_MEETINGS", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // 소셜 로그인 한 사람은 여러 개의 모임을 만들 수 있음
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(name = "expected_count")
    private Integer expectedCount;

    @Column(name = "invite_token", nullable = false, unique = true, length = 36)
    private String inviteToken;

    @Column(name = "result_token", nullable = false, unique = true, length = 36)
    private String resultToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MeetingStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_slot_id")
    private CandidateSlot confirmedSlot;

    @Builder
    public Meeting(User owner, String name, Integer expectedCount, String inviteToken, String resultToken) {
        this.owner = owner;
        this.name = name;
        this.expectedCount = expectedCount;
        this.inviteToken = inviteToken;
        this.resultToken = resultToken;
        this.status = MeetingStatus.OPEN;
    }

    public void confirm(CandidateSlot slot) {
        this.confirmedSlot = slot;
        this.status = MeetingStatus.CONFIRMED;
    }

    public void expire() {
        this.status = MeetingStatus.EXPIRED;
    }
}
