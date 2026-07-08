package com.makeapp.backend.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.dto.request.AvailabilitySubmitRequest;
import com.makeapp.backend.entity.Availability;
import com.makeapp.backend.entity.AvailabilityStatus;
import com.makeapp.backend.entity.AvailabilityTimeRange;
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
@RequiredArgsConstructor
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
            if (!slot.getMeeting().getId().equals(participant.getMeeting().getId())) {
                throw new CustomException(ErrorCode.INVALID_SLOT);
            }

            AvailabilityStatus status = AvailabilityStatus.valueOf(item.getStatus());
            Availability availability = availabilityRepository
                    .findByParticipantAndCandidateSlot(participant, slot)
                    .orElseGet(() -> Availability.builder()
                            .participant(participant)
                            .candidateSlot(slot)
                            .status(status)
                            .build());

            availability.updateStatus(status);
            availability.replaceTimeRanges(buildRanges(availability, slot, status, item));
            availabilityRepository.save(availability);
            count++;
        }

        return Map.of("updatedCount", count);
    }

    public Map<String, String> submit(String inviteToken, Authentication auth) {
        Participant participant = resolveParticipant(inviteToken, auth);
        participant.submit();
        return Map.of("submittedAt", participant.getSubmittedAt().toString());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAvailabilities(String inviteToken) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));
        List<Map<String, Object>> slots = candidateSlotRepository.findByMeeting(meeting).stream().map(slot -> {
            List<Availability> availabilities = availabilityRepository.findByCandidateSlot(slot);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", slot.getId());
            response.put("startDate", slot.getStartDate().toString());
            response.put("endDate", slot.getEndDate().toString());
            response.put("startTime", slot.getStartTime().toString());
            response.put("endTime", slot.getEndTime().toString());
            response.put("availableParticipants", participantsOf(availabilities, AvailabilityStatus.AVAILABLE));
            response.put("unavailableParticipants", participantsOf(availabilities, AvailabilityStatus.UNAVAILABLE));
            return response;
        }).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("slots", slots);
        return response;
    }

    private List<AvailabilityTimeRange> buildRanges(
            Availability availability,
            CandidateSlot slot,
            AvailabilityStatus status,
            AvailabilitySubmitRequest.AvailabilityItem item
    ) {
        List<AvailabilityTimeRange> ranges = new ArrayList<>();
        if (status == AvailabilityStatus.UNAVAILABLE) {
            return ranges;
        }

        if (item.getTimeRanges() == null || item.getTimeRanges().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_SLOT);
        }

        validateNoOverlap(item.getTimeRanges());
        for (var range : item.getTimeRanges()) {
            LocalTime startTime = range.getStartTime();
            LocalTime endTime = range.getEndTime();
            validateRange(slot, startTime, endTime);

            ranges.add(AvailabilityTimeRange.builder()
                    .availability(availability)
                    .startTime(startTime)
                    .endTime(endTime)
                    .build());
        }
        return ranges;
    }

    private List<Map<String, Object>> participantsOf(List<Availability> availabilities, AvailabilityStatus targetStatus) {
        return availabilities.stream()
                .filter(a -> a.getStatus() == targetStatus)
                .map(a -> {
                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("id", a.getParticipant().getId());
                    response.put("displayName", a.getParticipant().getDisplayName());
                    response.put("timeRanges", timeRangeResponse(a.getTimeRanges()));
                    return response;
                })
                .toList();
    }

    private List<Map<String, Object>> timeRangeResponse(List<AvailabilityTimeRange> ranges) {
        return ranges.stream()
                .map(range -> {
                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("startTime", range.getStartTime().toString());
                    response.put("endTime", range.getEndTime().toString());
                    return response;
                })
                .toList();
    }

    private void validateRange(CandidateSlot slot, LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            throw new CustomException(ErrorCode.INVALID_SLOT);
        }

        if (!isThirtyMinuteStart(startTime) || !isThirtyMinuteEnd(endTime)) {
            throw new CustomException(ErrorCode.INVALID_SLOT);
        }

        int slotStart = toStartMinute(slot.getStartTime());
        int slotEnd = toEndMinute(slot.getEndTime());
        int rangeStart = toStartMinute(startTime);
        int rangeEnd = toEndMinute(endTime);

        if (rangeStart >= rangeEnd
                || rangeStart < slotStart
                || rangeEnd > slotEnd) {
            throw new CustomException(ErrorCode.INVALID_SLOT);
        }
    }

    private void validateNoOverlap(List<AvailabilitySubmitRequest.TimeRangeItem> ranges) {
        List<AvailabilitySubmitRequest.TimeRangeItem> sorted = ranges.stream()
                .sorted(Comparator.comparingInt(r -> toStartMinute(r.getStartTime())))
                .toList();

        for (int i = 1; i < sorted.size(); i++) {
            int previousEnd = toEndMinute(sorted.get(i - 1).getEndTime());
            int currentStart = toStartMinute(sorted.get(i).getStartTime());

            if (currentStart < previousEnd) {
                throw new CustomException(ErrorCode.INVALID_SLOT);
            }
        }
    }

    private int toStartMinute(LocalTime time) {
        return time.toSecondOfDay() / 60;
    }

    private int toEndMinute(LocalTime time) {
        if (isEndOfDay(time)) {
            return 1440;
        }
        return time.toSecondOfDay() / 60;
    }

    private boolean isEndOfDay(LocalTime time) {
        return time.equals(LocalTime.of(23, 59))
                || time.equals(LocalTime.of(23, 59, 59));
    }

    private boolean isThirtyMinuteStart(LocalTime time) {
        return time.getSecond() == 0
                && time.getNano() == 0
                && (time.getMinute() == 0 || time.getMinute() == 30);
    }

    private boolean isThirtyMinuteEnd(LocalTime time) {
        return isEndOfDay(time) || isThirtyMinuteStart(time);
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
