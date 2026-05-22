-- db/init/01-create-user.sql
-- gvenzl 이미지의 APP_USER 환경변수가 이미 처리해주므로 보통 비워둬도 됨
-- 추가 권한이 필요하면 여기에:
ALTER SESSION SET CONTAINER = XEPDB1;
GRANT CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO makeapp;