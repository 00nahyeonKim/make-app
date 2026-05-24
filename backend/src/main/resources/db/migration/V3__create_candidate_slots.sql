CREATE TABLE candidate_slots (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meeting_id  NUMBER(19,0)  NOT NULL,
    slot_date   DATE          NOT NULL,
    start_time  TIMESTAMP     NOT NULL,
    end_time    TIMESTAMP     NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at  TIMESTAMP,
    CONSTRAINT fk_slot_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    CONSTRAINT uq_slot UNIQUE (meeting_id, slot_date, start_time)
);
