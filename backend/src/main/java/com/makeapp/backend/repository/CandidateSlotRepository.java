package com.makeapp.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.makeapp.backend.entity.CandidateSlot;
import com.makeapp.backend.entity.Meeting;

public interface CandidateSlotRepository extends JpaRepository<CandidateSlot, Long> {
    // 하나의 모임에는 여러 개의 후보 시간 슬롯이 있을 수 있다.
    List<CandidateSlot> findByMeeting(Meeting meeting);
}
