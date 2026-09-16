/**
 * Universal Home Component - Part 6
 * 
 * The home page that every user sees, regardless of role.
 * Contains "My Work" section, attention alerts, and role-specific content.
 */

import { useState } from 'react';
import { CheckSquare, Clock, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { myWorkCounts, attentionAlerts } from '../data/dashboardData';
import type { MyWorkCounts, AttentionAlert } from '../types/dashboard';

interface UniversalHomeProps {
  roleContent?: React.ReactNode;
}

export default function UniversalHome({ roleContent }: UniversalHomeProps) {
  return (
    <div className="space-y-6">
      {/* My Work Section */}
      <MyWorkSection counts={myWorkCounts} />

      {/* Attention Alerts */}
      <AttentionAlertsSection alerts={attentionAlerts} />

      {/* Role-Specific Content */}
      {roleContent && (
        <div className="mt-8">
          {roleContent}
        </div>
      )}
    </div>
  );
}

// ─── My Work Section ─────────────────────────────────────────────────────────

function MyWorkSection({ counts }: { counts: MyWorkCounts }) {
  const items = [
    {
      label: 'My Approvals Pending',
      value: counts.approvalsPending,
      icon: CheckSquare,
      color: 'var(--sapInformativeColor)',
      bgColor: 'var(--sapInformationBackground)',
      route: '/approvals?pending=true',
    },
    {
      label: 'My Tasks Due',
      value: counts.tasksDue,
      icon: Clock,
      color: 'var(--sapCriticalColor)',
      bgColor: 'var(--sapWarningBackground)',
      route: '/tasks?due=true',
    },
    {
      label: 'My Overdue Items',
      value: counts.overdueItems,
      icon: AlertTriangle,
      color: 'var(--sapNegativeColor)',
      bgColor: 'var(--sapErrorBackground)',
      route: '/tasks?overdue=true',
    },
    {
      label: 'My Draft Documents',
      value: counts.draftDocuments,
      icon: FileText,
      color: 'var(--sapNeutralColor)',
      bgColor: 'var(--sapNeutralBackground)',
      route: '/documents?status=draft',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        My Work
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.route}
              className="sap-card p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: item.bgColor }}
                >
                  <Icon size={20} style={{ color: item.color }} />
                </div>
                <ChevronRight size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                {item.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {item.label}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Attention Alerts Section ────────────────────────────────────────────────

function AttentionAlertsSection({ alerts }: { alerts: AttentionAlert[] }) {
  const severityColors = {
    critical: {
      border: 'var(--sapNegativeBorderColor)',
      bg: 'var(--sapErrorBackground)',
      text: 'var(--sapNegativeTextColor)',
    },
    high: {
      border: 'var(--sapCriticalBorderColor)',
      bg: 'var(--sapWarningBackground)',
      text: 'var(--sapCriticalTextColor)',
    },
    medium: {
      border: 'var(--sapInformativeBorderColor)',
      bg: 'var(--sapInformationBackground)',
      text: 'var(--sapInformativeTextColor)',
    },
    low: {
      border: 'var(--sapNeutralBorderColor)',
      bg: 'var(--sapNeutralBackground)',
      text: 'var(--sapNeutralTextColor)',
    },
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Attention Required
      </h2>
      <div className="sap-card overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--sapContent_LabelColor)' }}>
            No alerts at this time
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            {alerts.map((alert) => {
              const colors = severityColors[alert.severity];
              return (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-[var(--sapList_Hover_Background)] transition-colors"
                  style={{ borderLeft: `3px solid ${colors.border}` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium uppercase"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                          {alert.title}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {alert.message}
                      </p>
                      <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {new Date(alert.raisedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <a
                      href={alert.actionRoute}
                      className="px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
                      style={{
                        background: 'var(--sapButton_Emphasized_Background)',
                        color: 'var(--sapButton_Emphasized_TextColor)',
                      }}
                    >
                      {alert.actionLabel}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
