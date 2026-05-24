CREATE TABLE users (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kakao_id    VARCHAR2(50)  NOT NULL,
    name        VARCHAR2(50)  NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at  TIMESTAMP,
    CONSTRAINT uq_users_kakao_id UNIQUE (kakao_id)
);
