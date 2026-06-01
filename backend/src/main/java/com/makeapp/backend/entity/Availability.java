package com.makeapp.backend.entity;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "AVAILABILITIES")
@Getter
@SQLRestriction("deleted_at IS NULL")
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 파라미터 없는 기본 생성자를 protected로 만듦. Availability 객체를 만들 때 반드시 Builder를 통해서만 생성하도록 강제
public class Availability extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "availability_seq")
    @SequenceGenerator(name = "availability_seq", sequenceName = "SEQ_AVAILABILITIES", allocationSize = 50)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // 하나의 Participant가 여러 시간대에 대해 가능 여부를 제출
    @JoinColumn(name = "participant_id", nullable = false) // AVAILABILITIES가 PARTICIPANTS의 id를 참조하기 위해 자신의 테이블에 participant_id 컬럼을 가짐
    private Participant participant;

    @ManyToOne(fetch = FetchType.LAZY) // 하나의 CandidateSlot에 여러 참가자가 가능 여부를 제출
    @JoinColumn(name = "candidate_slot_id", nullable = false)
    private CandidateSlot candidateSlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AvailabilityStatus status;

    @Builder
    public Availability(Participant participant, CandidateSlot candidateSlot,
                        AvailabilityStatus status) {
        this.participant = participant;
        this.candidateSlot = candidateSlot;
        this.status = status;
    }

    public void updateStatus(AvailabilityStatus status) {
        this.status = status;
    }
}
