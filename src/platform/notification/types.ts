/**
 * Part 25 — Notification & Automation Engine Types
 * 
 * Defines the notification model with multi-channel delivery,
 * preferences, templates, and automation rules.
 */

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type NotificationCategory = 
  | 'APPROVAL'    // Approval requests, decisions
  | 'TASK'        // Task assignments, reminders, completions
  | 'ALERT'       // System alerts, exceptions, escalations
  | 'MENTION'     // @mentions in comments
  | 'SYSTEM'      // System notifications (permission changes, maintenance)
  | 'DIGEST';     // Batched notifications (daily/weekly summaries)

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type NotificationChannel = 
  | 'IN_APP'     // In-application notification
  | 'PUSH'       // Mobile push notification
  | 'EMAIL'      // Email notification
  | 'SMS'        // SMS notification (CRITICAL only)
  | 'WHATSAPP';  // WhatsApp notification (if integrated)

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export type NotificationFrequency = 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION MODEL
// ═══════════════════════════════════════════════════════════════════════════

export interface Notification {
  id: number;
  userId: number;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  actionRoute?: string;           // Deep link with project context
  projectId?: number;
  isRead: boolean;
  readAt?: string;
  isActioned: boolean;
  createdAt: string;
  expiresAt?: string;
  groupKey?: string;              // For collapsing similar notifications
  groupCount: number;             // Number of notifications in group
  templateCode?: string;          // Template used for rendering
  templateVars?: Record<string, any>;
}

