package com.makeapp.backend.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
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
@RequiredArgsConstructor // final 필드들의 생성자를 자동 생성
@Transactional
public class ParticipantService {

    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final AvailabilityRepository availabilityRepository;    // 본인 응답(availabilities) 조회용

    public ParticipantResponse join(String inviteToken, Long userId, String customDisplayName) {
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

        String displayName = (customDisplayName != null && !customDisplayName.isBlank())
                ? customDisplayName
                : user.getName();

        if (participantRepository.findByMeetingAndDisplayName(meeting, displayName).isPresent()) {
                throw new CustomException(ErrorCode.DISPLAY_NAME_TAKEN); // 이때 오류가 나면 프론트가 별도 모달창 표시
        }

        boolean isOwner = meeting.getOwner().getId().equals(userId);    // 주최자가 직접 참가하는 경우
        Participant p = participantRepository.save(Participant.builder()
                .meeting(meeting)
                .user(user)
                .displayName(displayName) // 이름 중복 시 "(n)" 처리 해주는 메서드(resolveDisplayName) 호출
                .type(isOwner ? ParticipantType.LEADER : ParticipantType.MEMBER) // 주최자=LEADER, 그 외=MEMBER
                .build());
        return ParticipantResponse.of(p);
    }

    // 모임의 참가자 전체 목록 조회 (참가자 배열 + 집계: 총원/제출완료 수)
    @Transactional(readOnly = true)
    public Map<String, Object> findAll(String inviteToken) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        // ParticipantResponse::of는 p -> ParticipantResponse.of(p)와 같은 의미(메서드 참조).
        List<ParticipantResponse> participants = participantRepository.findByMeeting(meeting).stream().map(ParticipantResponse::of).toList(); // map()은 Stream의 기능이라, map()을 쓰려면 먼저 stream()으로 스트림을 만들어야 함
        Long submittedCount = participants.stream().filter(ParticipantResponse::isSubmitted).count(); // filter()와 count()도 Stram의 기능이라, 리스트가 된 participants를 가공하려면 새로 stream()으로 펼쳐야 함

        Map<String, Object> response = new LinkedHashMap<>();   // 키 순서 유지
        response.put("participants", participants);
        response.put("totalCount", participants.size()); // 이 모임의 총 참가자 수를 응답하기 위한 값
        response.put("submittedCount", submittedCount);
        
        return response;
    }

    // 내 참가 정보 조회 - 본인 정보 + 본인이 낸 가용 응답까지 반환 (재접속 시 복원용)
    @Transactional(readOnly = true)
    public Map<String, Object> findMe(String inviteToken, Authentication auth) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        if (auth == null) throw new CustomException(ErrorCode.UNAUTHORIZED);

        // 권한 목록에 ROLE_GUEST가 있으면 게스트 토큰
        boolean isGuest = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_GUEST"));

        Participant me;
        if (isGuest) {
            Long participantId = (Long) auth.getPrincipal(); // 게스트는 principal이 participantId
            me = participantRepository.findById(participantId)
                    .filter(p -> p.getMeeting().getId().equals(meeting.getId())) // 이 모임 소속인지 확인
                    .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPANT_NOT_FOUND));
        } else {
            Long userId = (Long) auth.getPrincipal(); // 회원은 principal이 userId
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));
            me = participantRepository.findByMeetingAndUser(meeting, user)
                    .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPANT_NOT_FOUND));
        }

        // 본인이 낸 슬롯별 가용 응답 (재접속 시 화면 복원용)
        List<Map<String, Object>> availabilities = availabilityRepository.findByParticipant(me).stream()
                .map(a -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("candidateSlotId", a.getCandidateSlot().getId());
                    item.put("status", a.getStatus().name());
                    return item;
                }).toList();

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("id", me.getId());
                response.put("displayName", me.getDisplayName());
                response.put("type", me.getType().name());
                response.put("submittedAt", me.getSubmittedAt());
                response.put("availabilities", availabilities);
                return response;
    }

}
