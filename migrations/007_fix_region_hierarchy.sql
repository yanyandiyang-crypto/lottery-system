-- Migration: Fix Region Hierarchy
-- Description: Propagate regionId from area coordinators to coordinators and agents
-- Date: 2025-10-08

BEGIN;

-- Step 1: Update coordinators to inherit regionId from their area coordinator
UPDATE users AS coord
SET region_id = ac.region_id
FROM users AS ac
WHERE coord.role = 'coordinator'
  AND coord.coordinator_id = ac.id
  AND ac.role = 'area_coordinator'
  AND ac.region_id IS NOT NULL
  AND (coord.region_id IS NULL OR coord.region_id != ac.region_id);

-- Step 2: Update agents to inherit regionId from their coordinator
UPDATE users AS agent
SET region_id = coord.region_id
FROM users AS coord
WHERE agent.role = 'agent'
  AND agent.coordinator_id = coord.id
  AND coord.role = 'coordinator'
  AND coord.region_id IS NOT NULL
  AND (agent.region_id IS NULL OR agent.region_id != coord.region_id);

-- Step 3: Alternative path - agents directly under area coordinators
UPDATE users AS agent
SET region_id = ac.region_id
FROM users AS ac
WHERE agent.role = 'agent'
  AND agent.coordinator_id = ac.id
  AND ac.role = 'area_coordinator'
  AND ac.region_id IS NOT NULL
  AND (agent.region_id IS NULL OR agent.region_id != ac.region_id);

COMMIT;

-- Verify the changes
SELECT 
  'Coordinators with region_id' AS description,
  COUNT(*) AS count
FROM users
WHERE role = 'coordinator' AND region_id IS NOT NULL

UNION ALL

SELECT 
  'Agents with region_id' AS description,
  COUNT(*) AS count
FROM users
WHERE role = 'agent' AND region_id IS NOT NULL

UNION ALL

SELECT 
  'Coordinators WITHOUT region_id' AS description,
  COUNT(*) AS count
FROM users
WHERE role = 'coordinator' AND region_id IS NULL

UNION ALL

SELECT 
  'Agents WITHOUT region_id' AS description,
  COUNT(*) AS count
FROM users
WHERE role = 'agent' AND region_id IS NULL;


