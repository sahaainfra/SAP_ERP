/**
 * Part 23 — Notification Centre Service
 * 
 * Manages the unified notification system:
 * - Fetch and filter notifications
 * - Mark as read (single or bulk)
 * - Group similar notifications
 * - Manage preferences (channels, quiet hours)
 * - Escalation notifications
 */

import {
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  NotificationGroup,
} from './types';
import { Actor } from '../permission/actor';

export interface NotificationFilters {
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  projectId?: number;
  dateRange?: { from?: string; to?: string };
}

export class NotificationCentreService {
  private notifications: Map<number, Notification> = new Map();
  private preferences: Map<number, NotificationPreferences> = new Map();
  private nextNotificationId = 1;

  /**
   * Get notifications for current user
   */
  async getNotifications(
    actor: Actor,
    filters: NotificationFilters = {},
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ notifications: Notification[]; total: number }> {
    // In production, would query dx_notification with permission filtering
    // For demo, return mock data
    const allNotifications = await this.mockFetchNotifications(actor, filters);
    
    // Group similar notifications
    const grouped = this.groupNotifications(allNotifications);
    
    // Paginate
    const start = (page - 1) * pageSize;
    const paginated = grouped.slice(start, start + pageSize);
    
    return {
      notifications: paginated,
      total: grouped.length,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, actor: Actor): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (notification.userId !== actor.userId) {
      throw new Error('Not authorized to mark this notification');
    }

    notification.status = 'READ';
    notification.readAt = new Date().toISOString();
  }

  /**
   * Mark multiple notifications as read
   */
  async markBulkAsRead(notificationIds: number[], actor: Actor): Promise<void> {
    for (const id of notificationIds) {
      await this.markAsRead(id, actor);
    }
  }

  /**
   * Get notification preferences for user
   */
  async getPreferences(userId: number): Promise<NotificationPreferences> {
    return this.preferences.get(userId) || {
      userId,
      channels: {
        inApp: true,
        email: true,
        push: true,
        sms: false,
      },
      quietHours: {
        start: '22:00',
        end: '07:00',
        timezone: 'Asia/Kolkata',
      },
      digestThreshold: 5,
      escalationNotify: true,
    };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: NotificationPreferences,
    actor: Actor
  ): Promise<void> {
    if (preferences.userId !== actor.userId) {
      throw new Error('Not authorized to update these preferences');
    }

    this.preferences.set(preferences.userId, preferences);
  }

  /**
   * Send a notification
   */
  async sendNotification(
    userId: number,
    channel: NotificationChannel,
    priority: NotificationPriority,
    title: string,
    message: string,
    entityType?: string,
    entityId?: number,
    projectId?: number
  ): Promise<Notification> {
    // Check user preferences
    const prefs = await this.getPreferences(userId);
    
    // Check if channel is enabled
    const channelEnabled = 
      (channel === 'IN_APP' && prefs.channels.inApp) ||
      (channel === 'EMAIL' && prefs.channels.email) ||
      (channel === 'PUSH' && prefs.channels.push) ||
      (channel === 'SMS' && prefs.channels.sms);
    
    if (!channelEnabled) {
      throw new Error(`Channel ${channel} is disabled for user ${userId}`);
    }

    // Check quiet hours (except for CRITICAL)
    if (priority !== 'CRITICAL' && this.isInQuietHours(prefs)) {
      // Queue for delivery after quiet hours
      console.log(`[Notification] Queued for user ${userId} (quiet hours)`);
    }

    // Check rate limit (10/hour except CRITICAL)
    if (priority !== 'CRITICAL' && await this.isRateLimited(userId)) {
      throw new Error('Rate limit exceeded: maximum 10 notifications per hour');
    }

    const notification: Notification = {
      id: this.nextNotificationId++,
      channel,
      priority,
      status: 'UNREAD',
      title,
      message,
      userId,
      entityType,
      entityId,
      entityRoute: entityId && entityType ? this.getEntityRoute(entityType, entityId) : undefined,
      projectId,
      createdAt: new Date().toISOString(),
    };

    this.notifications.set(notification.id, notification);

    // Deliver based on channel
    await this.deliverNotification(notification, prefs);

    return notification;
  }

  /**
   * Send escalation notification
   */
  async sendEscalationNotification(
    originalAssigneeId: number,
    escalationToken: number,
    taskId: number,
    taskTitle: string
  ): Promise<void> {
    // Notify the escalation target
    await this.sendNotification(
      escalationToken,
      'IN_APP',
      'HIGH',
      'Escalation: Task requires attention',
      `Task "${taskTitle}" has been escalated to you`,
      'task',
      taskId
    );

    // Inform original assignee
    await this.sendNotification(
      originalAssigneeId,
      'IN_APP',
      'MEDIUM',
      'Task escalated',
      `Your task "${taskTitle}" has been escalated`,
      'task',
      taskId
    );
  }

