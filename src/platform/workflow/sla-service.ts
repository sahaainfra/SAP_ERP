/**
 * Part 10 — SLA Service
 * 
 * Calculates due dates based on working calendars.
 * Supports project-specific working days and holidays.
 */

import { WorkingCalendar } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// SLA SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class SlaService {
  private calendars: Map<string, WorkingCalendar> = new Map();

  /**
   * Register a working calendar
   */
  registerCalendar(calendar: WorkingCalendar): void {
    const key = this.getCalendarKey(calendar.scopeType, calendar.scopeId);
    this.calendars.set(key, calendar);
  }

  /**
   * Calculate due date based on SLA hours and working calendar
   */
  calculateDueDate(from: Date, slaHours: number, projectId?: number): Date {
    const calendar = this.getCalendarForProject(projectId);
    
    let remaining = slaHours;
    let cursor = new Date(from);

    while (remaining > 0) {
      // Move to next working moment if needed
      cursor = this.nextWorkingMoment(cursor, calendar);

      // Calculate available hours in this day
      const available = this.hoursRemainingInDay(cursor, calendar);
      const use = Math.min(available, remaining);

      // Advance cursor
      cursor = new Date(cursor.getTime() + use * 60 * 60 * 1000);
      remaining -= use;

      // If we've used all hours in this day, move to next day
      if (remaining > 0) {
        cursor = this.startOfNextWorkingDay(cursor, calendar);
      }
    }

    return cursor;
  }

  /**
   * Get the next working moment (skips non-working hours)
   */
  private nextWorkingMoment(date: Date, calendar: WorkingCalendar): Date {
    const cursor = new Date(date);

    // Check if this is a working day
    while (!this.isWorkingDay(cursor, calendar)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
    }

    // Check if we're before working hours
    const workStart = this.parseTime(calendar.workingHours.start);
    const workEnd = this.parseTime(calendar.workingHours.end);
    const currentMinutes = cursor.getHours() * 60 + cursor.getMinutes();

    if (currentMinutes < workStart) {
      // Before working hours - move to start of day
      cursor.setHours(Math.floor(workStart / 60), workStart % 60, 0, 0);
    } else if (currentMinutes >= workEnd) {
      // After working hours - move to next working day
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      return this.nextWorkingMoment(cursor, calendar);
    }

    return cursor;
  }

  /**
   * Calculate hours remaining in the current working day
   */
  private hoursRemainingInDay(date: Date, calendar: WorkingCalendar): number {
    const workEnd = this.parseTime(calendar.workingHours.end);
    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const remainingMinutes = workEnd - currentMinutes;
    return Math.max(0, remainingMinutes / 60);
  }

  /**
   * Get the start of the next working day
   */
  private startOfNextWorkingDay(date: Date, calendar: WorkingCalendar): Date {
    const cursor = new Date(date);
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(0, 0, 0, 0);

    // Find next working day
    while (!this.isWorkingDay(cursor, calendar)) {
      cursor.setDate(cursor.getDate() + 1);
    }

    // Set to start of working hours
    const workStart = this.parseTime(calendar.workingHours.start);
    cursor.setHours(Math.floor(workStart / 60), workStart % 60, 0, 0);

    return cursor;
  }

  /**
   * Check if a date is a working day
   */
  private isWorkingDay(date: Date, calendar: WorkingCalendar): boolean {
    // Check if it's a holiday
    const dateStr = date.toISOString().split('T')[0];
    if (calendar.holidays?.some(h => h.date === dateStr)) {
      return false;
    }

    // Check if it's a working day of the week
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const workingDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Monday, 7=Sunday
    return calendar.workingDays.includes(workingDay);
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get the working calendar for a project
   */
  private getCalendarForProject(projectId?: number): WorkingCalendar {
    // Try project-specific calendar first
    if (projectId) {
      const projectCalendar = this.calendars.get(this.getCalendarKey('PROJECT', projectId));
      if (projectCalendar) return projectCalendar;
    }

    // Fall back to global calendar
    const globalCalendar = this.calendars.get(this.getCalendarKey('GLOBAL'));
    if (globalCalendar) return globalCalendar;

    // Return default calendar (Mon-Fri, 9-6)
    return {
      id: 0,
      calendarName: 'Default',
      scopeType: 'GLOBAL',
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      workingHours: { start: '09:00', end: '18:00' },
      isActive: true,
    };
  }

  /**
   * Get calendar key for lookup
   */
  private getCalendarKey(scopeType: string, scopeId?: number): string {
    return scopeId ? `${scopeType}:${scopeId}` : scopeType;
  }

  /**
   * Calculate overdue duration
   */
  calculateOverdue(dueAt: Date, now: Date): string {
    if (now <= dueAt) return '';

    const diffMs = now.getTime() - dueAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    }
    return `${diffHours}h`;
  }
}

export const slaService = new SlaService();

// Register default calendar
slaService.registerCalendar({
  id: 1,
  calendarName: 'Standard Business Hours',
  scopeType: 'GLOBAL',
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  workingHours: { start: '09:00', end: '18:00' },
  isActive: true,
});
