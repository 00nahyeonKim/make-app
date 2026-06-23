UPDATE meetings SET expected_count = 99 WHERE expected_count > 99;
COMMIT;
ALTER TABLE meetings MODIFY name VARCHAR2(10 CHAR);
ALTER TABLE meetings ADD CONSTRAINT chk_meeting_expected_count CHECK (expected_count <= 99);