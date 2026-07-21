package com.makeapp.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.MeetingStatus;
import com.makeapp.backend.entity.User;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    Optional<Meeting> findByInviteToken(String inviteToken);

    // 정원 확인과 참가자 저장을 한 트랜잭션으로 직렬화해 동시 요청의 정원 초과를 막는다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Meeting m where m.inviteToken = :inviteToken")
    Optional<Meeting> findByInviteTokenForUpdate(@Param("inviteToken") String inviteToken);
    Optional<Meeting> findByResultToken(String resultToken);
    Page<Meeting> findByOwner(User owner, Pageable pageable); // 내가 만든 전체 미팅 목록 페이징 조회 (마이페이지 전체 탭)
    Page<Meeting> findByOwnerAndStatus(User owner, MeetingStatus status, Pageable pageable); // 내가 만든 미팅 중 특정 상태만 필터링하여 페이징 조회 (마이페이지 상태별 탭)
}
