import { NextResponse } from 'next/server';
import { secureLog as newSecureLog, createLogger } from './secure-logger';

// Environment check
const isDevelopment = process.env.NODE_ENV !== 'production';

// Generic error messages for production
const GENERIC_ERROR_MESSAGES = {
  AUTHENTICATION: 'Authentication failed. Please try again.',
  AUTHORIZATION: 'You are not authorized to perform this action.',
  VALIDATION: 'Invalid input provided. Please check your data.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  DATABASE: 'A database error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  FILE_UPLOAD: 'File upload failed. Please try again.',
  EMAIL: 'Email service error. Please try again later.',
  SERVER: 'An internal server error occurred. Please try again.',
  EXTERNAL_API: 'External service unavailable. Please try again later.',
  MAINTENANCE: 'Service temporarily unavailable. Please try again later.'
} as const;

// Error categories for logging
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION', 
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  FILE_UPLOAD = 'FILE_UPLOAD',
  EMAIL = 'EMAIL',
  SERVER = 'SERVER',
  EXTERNAL_API = 'EXTERNAL_API',
  MAINTENANCE = 'MAINTENANCE'
}

// Secure error class with sanitization
export class SecureError extends Error {
  public readonly category: ErrorCategory;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly logDetails: Record<string, any>;
  public readonly publicMessage: string;

  constructor(
    category: ErrorCategory,
    statusCode: number = 500,
    publicMessage?: string,
    logDetails: Record<string, any> = {},
    originalError?: Error
  ) {
    super(originalError?.message || GENERIC_ERROR_MESSAGES[category]);
    
    this.category = category;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.logDetails = logDetails;
    this.publicMessage = publicMessage || GENERIC_ERROR_MESSAGES[category];
    
    // Preserve stack trace in development only
    if (isDevelopment && originalError?.stack) {
      this.stack = originalError.stack;
    }
    
    // Don't expose stack trace in production
    if (!isDevelopment) {
      delete this.stack;
    }
  }
}

// Database error patterns to catch and sanitize
const DATABASE_ERROR_PATTERNS = [
  /duplicate key value violates unique constraint/i,
  /foreign key constraint/i,
  /relation.*does not exist/i,
  /column.*does not exist/i,
  /syntax error/i,
  /connection refused/i,
  /timeout/i,
  /permission denied/i
];

// Supabase specific error patterns
const SUPABASE_ERROR_PATTERNS = [
  /row level security/i,
  /jwt/i,
  /rpc/i,
  /postgrest/i,
  /pgrst/i
];

/**
 * Sanitize error messages to prevent information disclosure
 */
function sanitizeErrorMessage(error: any): string {
  if (!error?.message) return GENERIC_ERROR_MESSAGES.SERVER;
  
  const message = error.message.toLowerCase();
  
  // Check for database errors
  if (DATABASE_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return GENERIC_ERROR_MESSAGES.DATABASE;
  }
  
  // Check for Supabase specific errors
  if (SUPABASE_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return GENERIC_ERROR_MESSAGES.DATABASE;
  }
  
  // Check for network errors
  if (message.includes('network') || message.includes('connect') || message.includes('timeout')) {
    return GENERIC_ERROR_MESSAGES.NETWORK;
  }
  
  // Check for authentication errors
  if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
    return GENERIC_ERROR_MESSAGES.AUTHENTICATION;
  }
  
  // Check for validation errors (these can be more specific)
  if (message.includes('invalid') || message.includes('required') || message.includes('validation')) {
    return GENERIC_ERROR_MESSAGES.VALIDATION;
  }
  
  // Default to generic server error
  return GENERIC_ERROR_MESSAGES.SERVER;
}

/**
 * Extract safe details for logging while hiding sensitive information
 */
function extractSafeLogDetails(error: any, context: Record<string, any> = {}): Record<string, any> {
  const safeDetails: Record<string, any> = {
    timestamp: new Date().toISOString(),
    category: 'UNKNOWN',
    ...context
  };
  
  // Add safe error information
  if (error) {
    safeDetails.errorType = error.constructor?.name || 'Unknown';
    safeDetails.hasStack = !!error.stack;
    
    // In development, include more details
    if (isDevelopment) {
      safeDetails.originalMessage = error.message;
      safeDetails.stack = error.stack;
    }
  }
  
  return safeDetails;
}

