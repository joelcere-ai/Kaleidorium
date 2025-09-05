# 🔒 KALEIDORIUM SECURITY CHECKLIST

## ⚠️ CRITICAL - Must Fix Before Going Live

### 1. Enable Row Level Security (RLS) on Supabase
```sql
-- Run these commands in Supabase SQL Editor:

-- Enable RLS on all tables
ALTER TABLE "Artwork" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArtworkAnalytics" ENABLE ROW LEVEL SECURITY; 
ALTER TABLE "Artists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitations" ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust as needed)
CREATE POLICY "Authenticated users can read artwork" ON "Artwork"
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Artists can manage their artwork" ON "Artwork"
FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM "Artists")
);

CREATE POLICY "Users can read their analytics" ON "ArtworkAnalytics"
FOR SELECT TO authenticated USING (
  artwork_id IN (
    SELECT id FROM "Artwork" WHERE 
    auth.uid() IN (SELECT id FROM "Artists")
  )
);
```

### 2. Update Email Addresses
- [ ] Change `thekurator@blockmeister.com` to `kurator@kaleidorium.com` in:
  - `/lib/emailjs.ts` (line 47)
  - `/app/api/contact/route.ts` (line 30)
  - `/app/api/notify-admin/route.ts` (line 15)
  - `/app/api/artist-submission/route.ts` (lines 38-39)
  - `/app/for-artists/register/page.tsx` (line 450)
  - `/app/contact/page.tsx` (line 38)

### 3. Update Admin Email Reference
- [ ] Change `joel.cere@blockmeister.com` to your actual admin email in:
  - `/lib/auth-middleware.ts` (line 51)
  - `/app/api/invite-artist/route.ts` (line 55)
  - `/app/admin/page.tsx` (line 54)

## ✅ MEDIUM PRIORITY - Enhance Security

### 4. Implement Production Rate Limiting
- [ ] Replace in-memory rate limiting with Redis
- [ ] Add rate limiting to file upload endpoints
- [ ] Monitor and adjust rate limits based on usage

### 5. Security Headers Enhancement
```javascript
// Add to next.config.js headers:
{
  key: 'X-Frame-Options',
  value: 'DENY'
},
{
  key: 'X-Content-Type-Options', 
  value: 'nosniff'
},
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin'
}
```

### 6. Environment Variables Audit
- [ ] Ensure all sensitive keys are in Vercel environment variables
- [ ] Remove any hardcoded credentials from codebase
- [ ] Use different keys for development/production

## ✅ LOW PRIORITY - Best Practices

### 7. Monitoring & Logging
- [ ] Set up error monitoring (Sentry)
- [ ] Monitor failed authentication attempts
- [ ] Set up alerts for suspicious activity

### 8. Content Security Policy (CSP)
- [ ] Re-enable CSP with proper Google Analytics configuration
- [ ] Add nonce-based script loading for better security

### 9. Regular Security Maintenance
- [ ] Schedule monthly security reviews
- [ ] Keep dependencies updated
- [ ] Monitor Supabase security advisories

## 🔍 SECURITY TESTING CHECKLIST

### Before Launch:
- [ ] Test RLS policies with different user roles
- [ ] Verify rate limiting works correctly
- [ ] Test file upload security (malicious files)
- [ ] Verify admin-only endpoints are protected
- [ ] Test invitation system can't be bypassed
- [ ] Confirm sensitive data isn't exposed in API responses

### Post-Launch Monitoring:
- [ ] Monitor authentication failure rates
- [ ] Track unusual API usage patterns
- [ ] Regular security scans
- [ ] Monitor for new vulnerabilities

## 📞 INCIDENT RESPONSE PLAN

### If Security Breach Detected:
1. Immediately disable affected accounts
2. Change all API keys and passwords
3. Review logs for extent of breach
4. Notify users if personal data affected
5. Document incident and lessons learned

## 🎯 SECURITY SCORE: 8/10

Your Kaleidorium app has excellent security foundations. The main concern is ensuring RLS is properly configured on Supabase before going live. Once addressed, you'll have a very secure art discovery platform. 