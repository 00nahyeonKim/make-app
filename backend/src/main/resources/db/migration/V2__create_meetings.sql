-- confirmed_slot_id FK는 CANDIDATE_SLOTS 생성 후 V6에서 추가 (순환 FK 처리)
CREATE TABLE meetings (
    id                  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id            NUMBER(19,0)  NOT NULL,
    name                VARCHAR2(50)  NOT NULL,
    expected_count      NUMBER(3,0),
    invite_token        VARCHAR2(36)  NOT NULL,
    result_token        VARCHAR2(36)  NOT NULL,
    status              VARCHAR2(20)  NOT NULL,
    confirmed_slot_id   NUMBER(19,0),
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at          TIMESTAMP,
    CONSTRAINT fk_meeting_owner  FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT uq_meeting_invite UNIQUE (invite_token),
    CONSTRAINT uq_meeting_result UNIQUE (result_token)
);
