import { secureLog, ErrorCategory } from './secure-error-handler';

// File type signatures (magic numbers) for validation
const FILE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG EXIF
    [0xFF, 0xD8, 0xFF, 0xDB], // JPEG
    [0xFF, 0xD8, 0xFF, 0xEE], // JPEG SPIFF
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (WebP starts with RIFF)
  ]
} as const;

// Suspicious patterns that might indicate malware
const MALWARE_PATTERNS = [
  // Executable patterns
  [0x4D, 0x5A], // MZ (Windows PE header)
  [0x7F, 0x45, 0x4C, 0x46], // ELF (Linux executable)
  [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O (macOS executable)
  
  // Script patterns
  /<%[\s\S]*%>/g, // ASP
  /<\?php[\s\S]*\?>/g, // PHP
  /<script[\s\S]*<\/script>/gi, // JavaScript
  /eval\s*\(/gi, // eval function
  /document\.write/gi, // document.write
  /window\.location/gi, // location redirect
  
  // SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /delete\s+from/gi,
  /insert\s+into/gi,
  
  // Command injection patterns
  /\$\([^)]*\)/g, // Command substitution
  /`[^`]*`/g, // Backticks
  /\|\s*\w+/g, // Pipe commands
] as const;

// Maximum file sizes by type
const MAX_FILE_SIZES = {
  'image/jpeg': 5 * 1024 * 1024, // 5MB
  'image/png': 5 * 1024 * 1024,  // 5MB
  'image/gif': 2 * 1024 * 1024,  // 2MB
  'image/webp': 3 * 1024 * 1024, // 3MB
} as const;

// Safe file extensions
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFile?: File;
  securityFlags?: string[];
}

/**
 * Reads the first few bytes of a file to check magic numbers (server-compatible)
 */
async function readFileHeader(file: File, bytesToRead: number = 16): Promise<number[]> {
  try {
    // Server-compatible approach using ArrayBuffer
    const blob = file.slice(0, bytesToRead);
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    return Array.from(bytes);
  } catch (error) {
    throw new Error('Failed to read file header');
  }
}

/**
 * Reads file content as text for pattern scanning (server-compatible)
 */
async function readFileAsText(file: File): Promise<string> {
  try {
    // Server-compatible approach using ArrayBuffer and TextDecoder
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  } catch (error) {
    throw new Error('Failed to read file content');
  }
}

/**
 * Validates file signature against known magic numbers
 */
function validateFileSignature(fileBytes: number[], expectedType: string): boolean {
  const signatures = FILE_SIGNATURES[expectedType as keyof typeof FILE_SIGNATURES];
  if (!signatures) return false;
  
  return signatures.some(signature => {
    return signature.every((byte, index) => {
      return index < fileBytes.length && fileBytes[index] === byte;
    });
  });
}

/**
 * Scans file content for malware patterns
 */
async function scanForMalware(file: File): Promise<{ isSafe: boolean; threats: string[] }> {
  const threats: string[] = [];
  
  try {
    // Read file header for executable signatures
    const header = await readFileHeader(file, 32);
    
    // Check for executable file signatures
    for (const pattern of MALWARE_PATTERNS) {
      if (Array.isArray(pattern)) {
        const matchFound = pattern.every((byte, index) => {
          return index < header.length && header[index] === byte;
        });
        if (matchFound) {
          threats.push('Executable file signature detected');
          break;
        }
      }
    }
    
    // Read file content for text-based threats (only for small files)
    if (file.size < 1024 * 1024) { // Only scan files smaller than 1MB
      try {
        const content = await readFileAsText(file);
        
        // Check for script and injection patterns
        for (const pattern of MALWARE_PATTERNS) {
          if (pattern instanceof RegExp) {
            if (pattern.test(content)) {
              threats.push(`Suspicious pattern detected: ${pattern.source}`);
            }
          }
        }
      } catch (e) {
        // If we can't read as text, it's likely a binary file which is expected for images
        secureLog('info', 'File content scan skipped (binary file)', { fileName: file.name });
      }
    }
    
  } catch (error) {
    secureLog('error', 'Malware scan failed', { fileName: file.name, error });
    threats.push('File scan failed - potentially corrupted');
  }
  
  return {
    isSafe: threats.length === 0,
    threats
  };
}

/**
 * Validates file name for security issues
 */
function validateFileName(fileName: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { valid: false, error: 'Invalid file name' };
  }
  
  // Remove path traversal attempts
  let sanitized = fileName.replace(/[/\\:*?"<>|]/g, '');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.includes('~')) {
    return { valid: false, error: 'File name contains invalid characters' };
  }
  
  // Check length
  if (sanitized.length === 0) {
    return { valid: false, error: 'File name cannot be empty' };
  }
  
  if (sanitized.length > 255) {
    return { valid: false, error: 'File name is too long' };
  }
  
  // Check for reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = sanitized.split('.')[0].toUpperCase();
  
  if (reservedNames.includes(nameWithoutExt)) {
    return { valid: false, error: 'File name is reserved' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validates file extension
 */
function validateFileExtension(fileName: string, expectedMimeType: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  
  // Check if extension is in allowed list
  if (!ALLOWED_EXTENSIONS.includes(extension as any)) {
    return false;
  }
  
  // Verify extension matches MIME type
  const validExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp']
  };
  
  const expectedExtensions = validExtensions[expectedMimeType];
  return expectedExtensions ? expectedExtensions.includes(extension) : false;
}

/**
 * Comprehensive secure file validation
 */
export async function validateSecureFileUpload(file: File): Promise<FileValidationResult> {
  const securityFlags: string[] = [];
  
  try {
    secureLog('info', 'Starting secure file validation', { 
      fileName: file.name, 
      fileSize: file.size, 
      mimeType: file.type 
    });
    
    // 1. Basic file validation
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    // 2. File size validation
    const maxSize = MAX_FILE_SIZES[file.type as keyof typeof MAX_FILE_SIZES];
    if (!maxSize) {
      return { valid: false, error: 'Unsupported file type' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit` };
    }
    
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    
    // 3. File name validation
    const nameValidation = validateFileName(file.name);
    if (!nameValidation.valid) {
      return { valid: false, error: nameValidation.error };
    }
    
    // 4. File extension validation
    if (!validateFileExtension(file.name, file.type)) {
      securityFlags.push('Extension mismatch');
      return { valid: false, error: 'File extension does not match file type' };
    }
    
    // 5. Magic number validation (file signature)
    const fileHeader = await readFileHeader(file, 16);
    if (!validateFileSignature(fileHeader, file.type)) {
      securityFlags.push('Invalid file signature');
      return { valid: false, error: 'File content does not match declared type' };
    }
    
    // 6. Malware scanning
    const malwareScan = await scanForMalware(file);
    if (!malwareScan.isSafe) {
      securityFlags.push(...malwareScan.threats);
      secureLog('error', 'Malware detected in file upload', { 
        fileName: file.name, 
        threats: malwareScan.threats 
      });
      return { valid: false, error: 'File failed security scan' };
    }
    
    // 7. Create sanitized file with secure name
    const timestamp = Date.now();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedName = `upload_${timestamp}.${extension}`;
    
    const sanitizedFile = new File([file], sanitizedName, {
      type: file.type,
      lastModified: timestamp
    });
    
    secureLog('info', 'File validation successful', { 
      originalName: file.name,
      sanitizedName: sanitizedName,
      fileSize: file.size,
      securityFlags 
    });
    
    return {
      valid: true,
      sanitizedFile,
      securityFlags: securityFlags.length > 0 ? securityFlags : undefined
    };
    
  } catch (error) {
    secureLog('error', 'File validation failed', { 
      fileName: file.name, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return { valid: false, error: 'File validation failed' };
  }
}

/**
 * Additional security: Check file against external virus scanning service
 * This would integrate with services like VirusTotal, ClamAV, or similar
 */
export async function scanWithExternalService(file: File): Promise<{ isSafe: boolean; scanResult?: any }> {
  // This is a placeholder for external virus scanning integration
  // In production, you would integrate with services like:
  // - VirusTotal API
  // - ClamAV
  // - AWS GuardDuty
  // - Google Safe Browsing API
  
  secureLog('info', 'External virus scan placeholder', { fileName: file.name });
  
  // For now, return safe (implement actual service integration in production)
  return { isSafe: true, scanResult: { service: 'placeholder' } };
}

/**
 * Complete secure upload process
 */
export async function processSecureUpload(
  file: File, 
  userId: string,
  useExternalScanning: boolean = false
): Promise<FileValidationResult> {
  
  // Step 1: Local validation and scanning
  const localValidation = await validateSecureFileUpload(file);
  if (!localValidation.valid) {
    return localValidation;
  }
  
  // Step 2: External virus scanning (optional)
  if (useExternalScanning && localValidation.sanitizedFile) {
    const externalScan = await scanWithExternalService(localValidation.sanitizedFile);
    if (!externalScan.isSafe) {
      secureLog('error', 'External virus scan failed', { 
        userId, 
        fileName: file.name,
        scanResult: externalScan.scanResult 
      });
      return { valid: false, error: 'File failed external security scan' };
    }
  }
  
  secureLog('info', 'Secure upload processing complete', { 
    userId, 
    originalFileName: file.name,
    sanitizedFileName: localValidation.sanitizedFile?.name 
  });
  
  return localValidation;
} 