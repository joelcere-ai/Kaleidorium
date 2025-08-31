import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (for development)
// In production, you should use Redis or another persistent store
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Whether to skip counting successful requests
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints - very strict
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  
  // Registration endpoints - strict
  REGISTRATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour
    message: 'Too many registration attempts. Please try again in an hour.',
  },
  
  // Account deletion - very strict
  DELETE_ACCOUNT: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 2, // 2 deletions per day
    message: 'Account deletion limit reached. Please contact support if you need assistance.',
  },
  
  // Email/contact endpoints - moderate
  EMAIL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 emails per hour
    message: 'Too many email requests. Please try again in an hour.',
  },
  
  // General API endpoints - lenient
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please slow down.',
  },
  
  // Admin endpoints - moderate but secure
  ADMIN: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 admin actions per hour
    message: 'Admin rate limit exceeded. Please try again later.',
  },
  
  // File upload endpoints - strict
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 uploads per hour
    message: 'Upload limit exceeded. Please try again later.',
  }
} as const;

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Include user agent for additional uniqueness (but hash it for privacy)
  const userAgent = request.headers.get('user-agent') || '';
  const identifier = `${clientIp}-${hashString(userAgent)}`;
  
  return identifier;
}

/**
 * Simple string hash function for privacy
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Main rate limiting function
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    // Clean up expired entries periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup on each request
      cleanupExpiredEntries();
    }

    const clientId = getClientId(request);
    const key = `${clientId}-${request.nextUrl.pathname}`;
    const now = Date.now();
    
    // Get or create rate limit data for this client
    let rateLimitData = requestCounts.get(key);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Create new window
      rateLimitData = {
        count: 1,
        resetTime: now + config.windowMs
      };
      requestCounts.set(key, rateLimitData);
      return null; // Allow request
    }
    
    // Check if limit exceeded
    if (rateLimitData.count >= config.maxRequests) {
      // Rate limit exceeded
      const resetIn = Math.ceil((rateLimitData.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded',
          retryAfter: resetIn,
          limit: config.maxRequests,
          windowMs: config.windowMs
        },
        { 
          status: 429,
          headers: {
            'Retry-After': resetIn.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitData.resetTime.toString()
          }
        }
      );
    }
    
    // Increment counter
    rateLimitData.count++;
    requestCounts.set(key, rateLimitData);
    
    return null; // Allow request
  };
}

/**
 * Convenience function to apply rate limiting to API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply rate limiting
    const rateLimitResponse = rateLimit(config)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // If rate limit passed, call the original handler
    return handler(request);
  };
}

/**
 * Rate limit middleware specifically for authentication endpoints
 */
export const authRateLimit = rateLimit(RATE_LIMITS.AUTH);

/**
 * Rate limit middleware specifically for registration endpoints
 */
export const registrationRateLimit = rateLimit(RATE_LIMITS.REGISTRATION);

/**
 * Rate limit middleware specifically for account deletion endpoints
 */
export const deleteAccountRateLimit = rateLimit(RATE_LIMITS.DELETE_ACCOUNT);

/**
 * Rate limit middleware specifically for email endpoints
 */
export const emailRateLimit = rateLimit(RATE_LIMITS.EMAIL);

/**
 * Rate limit middleware specifically for general API endpoints
 */
export const generalRateLimit = rateLimit(RATE_LIMITS.GENERAL);

/**
 * Rate limit middleware specifically for admin endpoints
 */
export const adminRateLimit = rateLimit(RATE_LIMITS.ADMIN);

/**
 * Rate limit middleware specifically for upload endpoints
 */
export const uploadRateLimit = rateLimit(RATE_LIMITS.UPLOAD); 