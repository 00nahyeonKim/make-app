package com.makeapp.backend.service;

import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.dto.request.AvailabilitySubmitRequest;
import com.makeapp.backend.entity.Availability;
import com.makeapp.backend.entity.AvailabilityStatus;
import com.makeapp.backend.entity.CandidateSlot;
import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.Participant;
import com.makeapp.backend.entity.User;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.AvailabilityRepository;
import com.makeapp.backend.repository.CandidateSlotRepository;
import com.makeapp.backend.repository.MeetingRepository;
import com.makeapp.backend.repository.ParticipantRepository;
import com.makeapp.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // final 필드들의 생성자를 자동 생성
@Transactional
public class AvailabilityService {

    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;
    private final CandidateSlotRepository candidateSlotRepository;
    private final AvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    public Map<String, Integer> upsert(String inviteToken, AvailabilitySubmitRequest request, Authentication auth) {
        Participant participant = resolveParticipant(inviteToken, auth);
        int count = 0;
        for (var item : request.getAvailabilities()) {
            CandidateSlot slot = candidateSlotRepository.findById(item.getCandidateSlotId())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_SLOT));
            AvailabilityStatus status = AvailabilityStatus.valueOf(item.getStatus());

            LocalTime startTime = item.getStartTime();
            LocalTime endTime = item.getEndTime();

            // AVAILABLE이고 부분 시간이 주어진 경우, 슬롯 범위 안에 있는지 검증
            if (status == AvailabilityStatus.AVAILABLE && (startTime != null || endTime != null)) {
                if (startTime == null || endTime == null
                        || !startTime.isBefore(endTime)
                        || startTime.isBefore(slot.getStartTime())
                        || endTime.isAfter(slot.getEndTime())) {
                    throw new CustomException(ErrorCode.INVALID_SLOT);
                }
            }

            Availability avail = availabilityRepository
                    .findByParticipantAndCandidateSlot(participant, slot)
                    .orElseGet(() -> Availability.builder()
                            .participant(participant)
                            .candidateSlot(slot)
                            .status(status)
                            .participantStartTime(startTime)
                            .participantEndTime(endTime)
                            .build());
            avail.update(status, startTime, endTime);
            availabilityRepository.save(avail);
            count++;
        }
        return Map.of("updatedCount", count);
    }

    public Map<String, String> submit(String inviteToken, Authentication auth) {
        Participant participant = resolveParticipant(inviteToken, auth);
        participant.submit();
        return Map.of("submittedAt", participant.getSubmittedAt().toString());
    }

    // 슬롯별 현황 조회: 각 후보 시간마다 가능/불가능 참가자 목록을 만든다 ({ slots: [...] }로 감싸 반환)
    @Transactional(readOnly = true)
    public Map<String, Object> getAvailabilities(String inviteToken) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        List<Map<String, Object>> slots = candidateSlotRepository.findByMeeting(meeting).stream().map(slot -> {
            List<Availability> avails = availabilityRepository.findByCandidateSlot(slot);
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id", slot.getId());
            r.put("startDate", slot.getStartDate().toString());
            r.put("endDate", slot.getEndDate().toString());
            r.put("startTime", slot.getStartTime().toString());
            r.put("endTime", slot.getEndTime().toString());
            r.put("availableParticipants", participantsOf(avails, AvailabilityStatus.AVAILABLE));
            r.put("unavailableParticipants", participantsOf(avails, AvailabilityStatus.UNAVAILABLE));
            return r;
        }).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("slots", slots);
        return response;
    }

    private List<Map<String, Object>> participantsOf(List<Availability> avails, AvailabilityStatus targetStatus) {
        return avails.stream()
                .filter(a -> a.getStatus() == targetStatus)
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", a.getParticipant().getId());
                    m.put("displayName", a.getParticipant().getDisplayName());
                    if (a.getParticipantStartTime() != null) m.put("startTime", a.getParticipantStartTime().toString());
                    if (a.getParticipantEndTime() != null) m.put("endTime", a.getParticipantEndTime().toString());
                    return m;
                })
                .toList();
    }

    private Participant resolveParticipant(String inviteToken, Authentication auth) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        if (auth == null) throw new CustomException(ErrorCode.UNAUTHORIZED);

        boolean isGuest = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_GUEST"));

        if (isGuest) {
            Long participantId = (Long) auth.getPrincipal();
            return participantRepository.findById(participantId)
                    .filter(p -> p.getMeeting().getId().equals(meeting.getId()))
                    .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPANT_NOT_FOUND));
        }

        Long userId = (Long) auth.getPrincipal();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));
        return participantRepository.findByMeetingAndUser(meeting, user)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPANT_NOT_FOUND));
    }
}
