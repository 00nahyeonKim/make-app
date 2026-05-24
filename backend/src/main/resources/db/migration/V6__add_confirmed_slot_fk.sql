ALTER TABLE meetings
    ADD CONSTRAINT fk_confirmed_slot
    FOREIGN KEY (confirmed_slot_id) REFERENCES candidate_slots(id);
