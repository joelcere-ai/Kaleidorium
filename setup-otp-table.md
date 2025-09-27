# Setup Password Reset OTP Table

To complete the password reset functionality, you need to create the `password_reset_otps` table in your Supabase database.

## Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your Kaleidorium project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run this SQL command:**

```sql
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
```

4. **Click "Run" to execute the SQL**

5. **Verify the table was created**
   - Go to "Table Editor" in the left sidebar
   - You should see `password_reset_otps` in the list

## Environment Variables

You also need to add this environment variable to your `.env.local` file:

```
NEXT_PUBLIC_EMAILJS_OTP_TEMPLATE_ID=your_otp_template_id_here
```

And create an EmailJS template for OTP emails with these variables:
- `{{to_email}}` - User's email address
- `{{otp_code}}` - The 6-digit verification code
- `{{from_name}}` - "Kaleidorium Team"
- `{{app_name}}` - "Kaleidorium"
- `{{expiry_minutes}}` - "10"

## Test the Flow

After setting up the table and EmailJS template:

1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for the 6-digit OTP code
4. Enter the code on the verification page
5. Set your new password

The system will now work without Supabase magic links!