  /**
   * Auto-expire notifications when underlying item is resolved
   */
  async autoExpireNotifications(entityType: string, entityId: number): Promise<number> {
    let expired = 0;
    
    for (const notification of this.notifications.values()) {
      if (notification.entityType === entityType && notification.entityId === entityId) {
        if (notification.status === 'UNREAD') {
          notification.status = 'ARCHIVED';
          notification.expiresAt = new Date().toISOString();
          expired++;
        }
      }
    }
    
    return expired;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async mockFetchNotifications(
    actor: Actor,
    filters: NotificationFilters
  ): Promise<Notification[]> {
    // Mock data
    const notifications: Notification[] = [
      {
        id: 1,
        channel: 'IN_APP',
        priority: 'HIGH',
        status: 'UNREAD',
        title: 'New approval pending',
        message: 'PO-2026-000412 requires your approval',
        userId: actor.userId,
        entityType: 'purchase_order',
        entityId: 412,
        entityRoute: '/procurement/po/412',
        projectId: 7,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        actions: [
          { label: 'Review', route: '/approvals/412', primary: true },
          { label: 'View PO', route: '/procurement/po/412', primary: false },
        ],
      },
      {
        id: 2,
        channel: 'IN_APP',
        priority: 'CRITICAL',
        status: 'UNREAD',
        title: 'Budget exceeded',
        message: 'Project Metro Corridor IV has exceeded budget by 3%',
        userId: actor.userId,
        entityType: 'project',
        entityId: 7,
        entityRoute: '/projects/7',
        projectId: 7,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actions: [
          { label: 'View Details', route: '/exceptions/1', primary: true },
        ],
      },
      {
        id: 3,
        channel: 'EMAIL',
        priority: 'MEDIUM',
        status: 'READ',
        title: 'Task assigned',
        message: 'You have been assigned a new task: Review vendor performance',
        userId: actor.userId,
        entityType: 'task',
        entityId: 3,
        entityRoute: '/tasks/3',
        projectId: 8,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        readAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        channel: 'PUSH',
        priority: 'HIGH',
        status: 'UNREAD',
        title: 'Negative stock alert',
        message: 'Store Reach 2 has negative stock for TMT 12mm steel',
        userId: actor.userId,
        entityType: 'stock_item',
        entityId: 4521,
        entityRoute: '/store/stock/4521',
        projectId: 7,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        actions: [
          { label: 'View Stock', route: '/store/stock/4521', primary: true },
          { label: 'Raise MR', route: '/procurement/mr/new', primary: false },
        ],
      },
      {
        id: 5,
        channel: 'IN_APP',
        priority: 'LOW',
        status: 'UNREAD',
        title: 'System update',
        message: 'System maintenance scheduled for tonight at 11 PM',
        userId: actor.userId,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Apply filters
    let filtered = notifications.filter(n => n.userId === actor.userId);
    
    if (filters.channel) {
      filtered = filtered.filter(n => n.channel === filters.channel);
    }
    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }
    if (filters.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }
    if (filters.projectId) {
      filtered = filtered.filter(n => n.projectId === filters.projectId);
    }

    return filtered;
  }

  private groupNotifications(notifications: Notification[]): Notification[] {
    // Group by template code and user
    const groups = new Map<string, Notification[]>();
    
    for (const notification of notifications) {
      const key = notification.templateCode || notification.title;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    }

    // Convert groups to notification objects with groupCount
    const result: Notification[] = [];
    for (const [key, group] of groups.entries()) {
      if (group.length === 1) {
        result.push(group[0]);
      } else {
        // Create a grouped notification
        const latest = group.reduce((a, b) => 
          new Date(a.createdAt) > new Date(b.createdAt) ? a : b
        );
        result.push({
          ...latest,
          groupId: key,
          groupCount: group.length,
          summary: `${group.length} ${latest.title.toLowerCase()}s`,
        });
      }
    }

    return result;
  }

  private isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHours) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { start, end } = prefs.quietHours;
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Crosses midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  private async isRateLimited(userId: number): Promise<boolean> {
    // Check if user has received more than 10 notifications in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    let count = 0;
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && new Date(notification.createdAt) > oneHourAgo) {
        count++;
      }
    }
    
    return count >= 10;
  }

  private async deliverNotification(notification: Notification, prefs: NotificationPreferences): Promise<void> {
    // In production, would integrate with email service, push notification service, SMS gateway
    console.log(`[Notification] Delivered ${notification.channel} to user ${notification.userId}: ${notification.title}`);
  }

  private getEntityRoute(entityType: string, entityId: number): string {
    const routes: Record<string, string> = {
      purchase_order: `/procurement/po/${entityId}`,
      project: `/projects/${entityId}`,
      task: `/tasks/${entityId}`,
      stock_item: `/store/stock/${entityId}`,
      invoice: `/billing/invoices/${entityId}`,
    };
    return routes[entityType] || '/';
  }
}

export const notificationCentreService = new NotificationCentreService();