/**
 * Secure logging function that sanitizes sensitive information
 * @deprecated Use the new secure logger from secure-logger.ts
 */
export function secureLog(level: 'info' | 'warn' | 'error', message: string, details?: Record<string, any>) {
  // Use new secure logger with enhanced sanitization
  switch (level) {
    case 'error':
      newSecureLog.error(message, details);
      break;
    case 'warn':
      newSecureLog.warn(message, details);
      break;
    case 'info':
      newSecureLog.info(message, details);
      break;
  }
}

/**
 * Create a secure error response that doesn't leak internal information
 */
export function createSecureErrorResponse(
  error: any,
  category: ErrorCategory = ErrorCategory.SERVER,
  statusCode: number = 500,
  context: Record<string, any> = {}
): NextResponse {
  
  // Create sanitized public message
  const publicMessage = sanitizeErrorMessage(error);
  
  // Extract safe logging details
  const logDetails = extractSafeLogDetails(error, context);
  
  // Log the error securely
  secureLog('error', `API Error: ${category}`, {
    ...logDetails,
    statusCode,
    publicMessage
  });
  
  // Create secure response
  const responseBody: any = {
    error: publicMessage,
    code: category,
    timestamp: new Date().toISOString()
  };
  
  // In development, add more debug info
  if (isDevelopment && error) {
    responseBody.debug = {
      originalMessage: error.message,
      type: error.constructor?.name,
      stack: error.stack?.split('\n').slice(0, 5) // Limit stack trace
    };
  }
  
  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withSecureErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>,
  context: string = 'API'
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createSecureErrorResponse(error, ErrorCategory.SERVER, 500, { context });
    }
  };
}

/**
 * Predefined secure error responses for common scenarios
 */
export const SecureErrors = {
  authentication: (details?: Record<string, any>) => 
    createSecureErrorResponse(
      new Error('Authentication failed'), 
      ErrorCategory.AUTHENTICATION, 
      401, 
      details
    ),
  
  authorization: (details?: Record<string, any>) => 
    createSecureErrorResponse(
      new Error('Authorization failed'), 
      ErrorCategory.AUTHORIZATION, 
      403, 
      details
    ),
  
  validation: (message: string = 'Invalid input', details?: Record<string, any>) => 
    createSecureErrorResponse(
      new Error(message), 
      ErrorCategory.VALIDATION, 
      400, 
      details
    ),
  
  notFound: (resource: string = 'Resource', details?: Record<string, any>) => 
    createSecureErrorResponse(
      new Error(`${resource} not found`), 
      ErrorCategory.NOT_FOUND, 
      404, 
      details
    ),
  
  database: (details?: Record<string, any>) => 
    createSecureErrorResponse(
      new Error('Database error'), 
      ErrorCategory.DATABASE, 
      500, 
      details
    ),
  
  external: (service: string = 'External service', details?: Record<string, any>) => 
    createSecureErrorResponse(
      new Error(`${service} error`), 
      ErrorCategory.EXTERNAL_API, 
      502, 
      details
    ),
  
  server: (details?: Record<string, any>) => 
    createSecureErrorResponse(
      new Error('Internal server error'), 
      ErrorCategory.SERVER, 
      500, 
      details
    )
};

/**
 * Convert Supabase errors to secure errors
 */
export function handleSupabaseError(error: any, operation: string = 'Database operation'): NextResponse {
  secureLog('error', `Supabase error during ${operation}`, {
    operation,
    errorCode: error?.code,
    hint: error?.hint,
    details: error?.details
  });
  
  return SecureErrors.database({ operation });
}

/**
 * Convert validation errors to secure errors
 */
export function handleValidationError(field: string, value?: any): NextResponse {
  secureLog('warn', `Validation failed for field: ${field}`, {
    field,
    hasValue: value !== undefined,
    valueType: typeof value
  });
  
  return SecureErrors.validation(`Invalid ${field} provided`);
} 