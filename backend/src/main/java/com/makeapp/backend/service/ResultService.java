package com.makeapp.backend.service;

import java.time.Duration;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.makeapp.backend.entity.Availability;
import com.makeapp.backend.entity.AvailabilityStatus;
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

        // 슬롯마다 가능/불가능 인원, 소요시간 등을 계산해 Map으로 만듦
        List<Map<String, Object>> slotResults = slots.stream().map(slot -> {
            List<Availability> avails = availabilityRepository.findByCandidateSlot(slot);
            long available = avails.stream()
                    .filter(a -> a.getStatus() == AvailabilityStatus.AVAILABLE).count();
            long unavailable = avails.stream()
                    .filter(a -> a.getStatus() == AvailabilityStatus.UNAVAILABLE).count();
            int duration = (int) Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes();

            Map<String, Object> r = new LinkedHashMap<>(); // LinkedHashMap: 삽입 순서 보장
            r.put("id", slot.getId());
            r.put("startDate", slot.getStartDate().toString());
            r.put("endDate", slot.getEndDate().toString());
            r.put("startTime", slot.getStartTime().toString());
            r.put("endTime", slot.getEndTime().toString());
            r.put("availableCount", (int) available);
            r.put("unavailableCount", (int) unavailable);
            r.put("recommendationLabel", total + "명 중 " + available + "명 가능");
            r.put("durationMinutes", duration);
            return r;
        }).toList();

        List<Map<String, Object>> sorted = sortSlots(slotResults, sort);

        // 정렬 후 상위 3개 슬롯을 추천으로 표시
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

    // 정렬 기준(sort 값)에 따라 슬롯 목록을 다단계 정렬
    private List<Map<String, Object>> sortSlots(List<Map<String, Object>> slots, String sort) {
        Comparator<Map<String, Object>> byAvailable =
                Comparator.<Map<String, Object>, Integer>comparing(r -> (int) r.get("availableCount")).reversed();
        Comparator<Map<String, Object>> byDuration =
                Comparator.<Map<String, Object>, Integer>comparing(r -> (int) r.get("durationMinutes")).reversed();
        Comparator<Map<String, Object>> byDate =
                Comparator.comparing(r -> (String) r.get("startDate"));

        Comparator<Map<String, Object>> cmp = switch (sort != null ? sort : "recommend") {
            // 빠른 날짜 → 참여 인원 많은 순 → 만남 시간 긴 순
            case "date"     -> byDate.thenComparing(byAvailable).thenComparing(byDuration);
            // 만남 시간 긴 순 → 참여 인원 많은 순 → 빠른 날짜 순
            case "duration" -> byDuration.thenComparing(byAvailable).thenComparing(byDate);
            // 참여 인원 많은 순 → 만남 시간 긴 순 → 빠른 날짜 순
            default         -> byAvailable.thenComparing(byDuration).thenComparing(byDate);
        };
        return slots.stream().sorted(cmp).toList();
    }

    // 확정 슬롯을 { id, startDate, endDate, startTime, endTime } 객체로 변환 (미확정이면 호출 안 함)
    private Map<String, Object> confirmedSlotInfo(CandidateSlot slot) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", slot.getId());
        m.put("startDate", slot.getStartDate().toString());
        m.put("endDate", slot.getEndDate().toString());
        m.put("startTime", slot.getStartTime().toString());
        m.put("endTime", slot.getEndTime().toString());
        return m;
    }
}
