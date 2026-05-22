-- V1__init_schema.sql
CREATE TABLE users (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kakao_id    VARCHAR2(50) NOT NULL UNIQUE,
    name        VARCHAR2(50) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meetings (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id        NUMBER NOT NULL,
    name            VARCHAR2(50) NOT NULL,
    invite_token    VARCHAR2(36) NOT NULL UNIQUE,
    result_token    VARCHAR2(36) NOT NULL UNIQUE,
    status          VARCHAR2(20) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_meeting_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);