CREATE TABLE participants (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meeting_id    NUMBER(19,0)  NOT NULL,
    user_id       NUMBER(19,0),
    guest_token   VARCHAR2(64),
    display_name  VARCHAR2(50)  NOT NULL,
    type          VARCHAR2(20)  NOT NULL,
    submitted_at  TIMESTAMP,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at    TIMESTAMP,
    CONSTRAINT fk_participant_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    CONSTRAINT fk_participant_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT chk_participant_identity CHECK (
        (user_id IS NOT NULL AND guest_token IS NULL)
        OR (user_id IS NULL  AND guest_token IS NOT NULL)
    ),
    CONSTRAINT uq_participant_user  UNIQUE (meeting_id, user_id),
    CONSTRAINT uq_participant_guest UNIQUE (meeting_id, guest_token)
);
