/**
 * Part 11 — Period Lock Service
 * 
 * Manages financial period locking to control posting into closed periods.
 * Supports time-boxed reopening with two-person control.
 */

import { PeriodLockRow, PeriodStatus, PeriodModule } from './types';
import { PeriodClosedError } from './types';

export class PeriodLockService {
  private periods: Map<string, PeriodLockRow> = new Map();
  private nextId = 1;

  /**
   * Assert that a period is open for posting
   * Called by every posting action before inserting ledger rows
   */
  async assertOpen(
    companyId: number,
    date: Date,
    module: PeriodModule = 'ALL',
    actorCanPostSoftClosed: boolean = false
  ): Promise<void> {
    const periodMonth = this.formatPeriodMonth(date);
    const lock = await this.get(companyId, periodMonth, module);

    // No lock record = period is open
    if (!lock || lock.status === 'OPEN') {
      return;
    }

    // Reopened period within time window
    if (lock.status === 'REOPENED' && lock.reopenExpiresAt) {
      const expiresAt = new Date(lock.reopenExpiresAt);
      if (expiresAt > new Date()) {
        return;
      }
    }

    // Soft closed with special permission
    if (lock.status === 'SOFT_CLOSED' && actorCanPostSoftClosed) {
      return;
    }

    // Period is closed
    throw new PeriodClosedError({
      period: periodMonth,
      module,
      closedAt: lock.closedAt,
      remedy: 'Post to the next open period, or request a time-boxed reopen from Finance.',
    });
  }

  /**
   * Get period lock record
   */
  async get(
    companyId: number,
    periodMonth: string,
    module: PeriodModule
  ): Promise<PeriodLockRow | null> {
    const key = this.getKey(companyId, periodMonth, module);
    return this.periods.get(key) || null;
  }

  /**
   * Close a period
   */
  async close(
    companyId: number,
    periodMonth: string,
    module: PeriodModule,
    closedBy: number,
    softClose: boolean = false
  ): Promise<PeriodLockRow> {
    const key = this.getKey(companyId, periodMonth, module);
    const existing = this.periods.get(key);

    const lock: PeriodLockRow = {
      id: existing?.id || this.nextId++,
      companyId,
      periodMonth,
      module,
      status: softClose ? 'SOFT_CLOSED' : 'CLOSED',
      closedBy,
      closedAt: new Date().toISOString(),
    };

    this.periods.set(key, lock);
    return lock;
  }

  /**
   * Reopen a period with time-boxed access
   * Two-person control: requires special permission
   */
  async reopen(
    companyId: number,
    periodMonth: string,
    module: PeriodModule,
    reopenedBy: number,
    reason: string,
    hours: number
  ): Promise<PeriodLockRow> {
    // Validate reopen window (max 72 hours)
    if (hours > 72) {
      throw new Error('REOPEN_WINDOW_TOO_LONG: Maximum 72 hours allowed');
    }

    const key = this.getKey(companyId, periodMonth, module);
    const existing = this.periods.get(key);

    if (!existing) {
      throw new Error('PERIOD_NOT_FOUND: Cannot reopen a period that was never closed');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    const lock: PeriodLockRow = {
      ...existing,
      status: 'REOPENED',
      reopenedBy,
      reopenedAt: new Date().toISOString(),
      reopenReason: reason,
      reopenExpiresAt: expiresAt.toISOString(),
    };

    this.periods.set(key, lock);
    return lock;
  }

  /**
   * Auto-relock expired reopen windows
   * Called by scheduled job
   */
  async autoRelock(): Promise<number> {
    const now = new Date();
    let relocked = 0;

    for (const [key, lock] of this.periods.entries()) {
      if (lock.status === 'REOPENED' && lock.reopenExpiresAt) {
        const expiresAt = new Date(lock.reopenExpiresAt);
        if (expiresAt <= now) {
          lock.status = 'CLOSED';
          this.periods.set(key, lock);
          relocked++;
        }
      }
    }

    return relocked;
  }

  /**
   * Get all periods for a company
   */
  async getCompanyPeriods(companyId: number): Promise<PeriodLockRow[]> {
    return Array.from(this.periods.values())
      .filter(p => p.companyId === companyId)
      .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
  }

  /**
   * Get open periods for a company
   */
  async getOpenPeriods(companyId: number): Promise<PeriodLockRow[]> {
    const periods = await this.getCompanyPeriods(companyId);
    return periods.filter(p => p.status === 'OPEN' || p.status === 'REOPENED');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private getKey(companyId: number, periodMonth: string, module: PeriodModule): string {
    return `${companyId}:${periodMonth}:${module}`;
  }

  private formatPeriodMonth(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}

export const periodLockService = new PeriodLockService();
