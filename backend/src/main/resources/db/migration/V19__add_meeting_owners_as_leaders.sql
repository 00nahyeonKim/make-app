-- 정원과 통계가 방장을 포함하도록 기존 모임에도 LEADER 참가자를 보강한다.
-- 이미 해당 모임에 참가자로 등록된 방장은 중복 생성하지 않는다.
INSERT INTO participants (meeting_id, user_id, display_name, type)
SELECT m.id, m.owner_id, u.name, 'LEADER'
FROM meetings m
JOIN users u ON u.id = m.owner_id
WHERE m.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM participants p
      WHERE p.meeting_id = m.id
        AND p.user_id = m.owner_id
        AND p.deleted_at IS NULL
  );
