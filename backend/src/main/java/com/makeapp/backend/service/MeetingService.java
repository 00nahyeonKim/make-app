package com.makeapp.backend.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.dto.request.MeetingCreateRequest;
import com.makeapp.backend.dto.response.MeetingCreateResponse;
import com.makeapp.backend.dto.response.MeetingDetailResponse;
import com.makeapp.backend.entity.CandidateSlot;
import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.MeetingStatus;
import com.makeapp.backend.entity.User;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.CandidateSlotRepository;
import com.makeapp.backend.repository.MeetingRepository;
import com.makeapp.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // final 필드들의 생성자를 자동 생성
@Transactional
public class MeetingService {

    private static final String FRONT_BASE_URL = "http://localhost:5173";

    private final MeetingRepository meetingRepository;
    private final CandidateSlotRepository candidateSlotRepository;
    private final UserRepository userRepository;

    // 모임 생성: 로그인 사용자를 주최자로, 하보 슬롯들과 함께 저장
    public MeetingCreateResponse create(Long userId, MeetingCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));

        Meeting meeting = meetingRepository.save(Meeting.builder()
                .owner(user)
                .name(request.getName())
                .expectedCount(request.getExpectedCount())
                .inviteToken(UUID.randomUUID().toString())
                .resultToken(UUID.randomUUID().toString())
                .build());

        request.getCandidateSlots().forEach(s -> candidateSlotRepository.save(CandidateSlot.builder()
                .meeting(meeting)
                .startDate(s.getStartDate())
                .endDate(s.getEndDate())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .build()));
                
        return new MeetingCreateResponse(meeting, FRONT_BASE_URL);
    }

    // 초대 토큰으로 모임 + 후보 슬롯 조회 (읽기 전용 트랜잭션)
    @Transactional(readOnly = true)
    public MeetingDetailResponse findByInviteToken(String inviteToken) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        return new MeetingDetailResponse(meeting, candidateSlotRepository.findByMeeting(meeting));
    }

    // 결과 토큰으로 조회 (토직은 위와 동일, 토큰 종류만 다름)
    @Transactional(readOnly = true)
    public MeetingDetailResponse findByResultToken(String resultToken) {
        Meeting meeting = meetingRepository.findByResultToken(resultToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        return new MeetingDetailResponse(meeting, candidateSlotRepository.findByMeeting(meeting));
    }

    public MeetingDetailResponse confirm(Long meetingId, Long userId, Long confirmedSlotId) { // confirmedSlotId는 주최자가 확정으로 누른 후보 시간. 
        Meeting meeting = findAndCheckOwner(meetingId, userId); // 존재 + 주최자 확인
        if (meeting.getStatus() == MeetingStatus.CONFIRMED) {
                throw new CustomException(ErrorCode.MEETING_ALREADY_CONFIRMED);
        }
        CandidateSlot slot = candidateSlotRepository.findById(confirmedSlotId)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_SLOT));
        meeting.confirm(slot);
        return new MeetingDetailResponse(meeting, candidateSlotRepository.findByMeeting(meeting)); // 확정 결과 반환
    }

    // 모임 만료 - 주최자만 가능, 확정된 모임은 만료 불가
    public void expire(Long meetingId, Long userId) {
        Meeting meeting = findAndCheckOwner(meetingId, userId);
        if (meeting.getStatus() == MeetingStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.MEETING_ALREADY_CONFIRMED);
        }
        meeting.expire();
    }

    // 모임 삭제 - 주최자만 가능, 물리 삭제 대신 Soft Delete
    public void cancel(Long meetingId, Long userId) {
        findAndCheckOwner(meetingId, userId).delete(); // deleted_at만 기록 -> 조회에서 사라짐
    }

    // 모임이 존재하고, 요청자가 주최자인지 검사하는 공통 헬퍼
    private Meeting findAndCheckOwner(Long meetingId, Long userId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        if (!meeting.getOwner().getId().equals(userId)) {
                throw new CustomException(ErrorCode.FORBIDDEN); // 주최자가 아니면 403
        }
        return meeting;
    }
}