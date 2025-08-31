/**
 * Comprehensive input validation and sanitization utilities
 */

// Email validation regex - RFC 5322 compliant
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// URL validation regex
const URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w._~:/?#[\]@!$&'()*+,;=-]|%[0-9A-Fa-f]{2})*)?$/;

// Name validation (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s\-']{1,100}$/;

// Username validation (alphanumeric, underscores, hyphens)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validates and sanitizes email addresses
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Check for suspicious patterns
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates URLs
 */
export function validateURL(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }

  if (!URL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates names (first name, surname, etc.)
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters long` };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldName} is too long (max 100 characters)` };
  }

  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates usernames
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Username cannot be empty' };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validates UUIDs
 */
export function validateUUID(uuid: string): ValidationResult {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'ID is required' };
  }

  const trimmed = uuid.trim();
  
  if (!UUID_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid ID format' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Sanitizes text input to prevent XSS
 */
export function sanitizeText(text: string, maxLength: number = 1000): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text is required' };
  }

  let sanitized = text
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, maxLength);

  if (sanitized.length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates file uploads
 */
export function validateFileUpload(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // Check for suspicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true };
}

/**
 * Validates portfolio submission data
 */
export function validatePortfolioSubmission(data: any): { valid: boolean; errors: string[]; sanitized?: any } {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate name
  const nameResult = validateName(data.name);
  if (!nameResult.valid) {
    errors.push(nameResult.error!);
  } else {
    sanitized.name = nameResult.sanitized;
  }

  // Validate email
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    errors.push(emailResult.error!);
  } else {
    sanitized.email = emailResult.sanitized;
  }

  // Validate portfolio link
  const urlResult = validateURL(data.portfolioLink);
  if (!urlResult.valid) {
    errors.push(urlResult.error!);
  } else {
    sanitized.portfolioLink = urlResult.sanitized;
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
} 