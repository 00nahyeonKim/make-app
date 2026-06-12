package com.makeapp.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.dto.response.ParticipantResponse;
import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.MeetingStatus;
import com.makeapp.backend.entity.Participant;
import com.makeapp.backend.entity.ParticipantType;
import com.makeapp.backend.entity.User;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.AvailabilityRepository;
import com.makeapp.backend.repository.MeetingRepository;
import com.makeapp.backend.repository.ParticipantRepository;
import com.makeapp.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ParticipantService {

    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final AvailabilityRepository availabilityRepository;    // 본인 응답(availabilities) 조회용

    public ParticipantResponse join(String inviteToken, Long userId) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));

        if (meeting.getStatus() == MeetingStatus.EXPIRED) {
            throw new CustomException(ErrorCode.MEETING_EXPIRED); // 만료된 모임엔 참가 불가
        }

        if (userId == null) throw new CustomException(ErrorCode.UNAUTHORIZED); // 로그인 안 했으면 거부

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));
        if (participantRepository.existsByMeetingAndUser(meeting, user)) {
            throw new CustomException(ErrorCode.DUPLICATE_PARTICIPATION); // 이미 참가했으면 중복 차단
        }

        boolean isOwner = meeting.getOwner().getId().equals(userId);    // 주최자가 직접 참가하는 경우
        Participant p = participantRepository.save(Participant.builder()
                .meeting(meeting)
                .user(user)
                .displayName(resolveDisplayName(meeting, user.getName())) // 이름 중복 시 "(n)" 처리 해주는 메서드(resolveDisplayName) 호출
                .type(isOwner ? ParticipantType.LEADER : ParticipantType.MEMBER) // 주최자=LEADER, 그 외=MEMBER
                .build());
        return ParticipantResponse.of(p);
    }

    // 같은 모임 내 이름 중복 방지 ("철수" → "철수 (2)")  ※ 게스트 등록의 같은 로직과 동일
    private String resolveDisplayName(Meeting meeting, String baseName) {
        long count = participantRepository.findByMeeting(meeting).stream() // findByMeeting(meeting) → 이 모임의 참가자 전체를 리스트로 가져옴.
                .filter(p -> p.getDisplayName().equals(baseName) // 여기서 p -> ...는 "각 참가자 p에 대해"라는 뜻의 람다
                        || p.getDisplayName().startsWith(baseName + " ("))
                .count();
        return count == 0 ? baseName : baseName + " (" + (count + 1) + ")";
    }
}
