import crypto from 'crypto';

// Environment-based logging levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Configuration based on environment
const getLogConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    level: env === 'production' ? 'warn' : 'debug',
    sanitize: true, // Always sanitize, even in development
    includeStack: env !== 'production',
    maxStackLines: 5
  };
};

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  userId: /^[a-zA-Z0-9-]{8,}/,
  tempUserId: /^temp-upload-\d+$/,
  fileName: /^.*\.(jpg|jpeg|png|gif|webp|tiff|bmp)$/i,
  supabaseUrl: /https:\/\/[a-z0-9]+\.supabase\.co/g,
  token: /^[a-zA-Z0-9._-]{20,}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};

// Data sanitization functions
const sanitizers = {
  email: (email: string): string => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? 
      `${local[0]}***${local[local.length - 1]}` : 
      '***';
    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName.length > 2 ? 
      `${domainName[0]}***.${tld}` : 
      `***.${tld}`;
    return `${maskedLocal}@${maskedDomain}`;
  },

  userId: (userId: string): string => {
    if (userId.startsWith('temp-upload-')) {
      return `temp-upload-***${userId.slice(-4)}`;
    }
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    return `user_${hash.slice(0, 8)}`;
  },

  fileName: (fileName: string): string => {
    const parts = fileName.split('.');
    const extension = parts.pop();
    const name = parts.join('.');
    
    if (name.length <= 8) return `*****.${extension}`;
    
    const sanitized = `${name.slice(0, 3)}***${name.slice(-3)}.${extension}`;
    return sanitized;
  },

  supabaseUrl: (url: string): string => {
    return url.replace(/https:\/\/[a-z0-9]+\.supabase\.co/g, 'https://*****.supabase.co');
  },

  token: (token: string): string => {
    if (token.length <= 8) return '******';
    return `${token.slice(0, 4)}***${token.slice(-4)}`;
  },

  stack: (stack: string): string => {
    const lines = stack.split('\n');
    const config = getLogConfig();
    
    if (!config.includeStack) return '[Stack trace omitted in production]';
    
    // Keep error message and limited stack lines
    const relevantLines = lines.slice(0, config.maxStackLines + 1);
    
    // Sanitize file paths in stack trace
    return relevantLines
      .map(line => 
        line.replace(/\/Users\/[^/]+\/.*?\/([^/]+\/[^/]+)$/, '/***/$1')
           .replace(/webpack-internal:\/\/\/.*?\/([^/]+)$/, 'webpack:**/$1')
      )
      .join('\n');
  }
};

// Deep sanitization of objects
function sanitizeValue(value: any, key?: string): any {
  if (value === null || value === undefined) return value;
  
  // Handle different data types
  if (typeof value === 'string') {
    // Apply sanitization based on key names or patterns
    if (key) {
      switch (key.toLowerCase()) {
        case 'email':
        case 'useremail':
          return SENSITIVE_PATTERNS.email.test(value) ? sanitizers.email(value) : value;
        
        case 'userid':
        case 'tempuserid':
        case 'user_id':
          return sanitizers.userId(value);
        
        case 'filename':
        case 'originalfilename':
        case 'file_name':
          return SENSITIVE_PATTERNS.fileName.test(value) ? sanitizers.fileName(value) : value;
        
        case 'stack':
          return sanitizers.stack(value);
        
        case 'token':
        case 'accesstoken':
        case 'refreshtoken':
          return sanitizers.token(value);
      }
    }
    
    // Pattern-based sanitization for values without clear keys
    if (SENSITIVE_PATTERNS.email.test(value)) return sanitizers.email(value);
    if (SENSITIVE_PATTERNS.supabaseUrl.test(value)) return sanitizers.supabaseUrl(value);
    if (SENSITIVE_PATTERNS.uuid.test(value)) return sanitizers.token(value);
    
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeValue(item, `${key}_${index}`));
  }
  
  if (typeof value === 'object') {
    const sanitized: any = {};
    for (const [objKey, objValue] of Object.entries(value)) {
      sanitized[objKey] = sanitizeValue(objValue, objKey);
    }
    return sanitized;
  }
  
  return value;
}

// Generate correlation ID for tracking related logs
function generateCorrelationId(): string {
  return crypto.randomBytes(4).toString('hex');
}

// Main logging interface
interface LogData {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  sanitizedData?: any;
  environment: string;
}

class SecureLogger {
  private config = getLogConfig();
  private correlationId?: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || generateCorrelationId();
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.config.level as LogLevel];
  }

  private createLogEntry(level: LogLevel, message: string, data?: LogData): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      environment: process.env.NODE_ENV || 'development'
    };

    if (data && Object.keys(data).length > 0) {
      entry.sanitizedData = this.config.sanitize ? sanitizeValue(data) : data;
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const logLine = `[SECURE_${entry.level.toUpperCase()}] ${entry.message}`;
    
    if (entry.sanitizedData) {
      console.log(logLine, entry.sanitizedData);
    } else {
      console.log(logLine);
    }
  }

  // Public logging methods
  error(message: string, data?: LogData): void {
    if (this.shouldLog('error')) {
      this.output(this.createLogEntry('error', message, data));
    }
  }

  warn(message: string, data?: LogData): void {
    if (this.shouldLog('warn')) {
      this.output(this.createLogEntry('warn', message, data));
    }
  }

  info(message: string, data?: LogData): void {
    if (this.shouldLog('info')) {
      this.output(this.createLogEntry('info', message, data));
    }
  }

  debug(message: string, data?: LogData): void {
    if (this.shouldLog('debug')) {
      this.output(this.createLogEntry('debug', message, data));
    }
  }

  // Create child logger with same correlation ID
  child(): SecureLogger {
    return new SecureLogger(this.correlationId);
  }

  // Create new logger with different correlation ID
  static create(): SecureLogger {
    return new SecureLogger();
  }
}

// Export convenience functions
export const createLogger = (correlationId?: string) => new SecureLogger(correlationId);

export const secureLog = {
  error: (message: string, data?: LogData) => new SecureLogger().error(message, data),
  warn: (message: string, data?: LogData) => new SecureLogger().warn(message, data),
  info: (message: string, data?: LogData) => new SecureLogger().info(message, data),
  debug: (message: string, data?: LogData) => new SecureLogger().debug(message, data)
};

export { SecureLogger };
export default SecureLogger; 