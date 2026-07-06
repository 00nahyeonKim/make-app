CREATE SEQUENCE SEQ_AVAILABILITY_TIME_RANGES START WITH 1 INCREMENT BY 50;

CREATE TABLE availability_time_ranges (
    id              NUMBER(19,0) DEFAULT SEQ_AVAILABILITY_TIME_RANGES.NEXTVAL NOT NULL PRIMARY KEY,
    availability_id NUMBER(19,0) NOT NULL,
    start_time      TIMESTAMP    NOT NULL,
    end_time        TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at      TIMESTAMP,
    CONSTRAINT fk_avail_range_availability
        FOREIGN KEY (availability_id) REFERENCES availabilities(id)
);

CREATE INDEX idx_avail_range_availability
    ON availability_time_ranges(availability_id);