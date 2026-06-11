package com.makeapp.backend.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.dto.request.MeetingCreateRequest;
import com.makeapp.backend.dto.response.MeetingCreateResponse;
import com.makeapp.backend.dto.response.MeetingDetailResponse;
import com.makeapp.backend.entity.CandidateSlot;
import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.User;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.CandidateSlotRepository;
import com.makeapp.backend.repository.MeetingRepository;
import com.makeapp.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
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
                .slotDate(s.getSlotDate())
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
}