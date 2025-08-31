# Creating Admin Accounts

To set up admin access for your Kaleidorium platform, you have several options:

## Option 1: Using Your Admin Email (Recommended)
The simplest approach is to use your pre-configured admin email:
- Sign up with email: `joel.cere@blockmeister.com` 
- This email is automatically granted admin privileges

## Option 2: Update User Metadata in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Find the user you want to make an admin
4. Click on the user to edit
5. Add to their `user_metadata` or `app_metadata`:
   ```json
   {
     "role": "admin"
   }
   ```

## Option 3: SQL Command (Advanced)
If you have direct database access, you can update user metadata:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin-email@example.com';
```

## Creating Your Admin Account

### Step 1: Register as Joel
1. Go to the Kaleidorium registration page
2. Sign up with email: `joel.cere@blockmeister.com`
3. Choose a secure password (this will be your admin password)
4. Complete the registration process

### Step 2: Verify Admin Access
1. Sign in with your new account
2. Navigate to `/admin/invite-artist`
3. You should see the admin dashboard for generating artist invitation tokens

## Testing Admin Access
Once you've set up your admin account:
1. Sign in with `joel.cere@blockmeister.com` and your chosen password
2. Navigate to `/admin/invite-artist`
3. You should see the admin interface for generating artist invitation tokens

## Security Notes
- Your admin account (`joel.cere@blockmeister.com`) can access sensitive functions like:
  - Artist invitation generation
  - Account deletion (any user)
  - All admin-protected API endpoints
- Keep your admin password secure
- Consider using a strong, unique password for your admin account
- The admin dashboard shows your logged-in status for verification 