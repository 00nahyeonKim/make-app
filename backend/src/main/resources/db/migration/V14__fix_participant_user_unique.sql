ALTER TABLE participants DROP CONSTRAINT uq_participant_user;

CREATE UNIQUE INDEX uq_participant_user ON participants (
    CASE WHEN user_id IS NOT NULL THEN meeting_id END,
    CASE WHEN user_id IS NOT NULL THEN user_id END
);