export interface NotificationDelivery {
  id: number;
  notificationId: number;
  channel: NotificationChannel;
  status: NotificationStatus;
  attempts: number;
  sentAt?: string;
  error?: string;
  externalId?: string;            // External message ID (e.g., email message ID)
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationPreferences {
  id: number;
  userId: number;
  category: NotificationCategory;
  inApp: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
  frequency: NotificationFrequency;
  quietStart?: string;            // HH:MM format
  quietEnd?: string;              // HH:MM format
  quietTimezone?: string;         // e.g., 'Asia/Kolkata'
  projectMute?: number[];         // Array of project IDs to mute
  criticalOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  category: NotificationCategory;
  inApp?: boolean;
  push?: boolean;
  email?: boolean;
  sms?: boolean;
  frequency?: NotificationFrequency;
  quietStart?: string;
  quietEnd?: string;
  quietTimezone?: string;
  projectMute?: number[];
  criticalOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationTemplate {
  id: number;
  templateCode: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  subject?: string;               // For email
  titleTemplate: string;          // Supports {{variables}}
  bodyTemplate?: string;          // Supports {{variables}}
  language: string;               // e.g., 'en', 'hi'
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  templateCode: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  subject?: string;
  titleTemplate: string;
  bodyTemplate?: string;
  language?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATION RULES
// ═══════════════════════════════════════════════════════════════════════════

export type AutomationTriggerType = 
  | 'REMINDER'      // Time-based reminders
  | 'ESCALATION'    // Escalation after timeout
  | 'DEADLINE'      // Deadline monitoring
  | 'AUTO_ACTION';  // Automated actions (auto-approve, auto-close, etc.)

export type AutomationActionType = 
  | 'NOTIFY'           // Send notification
  | 'ESCALATE'         // Escalate to supervisor
  | 'AUTO_APPROVE'     // Auto-approve (financial/statutory excluded)
  | 'AUTO_CLOSE'       // Auto-close task/exception
  | 'AUTO_REASSIGN';   // Auto-reassign task

export interface AutomationRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  triggerType: AutomationTriggerType;
  triggerEvent?: string;          // Event type that triggers this rule
  conditionExpr?: string;         // Sandboxed expression over event payload
  actionType: AutomationActionType;
  actionConfig: Record<string, any>;
  targetRule?: any;               // ApproverRule for determining target
  scheduleExpr?: string;          // Cron expression for scheduled rules
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationRuleRequest {
  ruleCode: string;
  ruleName: string;
  triggerType: AutomationTriggerType;
  triggerEvent?: string;
  conditionExpr?: string;
  actionType: AutomationActionType;
  actionConfig: Record<string, any>;
  targetRule?: any;
  scheduleExpr?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION REQUEST
// ═══════════════════════════════════════════════════════════════════════════

export interface SendNotificationRequest {
  userId: number;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  actionRoute?: string;
  projectId?: number;
  templateCode?: string;
  templateVars?: Record<string, any>;
  channels?: NotificationChannel[];  // Override user preferences
  groupKey?: string;
  expiresAt?: string;
}

export interface SendBulkNotificationRequest {
  userIds: number[];
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: number;
  actionRoute?: string;
  projectId?: number;
  templateCode?: string;
  templateVars?: Record<string, any>;
  channels?: NotificationChannel[];
  groupKey?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION FILTERS
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationFilters {
  category?: NotificationCategory;
  priority?: NotificationPriority;
  isRead?: boolean;
  isActioned?: boolean;
  projectId?: number;
  entityType?: string;
  dateRange?: { from?: string; to?: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface NotificationStatistics {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  byChannel: Record<NotificationChannel, { sent: number; failed: number }>;
  deliveryRate: number;           // Percentage
  averageResponseTime: number;    // Hours
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS RULES
// ═══════════════════════════════════════════════════════════════════════════

export const NOTIFICATION_BUSINESS_RULES = {
  NOTIF_01: 'A notification is permission-filtered. A user is never told about a document they could not open.',
  NOTIF_02: 'Delivery is triggered by a committed event, never from inside a transaction.',
  NOTIF_03: 'Reminders are rate-limited per user per day and digested where a user has more than five pending items.',
  NOTIF_04: 'Every notification carries a deep link that lands on the record with the right project context already applied.',
  NOTIF_05: 'A notification type with no opt-out and no digest rule will be muted by users within a month.',
  AUTO_01: 'An automated action that changes data is logged as an automated action with its rule and its justification.',
};

// ═══════════════════════════════════════════════════════════════════════════
// ANTI-SPAM RULES
// ═══════════════════════════════════════════════════════════════════════════

export const ANTI_SPAM_RULES = {
  GROUP_SIMILAR: 'Five POs awaiting the same approver become one notification: "5 purchase orders awaiting your approval".',
  COLLAPSE_REPEATS: 'The same alert for the same entity within its cooldown updates the existing notification timestamp.',
  NO_SELF_NOTIFY: 'Do not notify the actor about their own action.',
  DIGEST_DEFAULT: 'Digest by default for anything informational.',
  RATE_LIMIT: 'No more than 10 push notifications per user per hour except CRITICAL.',
  AUTO_EXPIRE: 'A notification about a document that has since been approved by someone else is marked actioned automatically.',
  ESCALATION_NOT_REPEAT: 'When an item escalates, notify the escalation target, and inform the original assignee once.',
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_PREFERENCES: Record<NotificationCategory, Partial<NotificationPreferences>> = {
  APPROVAL: {
    inApp: true,
    push: true,
    email: true,
    sms: false,
    frequency: 'IMMEDIATE',
    criticalOnly: false,
  },
  TASK: {
    inApp: true,
    push: true,
    email: false,
    sms: false,
    frequency: 'IMMEDIATE',
    criticalOnly: false,
  },
  ALERT: {
    inApp: true,
    push: true,
    email: true,
    sms: false,
    frequency: 'IMMEDIATE',
    criticalOnly: false,
  },
  MENTION: {
    inApp: true,
    push: true,
    email: false,
    sms: false,
    frequency: 'IMMEDIATE',
    criticalOnly: false,
  },
  SYSTEM: {
    inApp: true,
    push: false,
    email: false,
    sms: false,
    frequency: 'IMMEDIATE',
    criticalOnly: false,
  },
  DIGEST: {
    inApp: false,
    push: false,
    email: true,
    sms: false,
    frequency: 'DAILY',
    criticalOnly: false,
  },
};
