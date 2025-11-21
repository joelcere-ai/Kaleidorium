-- DIAGNOSE: Why is id still NULL when inserting artists?
-- This script checks for defaults, triggers, and constraints

-- Step 1: Check if id column has a default value
SELECT 
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Artists'
AND column_name = 'id';

-- Step 2: Check for triggers on Artists table that might set id
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'Artists';

-- Step 3: Check foreign key constraints on id
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name = 'Artists'
AND kcu.column_name = 'id';

-- Step 4: Check primary key constraint
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema = 'public'
AND tc.table_name = 'Artists'
AND kcu.column_name = 'id';

