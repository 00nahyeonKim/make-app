-- V2__add_participants_table.sql
CREATE TABLE participants (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    meeting_id      NUMBER NOT NULL,
    user_id         NUMBER,
    guest_token     VARCHAR2(36),
    display_name    VARCHAR2(50) NOT NULL,
    type            VARCHAR2(20) NOT NULL,
    submitted_at    TIMESTAMP,
    CONSTRAINT fk_participant_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);