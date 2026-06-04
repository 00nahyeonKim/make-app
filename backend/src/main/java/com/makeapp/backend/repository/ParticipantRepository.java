package com.makeapp.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.Participant;
import com.makeapp.backend.entity.User;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    List<Participant> findByMeeting(Meeting meeting); // 특정 미팅의 참가자 전체 목록 조회
    Optional<Participant> findByMeetingAndUser(Meeting meeting, User user); // 특정 미팅에서 특정 로그인 유저의 참가 정보 조회
    Optional<Participant> findByMeetingAndGuestToken(Meeting meeting, String guestToken); // 특정 미팅에서 비회원 로그인 유저의 참가 정보 조회
    boolean existexistsByMeetingAndUser(Meeting meeting, User user); // 존재 여부만 확인하는 상황에선 findByMeetingAndUser 대신에 이걸 씀. 더 가볍고 명확하기 때문.
}
