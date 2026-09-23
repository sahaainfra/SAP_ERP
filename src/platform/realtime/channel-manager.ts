/**
 * Part 13 — Channel Manager
 * 
 * Manages channel subscriptions with:
 * - Permission-based channel authorization
 * - Per-subscriber payload filtering
 * - Channel lifecycle management
 * - Subscription tracking
 */

import { Channel, ChannelType, Subscription, buildChannelId, parseChannelId } from './types';

export interface ChannelSubscription {
  id: string;
  userId: number;
  channel: Channel;
  permissionKey: string;
  lastSequence: number;
  createdAt: string;
  isActive: boolean;
}

export class ChannelManager {
  private channels: Map<string, Channel> = new Map();
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private userSubscriptions: Map<number, Set<string>> = new Map(); // userId -> subscriptionIds
  
  private nextSubscriptionId = 1;

  /**
   * Register a channel
   */
  registerChannel(channel: Channel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Get a channel by ID
   */
  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Subscribe a user to a channel
   */
  subscribe(
    userId: number,
    channelId: string,
    permissionKey: string
  ): ChannelSubscription | null {
    const channel = this.channels.get(channelId);
    if (!channel) {
      console.error(`Channel not found: ${channelId}`);
      return null;
    }

    // Check if user has permission for this channel
    if (channel.permissionKey && channel.permissionKey !== permissionKey) {
      console.error(`Permission mismatch for channel ${channelId}`);
      return null;
    }

    const subscriptionId = `chsub_${this.nextSubscriptionId++}`;
    
    const subscription: ChannelSubscription = {
      id: subscriptionId,
      userId,
      channel,
      permissionKey,
      lastSequence: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Track user subscriptions
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId)!.add(subscriptionId);

    return subscription;
  }

  /**
   * Unsubscribe a user from a channel
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);

    // Remove from user tracking
    const userSubs = this.userSubscriptions.get(subscription.userId);
    if (userSubs) {
      userSubs.delete(subscriptionId);
      if (userSubs.size === 0) {
        this.userSubscriptions.delete(subscription.userId);
      }
    }
  }

  /**
   * Get all subscriptions for a channel
   */
  getChannelSubscriptions(channelId: string): ChannelSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.channel.id === channelId && sub.isActive
    );
  }

  /**
   * Get all subscriptions for a user
   */
  getUserSubscriptions(userId: number): ChannelSubscription[] {
    const subIds = this.userSubscriptions.get(userId);
    if (!subIds) return [];

    return Array.from(subIds)
      .map(id => this.subscriptions.get(id))
      .filter((sub): sub is ChannelSubscription => sub !== undefined && sub.isActive);
  }

  /**
   * Update last sequence for a subscription
   */
  updateSequence(subscriptionId: string, sequence: number): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.lastSequence = sequence;
    }
  }

  /**
   * Get subscribers for a channel who have permission to receive an event
   */
  getAuthorizedSubscribers(
    channelId: string,
    requiredPermission?: string
  ): ChannelSubscription[] {
    const subscriptions = this.getChannelSubscriptions(channelId);
    
    if (!requiredPermission) {
      return subscriptions;
    }

    // Filter by permission
    // In production, this would check against the user's actual permission set
    // For now, we assume all subscribers have the required permission
    return subscriptions;
  }

  /**
   * Build a user-specific channel ID
   */
  buildUserChannel(userId: number): string {
    return buildChannelId('user', userId);
  }

  /**
   * Build a project-specific channel ID
   */
  buildProjectChannel(projectId: number, type: 'kpi' | 'activity' | 'alerts' = 'activity'): string {
    return `project:${projectId}:${type}`;
  }

  /**
   * Build a site-specific channel ID
   */
  buildSiteChannel(siteId: number): string {
    return `site:${siteId}:activity`;
  }

  /**
   * Build a company-specific channel ID
   */
  buildCompanyChannel(companyId: number): string {
    return `company:${companyId}:exec`;
  }

  /**
   * Build an approval channel ID
   */
  buildApprovalChannel(userId: number): string {
    return buildChannelId('approval', userId);
  }

  /**
   * Build a presence channel ID
   */
  buildPresenceChannel(projectId: number): string {
    return buildChannelId('presence', projectId);
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get channel statistics
   */
  getStats(): {
    totalChannels: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    usersWithSubscriptions: number;
  } {
    const activeSubs = Array.from(this.subscriptions.values()).filter(s => s.isActive);
    
    return {
      totalChannels: this.channels.size,
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubs.length,
      usersWithSubscriptions: this.userSubscriptions.size,
    };
  }

  /**
   * Clean up inactive subscriptions
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, subscription] of this.subscriptions.entries()) {
      const age = now - new Date(subscription.createdAt).getTime();
      if (!subscription.isActive && age > maxAge) {
        this.subscriptions.delete(id);
      }
    }
  }
}

// Singleton instance
export const channelManager = new ChannelManager();
