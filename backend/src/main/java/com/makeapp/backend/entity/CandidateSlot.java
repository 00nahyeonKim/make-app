package com.makeapp.backend.entity;


import java.time.LocalDate;
import java.time.LocalTime;

import org.hibernate.annotations.SQLRestriction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

// 모임을 만들 때 주최자가 제시하는 후보 날짜/시간 슬롯 엔터티

@Entity
@Table(name = "CANDIDATE_SLOTS")
@SQLRestriction("deleted_at IS NULL") // 실질적으로 동작하진 않지만, 일관성 + 미래 대비(슬롯 삭제 기능 추가) 때문에 추가
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 생성자의 접근 제한자를 protected로 만듦
public class CandidateSlot extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "candidate_slot_seq")
    @SequenceGenerator(name = "candidate_slot_seq", sequenceName = "SEQ_CANDIDATE_SLOTS", allocationSize = 50)
    private Long id;

    // 하나의 약속을 위해 여러 개의 CandidateSlot이 존재 가능.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Builder
    public CandidateSlot(Meeting meeting, LocalDate slotDate, LocalTime startTime, LocalTime endTime) {
        this.meeting = meeting;
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
