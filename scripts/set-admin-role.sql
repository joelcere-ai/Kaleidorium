-- Script to set admin role for joel.cere@blockmeister.com

-- 1. Update the auth user metadata to include admin role
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'joel.cere@blockmeister.com';

-- 2. Update the role in the Collectors table
UPDATE public."Collectors"
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'joel.cere@blockmeister.com'
);

-- 3. Verify the changes
SELECT 
  u.email,
  u.raw_user_meta_data,
  c.role as collector_role,
  c.is_temporary
FROM auth.users u
LEFT JOIN public."Collectors" c ON u.id = c.id
WHERE u.email = 'joel.cere@blockmeister.com'; 