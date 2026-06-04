package com.makeapp.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.MeetingStatus;
import com.makeapp.backend.entity.User;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    Optional<Meeting> findByInviteToken(String inviteToken);
    Optional<Meeting> findByResultToken(String resultToken);
    Page<Meeting> findByOwner(User owner, Pageable pageable); // 내가 만든 전체 미팅 목록 페이징 조회 (마이페이지 전체 탭)
    Page<Meeting> findByOwnerAndStatus(User owner, MeetingStatus status, Pageable pageable); // 내가 만든 미팅 중 특정 상태만 필터링하여 페이징 조회 (마이페이지 상태별 탭)
}
