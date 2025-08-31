# Security Access Controls Documentation

## Overview
This document outlines the comprehensive access control security measures implemented in the Kaleidorium platform to prevent weak access controls, self-invitation bypass, and privilege escalation vulnerabilities.

## CRITICAL VULNERABILITIES ADDRESSED

### 1. SELF-INVITATION BYPASS PREVENTION
**Vulnerability**: Artist registration could potentially be bypassed through self-invitation mechanisms
**Solution**: Multi-layered invitation validation system

#### Implementation:
- **Email-Token Matching**: Invitations must match exact email addresses
- **Invitation Reuse Prevention**: Tokens can only be used once
- **Expiration Enforcement**: 48-hour token validity window
- **Duplicate Registration Prevention**: Checks for existing artist accounts
- **Comprehensive Validation**: `/api/validate-artist-registration` endpoint

#### Security Features:
```typescript
// Enhanced invitation verification
const invitationValidation = await verifyInvitationOwnership(
  supabase,
  email.trim().toLowerCase(),
  inviteToken
);

// Prevents token hijacking
if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
  return { valid: false, error: 'Email mismatch' };
}

// Prevents duplicate registrations
const existingArtist = await supabase
  .from('Artists')
  .select('id')
  .eq('email', userEmail)
  .single();
```

### 2. ROLE VALIDATION ENFORCEMENT
**Vulnerability**: Insufficient role validation on operations
**Solution**: Database-backed role verification system

#### Implementation:
- **Multi-Source Role Verification**: Checks Collectors table, Artists table, and email fallback
- **Database-Backed Validation**: Authoritative role information stored in database
- **Admin Audit Trail**: All admin operations logged with role verification status

#### Enhanced Auth Middleware:
```typescript
// Comprehensive role verification
async function verifyUserRole(supabase, userId, userEmail) {
  // 1. Check Collectors table (most authoritative)
  const collectorData = await supabase
    .from('Collectors')
    .select('role')
    .eq('user_id', userId)
    .single();
    
  if (collectorData?.role) {
    return { role: collectorData.role, dbVerified: true };
  }
  
  // 2. Check Artists table
  const artistData = await supabase
    .from('Artists')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (artistData) {
    return { role: 'artist', dbVerified: true };
  }
  
  // 3. Admin email fallback (legacy)
  if (userEmail === 'joel.cere@blockmeister.com') {
    return { role: 'admin', dbVerified: false };
  }
  
  return { role: null, dbVerified: false };
}
```

### 3. ARTIST VERIFICATION SYSTEM
**Vulnerability**: Operations assumed artist status without proper validation
**Solution**: Comprehensive artist verification middleware

#### Implementation:
- **Role-Based Access Control**: `verifyArtist()` middleware for artist-only operations
- **Database Verification**: Confirms artist exists in Artists table
- **Admin Override**: Admins can access artist functions
- **Temporary Upload Support**: Special handling for registration uploads

#### Artist Verification:
```typescript
export async function verifyArtist(request: NextRequest) {
  const authResult = await verifyAuth(request);
  
  // Admin can access artist functions
  if (authResult.isAdmin) {
    return authResult;
  }
  
  // Verify user has artist role
  if (authResult.userRole !== 'artist') {
    return SecureErrors.authorization({ reason: 'not_artist' });
  }
  
  return authResult;
}
```

### 4. ADMIN PRIVILEGE ESCALATION PREVENTION
**Vulnerability**: Weak admin validation allowing privilege escalation
**Solution**: Multi-layer admin verification system

#### Implementation:
- **Database Role Priority**: Collectors table role takes precedence
- **Legacy Email Support**: Fallback for existing admin email
- **Audit Logging**: All admin operations logged with verification method
- **Access Denial Logging**: Failed admin attempts logged for security monitoring

#### Enhanced Admin Verification:
```typescript
// Database-first admin verification
const { data: collectorData } = await supabase
  .from('Collectors')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (collectorData?.role === 'admin') {
  isAdmin = true;
  dbVerified = true;
} else {
  // Fallback to email check for legacy admin
  isAdmin = user.email === 'joel.cere@blockmeister.com';
  dbVerified = false;
}
```

