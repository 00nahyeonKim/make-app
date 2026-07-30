ALTER TABLE users RENAME COLUMN name TO kakao_nickname;

ALTER TABLE users ADD nickname VARCHAR2(50);