package com.makeapp.backend.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.entity.Availability;
import com.makeapp.backend.entity.AvailabilityStatus;
import com.makeapp.backend.entity.AvailabilityTimeRange;
import com.makeapp.backend.entity.CandidateSlot;
import com.makeapp.backend.entity.Meeting;
import com.makeapp.backend.entity.Participant;
import com.makeapp.backend.exception.CustomException;
import com.makeapp.backend.exception.ErrorCode;
import com.makeapp.backend.repository.AvailabilityRepository;
import com.makeapp.backend.repository.CandidateSlotRepository;
import com.makeapp.backend.repository.MeetingRepository;
import com.makeapp.backend.repository.ParticipantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResultService {

    private final MeetingRepository meetingRepository;
    private final CandidateSlotRepository candidateSlotRepository;
    private final AvailabilityRepository availabilityRepository;
    private final ParticipantRepository participantRepository;

    public Map<String, Object> getResults(String inviteToken, String sort) {
        Meeting meeting = meetingRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.MEETING_NOT_FOUND));

        List<Participant> participants = participantRepository.findByMeeting(meeting);
        int total = participants.size();
        long submitted = participants.stream().filter(Participant::isSubmitted).count();
        List<CandidateSlot> slots = candidateSlotRepository.findByMeeting(meeting);

        List<Map<String, Object>> slotResults = slots.stream().map(slot -> {
            List<Availability> availabilities = availabilityRepository.findByCandidateSlot(slot);
            long available = availabilities.stream()
                    .filter(a -> a.getStatus() == AvailabilityStatus.AVAILABLE)
                    .count();
            long unavailable = availabilities.stream()
                    .filter(a -> a.getStatus() == AvailabilityStatus.UNAVAILABLE)
                    .count();
            int duration = toEndMinute(slot.getEndTime()) - toStartMinute(slot.getStartTime());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", slot.getId());
            result.put("startDate", slot.getStartDate().toString());
            result.put("endDate", slot.getEndDate().toString());
            result.put("startTime", slot.getStartTime().toString());
            result.put("endTime", slot.getEndTime().toString());
            result.put("availableCount", (int) available);
            result.put("unavailableCount", (int) unavailable);
            result.put("recommendationLabel", total + "명 중 " + available + "명 가능");
            result.put("durationMinutes", duration);
            result.put("timeBlocks", timeBlocks(slot, availabilities));
            return result;
        }).toList();

        List<Map<String, Object>> sorted = sortSlots(slotResults, sort);

        for (int i = 0; i < sorted.size(); i++) {
            sorted.get(i).put("isTopRecommendation", i < 3);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("meetingId", meeting.getId());
        response.put("meetingName", meeting.getName());
        response.put("status", meeting.getStatus().name());
        response.put("totalParticipants", total);
        response.put("submittedParticipants", (int) submitted);
        response.put("confirmedSlot", meeting.getConfirmedSlot() != null
                ? confirmedSlotInfo(meeting.getConfirmedSlot()) : null);
        response.put("slots", sorted);
        return response;
    }

    private List<Map<String, Object>> sortSlots(List<Map<String, Object>> slots, String sort) {
        Comparator<Map<String, Object>> byAvailable =
                Comparator.<Map<String, Object>, Integer>comparing(r -> (int) r.get("availableCount")).reversed();
        Comparator<Map<String, Object>> byDuration =
                Comparator.<Map<String, Object>, Integer>comparing(r -> (int) r.get("durationMinutes")).reversed();
        Comparator<Map<String, Object>> byDate =
                Comparator.comparing(r -> (String) r.get("startDate"));

        Comparator<Map<String, Object>> comparator = switch (sort != null ? sort : "recommend") {
            case "date" -> byDate.thenComparing(byAvailable).thenComparing(byDuration);
            case "duration" -> byDuration.thenComparing(byAvailable).thenComparing(byDate);
            default -> byAvailable.thenComparing(byDuration).thenComparing(byDate);
        };
        return slots.stream().sorted(comparator).toList();
    }

    private List<Map<String, Object>> timeBlocks(CandidateSlot slot, List<Availability> availabilities) {
        List<Availability> availableResponses = availabilities.stream()
                .filter(a -> a.getStatus() == AvailabilityStatus.AVAILABLE)
                .toList();

        List<Map<String, Object>> blocks = new ArrayList<>();
        int slotStart = toStartMinute(slot.getStartTime());
        int slotEnd = toEndMinute(slot.getEndTime());

        if (slotEnd <= slotStart) {
            return blocks;
        }

        for (int current = slotStart; current < slotEnd; current += 30) {
            int blockEnd = Math.min(current + 30, slotEnd);
            int blockStartMinute = current;
            int blockEndMinute = blockEnd;

            long availableCount = availableResponses.stream()
                    .filter(a -> coversBlock(a.getTimeRanges(), blockStartMinute, blockEndMinute))
                    .count();

            Map<String, Object> block = new LinkedHashMap<>();
            block.put("startTime", toTimeText(blockStartMinute));
            block.put("endTime", toTimeText(blockEndMinute));
            block.put("availableCount", (int) availableCount);
            blocks.add(block);
        }

        return blocks;
    }

    private boolean coversBlock(List<AvailabilityTimeRange> ranges, int blockStart, int blockEnd) {
        return ranges.stream().anyMatch(range -> {
            int rangeStart = toStartMinute(range.getStartTime());
            int rangeEnd = toEndMinute(range.getEndTime());

            return rangeStart <= blockStart && blockEnd <= rangeEnd;
        });
    }

    private Map<String, Object> confirmedSlotInfo(CandidateSlot slot) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", slot.getId());
        response.put("startDate", slot.getStartDate().toString());
        response.put("endDate", slot.getEndDate().toString());
        response.put("startTime", slot.getStartTime().toString());
        response.put("endTime", slot.getEndTime().toString());
        return response;
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

    private String toTimeText(int minute) {
        if (minute == 1440) {
            return "24:00";
        }

        int hour = minute / 60;
        int min = minute % 60;
        return String.format("%02d:%02d", hour, min);
    }
}
