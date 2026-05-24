CREATE TABLE availabilities (
    id                  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participant_id      NUMBER(19,0)  NOT NULL,
    candidate_slot_id   NUMBER(19,0)  NOT NULL,
    status              VARCHAR2(20)  NOT NULL,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_avail_participant FOREIGN KEY (participant_id)    REFERENCES participants(id),
    CONSTRAINT fk_avail_slot        FOREIGN KEY (candidate_slot_id) REFERENCES candidate_slots(id),
    CONSTRAINT uq_avail             UNIQUE (participant_id, candidate_slot_id)
);
