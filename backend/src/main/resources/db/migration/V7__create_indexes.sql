CREATE INDEX idx_meetings_owner       ON meetings(owner_id);
CREATE INDEX idx_slots_meeting        ON candidate_slots(meeting_id);
CREATE INDEX idx_participants_meeting ON participants(meeting_id);
CREATE INDEX idx_avail_slot           ON availabilities(candidate_slot_id);