## SECURITY ENDPOINTS

### 1. `/api/verify-invite` - Enhanced Invitation Verification
**Purpose**: Prevents token hijacking and validates email-token pairs
**Security Features**:
- Requires both email and token
- Validates email matches invitation
- Prevents token reuse
- Checks expiration
- Prevents duplicate artist registration

### 2. `/api/validate-artist-registration` - Comprehensive Registration Validation
**Purpose**: Prevents self-invitation bypass and validates registration integrity
**Security Features**:
- Comprehensive invitation validation
- Duplicate username/email checking
- Suspicious activity detection
- Rate limiting on registration patterns
- Input sanitization and validation

### 3. `/api/upload-artwork` - Role-Based File Upload
**Purpose**: Ensures only authorized artists can upload artwork
**Security Features**:
- Enhanced role verification
- Database-backed artist validation
- Admin override capabilities
- Temporary upload support for registration

### 4. `/api/upload-profile-picture` - Secure Profile Management
**Purpose**: Validates user ownership of profile modifications
**Security Features**:
- Role-based access control
- Database verification for artists
- Collector table validation
- Admin override support

## ROLE HIERARCHY

### Admin (Highest Privilege)
- Can access all artist functions
- Can generate invitation tokens
- Can delete any account
- Can override security restrictions
- Database role: `Collectors.role = 'admin'`
- Legacy fallback: `joel.cere@blockmeister.com`

### Artist (Medium Privilege)
- Can upload artwork
- Can manage own profile
- Can access artist-specific functions
- Database verification: Entry in `Artists` table
- Role indicator: `Collectors.role = 'artist'`

### Collector (Base Privilege)
- Can manage own profile
- Can access discovery features
- Can manage collection
- Database verification: Entry in `Collectors` table
- Default role: `Collectors.role = 'collector'`

## AUDIT LOGGING

All access control operations are logged with:
- User ID and email
- Role verification method
- Database verification status
- Access granted/denied status
- Timestamp and operation details

### Log Categories:
- **Admin Access**: All admin operations
- **Role Verification**: Database role checks
- **Access Denial**: Failed authorization attempts
- **Invitation Validation**: Token verification results
- **Registration Validation**: Artist registration attempts

## RATE LIMITING INTEGRATION

Access control endpoints are protected with:
- **Authentication**: 5 requests/15 min
- **Registration**: 3 requests/hour
- **Admin Operations**: 50 requests/hour
- **File Uploads**: 20 requests/hour

## TESTING RECOMMENDATIONS

### 1. Role Validation Testing
- Verify artist-only endpoints reject collectors
- Test admin override functionality
- Validate database role priority over metadata

### 2. Invitation System Testing
- Test email-token mismatch rejection
- Verify token reuse prevention
- Test expiration enforcement
- Validate duplicate registration prevention

### 3. Privilege Escalation Testing
- Attempt to access admin functions without proper role
- Test role modification attempts
- Verify audit logging for failed attempts

### 4. Registration Bypass Testing
- Attempt registration without valid invitation
- Test multiple invitation attempts
- Verify suspicious activity detection

## SECURITY BEST PRACTICES

1. **Always verify roles at the database level** when possible
2. **Log all access control decisions** for audit trails
3. **Use the principle of least privilege** - grant minimum necessary access
4. **Validate invitation ownership** before allowing registration
5. **Implement rate limiting** on all authentication endpoints
6. **Sanitize and validate all inputs** before processing
7. **Use secure error handling** to prevent information disclosure

## MONITORING AND ALERTS

Monitor for:
- Multiple failed admin access attempts
- Suspicious registration patterns
- Role escalation attempts
- Invitation validation failures
- Unusual access patterns

## CONCLUSION

The implemented access control system provides comprehensive protection against:
- ✅ Self-invitation bypass vulnerabilities
- ✅ Insufficient role validation
- ✅ Privilege escalation attacks
- ✅ Unauthorized resource access
- ✅ Registration system abuse

All security measures are logged, rate-limited, and continuously monitored for suspicious activity. 