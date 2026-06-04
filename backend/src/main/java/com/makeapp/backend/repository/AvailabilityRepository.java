package com.makeapp.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.makeapp.backend.entity.Availability;
import com.makeapp.backend.entity.CandidateSlot;
import com.makeapp.backend.entity.Participant;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    List<Availability> findByParticipant(Participant participant); // 특정 참가자가 응답한 모든 가용 시간 목록 반환
    List<Availability> findByCandidateSlot(CandidateSlot slot); // 특정 후보 시간대에 응답한 모든 참가자의 가용 시간 목록 반환
    Optional<Availability> findByParticipantAndCandidateSlot(Participant participant, CandidateSlot slot); // 특정 참가자 × 특정 슬롯 조합 1건 반환
}
