/**
 * Security Configuration - Part 10
 * 
 * Authentication, authorization, and security hardening utilities
 */

// ─── Password Security ───────────────────────────────────────────────────────

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  checkBreachedPasswords: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: false, // Avoid pushing users toward Password1!
  requireLowercase: false,
  requireNumbers: false,
  requireSpecial: false,
  checkBreachedPasswords: true,
};

/**
 * Validate password against policy
 */
export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (policy.checkBreachedPasswords) {
    // In production, check against Have I Been Pwned API or similar
    // For now, check against common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.some(wp => password.toLowerCase().includes(wp))) {
      errors.push('Password contains commonly breached patterns');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── Session Management ──────────────────────────────────────────────────────

export interface SessionConfig {
  idleTimeoutMinutes: number;
  absoluteTimeoutHours: number;
  maxConcurrentSessions: number;
  requireMFAForSensitiveOps: boolean;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  idleTimeoutMinutes: 30,
  absoluteTimeoutHours: 12,
  maxConcurrentSessions: 3,
  requireMFAForSensitiveOps: true,
};

export interface ActiveSession {
  id: string;
  userId: number;
  device: string;
  browser: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
}

export const RATE_LIMITS: RateLimitConfig[] = [
  { endpoint: '/api/auth/login', maxRequests: 5, windowSeconds: 60 },
  { endpoint: '/api/auth/register', maxRequests: 3, windowSeconds: 60 },
  { endpoint: '/api/auth/reset-password', maxRequests: 3, windowSeconds: 60 },
  { endpoint: '/api/*/write', maxRequests: 60, windowSeconds: 60 },
  { endpoint: '/api/*/read', maxRequests: 300, windowSeconds: 60 },
  { endpoint: '/api/*/export', maxRequests: 10, windowSeconds: 3600 },
  { endpoint: '/api/backups/download', maxRequests: 3, windowSeconds: 86400 },
];

// ─── Account Lockout ─────────────────────────────────────────────────────────

export interface LockoutConfig {
  maxFailedAttempts: number;
  lockoutWindowMinutes: number;
  baseLockoutMinutes: number;
  maxLockoutMinutes: number;
  exponentialBackoff: boolean;
}

export const DEFAULT_LOCKOUT_CONFIG: LockoutConfig = {
  maxFailedAttempts: 5,
  lockoutWindowMinutes: 15,
  baseLockoutMinutes: 5,
  maxLockoutMinutes: 60,
  exponentialBackoff: true,
};

export interface LoginAttempt {
  userId: number;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// ─── MFA Configuration ───────────────────────────────────────────────────────

export interface MFAConfig {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  required: boolean;
}

export const DEFAULT_MFA_CONFIG: MFAConfig = {
  enabled: true,
  method: 'totp',
  required: false, // Required for Super Admins and sensitive permissions
};

// ─── Security Headers ────────────────────────────────────────────────────────

export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // For React dev mode
    "style-src 'self' 'unsafe-inline'", // For Tailwind
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// ─── Audit Trail ─────────────────────────────────────────────────────────────

export type AuditAction = 
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_terminated'
  | 'password_changed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'permission_granted'
  | 'permission_revoked'
  | 'assignment_created'
  | 'assignment_modified'
  | 'assignment_revoked'
  | 'data_exported'
  | 'data_printed'
  | 'backup_created'
  | 'backup_downloaded'
  | 'backup_deleted'
  | 'restore_requested'
  | 'restore_approved'
  | 'restore_completed'
  | 'restore_failed'
  | 'sensitive_data_viewed'
  | 'access_denied';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: number | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  previousHash?: string;
  hash: string;
}

/**
 * Generate hash for audit trail integrity
 */
export function generateAuditHash(entry: Omit<AuditEntry, 'hash' | 'previousHash'>, previousHash?: string): string {
  const data = JSON.stringify({ ...entry, previousHash });
  // In production, use crypto.subtle.digest or a proper hashing library
  // This is a simplified version for demonstration
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ─── Input Sanitization ──────────────────────────────────────────────────────

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, allowedTypes: string[], maxSizeMB: number): {
  valid: boolean;
  error?: string;
} {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed` };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  return { valid: true };
}

// ─── CSRF Protection ─────────────────────────────────────────────────────────

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

// ─── Encryption Utilities ────────────────────────────────────────────────────

/**
 * Encrypt sensitive data (client-side encryption for demo)
 * In production, this should be done server-side with proper key management
 */
export async function encryptData(data: string, key: string): Promise<string> {
  // Simplified encryption for demonstration
  // In production, use Web Crypto API with AES-GCM
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const keyBuffer = encoder.encode(key);
  
  // XOR encryption (NOT secure - for demo only)
  const encrypted = new Uint8Array(dataBuffer.length);
  for (let i = 0; i < dataBuffer.length; i++) {
    encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(encrypted: string, key: string): Promise<string> {
  const encryptedBuffer = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const keyBuffer = new TextEncoder().encode(key);
  
  const decrypted = new Uint8Array(encryptedBuffer.length);
  for (let i = 0; i < encryptedBuffer.length; i++) {
    decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

// ─── Security Checklist ──────────────────────────────────────────────────────

export const SECURITY_CHECKLIST = [
  { id: 'auth-1', category: 'Authentication', item: 'Passwords hashed with bcrypt/Argon2id', status: 'pending' },
  { id: 'auth-2', category: 'Authentication', item: 'Minimum password length 12 characters', status: 'pending' },
  { id: 'auth-3', category: 'Authentication', item: 'MFA available for all users', status: 'pending' },
  { id: 'auth-4', category: 'Authentication', item: 'MFA mandatory for Super Admins', status: 'pending' },
  { id: 'auth-5', category: 'Authentication', item: 'Account lockout after 5 failed attempts', status: 'pending' },
  { id: 'auth-6', category: 'Authentication', item: 'Session timeout 30 minutes idle', status: 'pending' },
  { id: 'auth-7', category: 'Authentication', item: 'Concurrent session limit enforced', status: 'pending' },
  { id: 'auth-8', category: 'Authentication', item: 'Login events audited', status: 'pending' },
  
  { id: 'authz-1', category: 'Authorization', item: 'Every endpoint declares permission key', status: 'pending' },
  { id: 'authz-2', category: 'Authorization', item: 'Every query passes through scope helper', status: 'pending' },
  { id: 'authz-3', category: 'Authorization', item: 'IDOR protection on all fetch-by-id', status: 'pending' },
  { id: 'authz-4', category: 'Authorization', item: 'Mass-assignment protection on all endpoints', status: 'pending' },
  { id: 'authz-5', category: 'Authorization', item: 'Sensitive fields never leave server without permission', status: 'pending' },
  { id: 'authz-6', category: 'Authorization', item: 'Rate limits enforced per endpoint class', status: 'pending' },
  
  { id: 'data-1', category: 'Data Protection', item: 'TLS 1.3 minimum in transit', status: 'pending' },
  { id: 'data-2', category: 'Data Protection', item: 'Encryption at rest for database', status: 'pending' },
  { id: 'data-3', category: 'Data Protection', item: 'Application-level encryption for sensitive columns', status: 'pending' },
  { id: 'data-4', category: 'Data Protection', item: 'PII inventory documented', status: 'pending' },
  { id: 'data-5', category: 'Data Protection', item: 'Data retention policy enforced', status: 'pending' },
  { id: 'data-6', category: 'Data Protection', item: 'Backups encrypted', status: 'pending' },
  { id: 'data-7', category: 'Data Protection', item: 'Logs scrubbed of secrets and PII', status: 'pending' },
  
  { id: 'app-1', category: 'Application Security', item: 'Parameterized queries everywhere', status: 'pending' },
  { id: 'app-2', category: 'Application Security', item: 'Context-aware output encoding', status: 'pending' },
  { id: 'app-3', category: 'Application Security', item: 'Strict CSP with no unsafe-inline', status: 'pending' },
  { id: 'app-4', category: 'Application Security', item: 'Anti-CSRF tokens on state-changing requests', status: 'pending' },
  { id: 'app-5', category: 'Application Security', item: 'X-Frame-Options: DENY', status: 'pending' },
  { id: 'app-6', category: 'Application Security', item: 'File upload validation', status: 'pending' },
  { id: 'app-7', category: 'Application Security', item: 'No SSRF vulnerabilities', status: 'pending' },
  { id: 'app-8', category: 'Application Security', item: 'No path traversal vulnerabilities', status: 'pending' },
  { id: 'app-9', category: 'Application Security', item: 'Dependency vulnerability scanning', status: 'pending' },
  { id: 'app-10', category: 'Application Security', item: 'Secrets in secret manager', status: 'pending' },
  
  { id: 'audit-1', category: 'Audit & Immutability', item: 'Single audit system', status: 'pending' },
  { id: 'audit-2', category: 'Audit & Immutability', item: 'All critical events audited', status: 'pending' },
  { id: 'audit-3', category: 'Audit & Immutability', item: 'Audit rows append-only', status: 'pending' },
  { id: 'audit-4', category: 'Audit & Immutability', item: 'Audit records tamper-evident', status: 'pending' },
  { id: 'audit-5', category: 'Audit & Immutability', item: '7-year retention for financial audits', status: 'pending' },
  { id: 'audit-6', category: 'Audit & Immutability', item: 'Approved records immutable', status: 'pending' },
];
