-- Create a function to manage storage policies
CREATE OR REPLACE FUNCTION create_storage_policy(
  bucket_name text,
  policy_name text,
  definition text
) RETURNS void AS $$
BEGIN
  -- Create policy for the storage.objects table
  EXECUTE format(
    'CREATE POLICY %I ON storage.objects FOR ALL USING %s',
    policy_name,
    definition
  );
EXCEPTION
  -- If policy already exists, update it
  WHEN duplicate_object THEN
    EXECUTE format(
      'ALTER POLICY %I ON storage.objects USING %s',
      policy_name,
      definition
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_storage_policy TO authenticated;

-- Create default policies for profile pictures bucket
SELECT create_storage_policy(
  'profile-pictures',
  'authenticated_user_access',
  '(auth.role() = ''authenticated'' AND (
    -- Allow users to upload and manage their own profile pictures
    (auth.uid() = owner AND (bucket_id = ''profile-pictures'')) OR
    -- Allow anyone to view profile pictures
    (operation = ''SELECT'' AND bucket_id = ''profile-pictures'')
  ))'
);

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Ensure the bucket exists and is configured correctly
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO UPDATE
SET public = true; 