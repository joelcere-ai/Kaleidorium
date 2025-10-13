-- Create password_reset_otps table for storing OTP codes
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Create RLS policy (if RLS is enabled)
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert OTPs (for password reset requests)
CREATE POLICY "Allow OTP creation" ON password_reset_otps
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read and update OTPs (for verification)
CREATE POLICY "Allow OTP verification" ON password_reset_otps
  FOR ALL USING (true);


