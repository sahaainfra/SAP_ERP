/**
 * Project 360 Component - Part 6
 * 
 * Comprehensive view of a single project with all key metrics,
 * health score, and drill-down capabilities.
 */

import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, 
  FileText, HardHat, ShoppingCart, Package, Users, 
  Truck, CheckCircle, Shield, DollarSign, Landmark,
  AlertTriangle, ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';
import { project360Data } from '../data/dashboardData';
import type { Project360Data, Project360Section } from '../types/dashboard';
import type { KpiDefinition } from '../types/realtime';
import KpiCardV2 from './KpiCardV2';

// Helper to create mock KPI definitions for Project 360
function createMockDefinition(kpiKey: string): KpiDefinition {
  return {
    id: Math.floor(Math.random() * 1000),
    kpiKey,
    kpiName: kpiKey.split('.').pop() || kpiKey,
    module: kpiKey.split('.')[0] || 'project',
    calculationType: 'SUM',
    valueType: 'COUNT',
    aggregationLevel: 'PROJECT',
    goodDirection: 'UP',
    thresholdType: 'PERCENT_OF_TARGET',
    refreshStrategy: 'EVENT',
    cacheTtlS: 300,
    requiredPermission: 'project.view',
    isActive: true,
  };
}

export default function Project360() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['contract', 'execution']));

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const { header, healthScore, sections } = project360Data;

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <ProjectHeader data={header} />

      {/* Health Score */}
      <HealthScoreSection healthScore={healthScore} />

      {/* Project Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <ProjectSection
            key={section.key}
            section={section}
            isExpanded={expandedSections.has(section.key)}
            onToggle={() => toggleSection(section.key)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Project Header ──────────────────────────────────────────────────────────

function ProjectHeader({ data }: { data: Project360Data['header'] }) {
  const statusColors = {
    active: { bg: 'var(--sapSuccessBackground)', text: 'var(--sapPositiveTextColor)', border: 'var(--sapSuccessBorderColor)' },
    on_hold: { bg: 'var(--sapWarningBackground)', text: 'var(--sapCriticalTextColor)', border: 'var(--sapWarningBorderColor)' },
    completed: { bg: 'var(--sapInformationBackground)', text: 'var(--sapInformativeTextColor)', border: 'var(--sapInformationBorderColor)' },
    cancelled: { bg: 'var(--sapErrorBackground)', text: 'var(--sapNegativeTextColor)', border: 'var(--sapErrorBorderColor)' },
  };

  const statusColor = statusColors[data.status as keyof typeof statusColors] || statusColors.active;

  return (
    <div className="sap-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
              {data.projectName}
            </h1>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}
            >
              {data.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {data.projectCode} • {data.client} • {data.location}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Project Manager
          </div>
          <div className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            {data.projectManager}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Contract Value
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
            ₹{(data.contractValue / 10000000).toFixed(2)} Cr
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Revised Value
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
            ₹{(data.revisedValue / 10000000).toFixed(2)} Cr
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Duration
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {data.daysElapsed} / {data.daysElapsed + data.daysRemaining} days
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Timeline
          </div>
          <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
            {new Date(data.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(data.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Health Score Section ────────────────────────────────────────────────────

function HealthScoreSection({ healthScore }: { healthScore: Project360Data['healthScore'] }) {
  const bandColors = {
    Healthy: { bg: 'var(--sapSuccessBackground)', text: 'var(--sapPositiveTextColor)', border: 'var(--sapSuccessBorderColor)' },
    Watch: { bg: 'var(--sapWarningBackground)', text: 'var(--sapCriticalTextColor)', border: 'var(--sapWarningBorderColor)' },
    'At Risk': { bg: 'var(--sapErrorBackground)', text: 'var(--sapNegativeTextColor)', border: 'var(--sapErrorBorderColor)' },
    Critical: { bg: 'var(--sapErrorBackground)', text: 'var(--sapNegativeTextColor)', border: 'var(--sapErrorBorderColor)' },
  };

  const bandColor = bandColors[healthScore.band];

  return (
    <div className="sap-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
          Project Health Score
        </h2>
        <span
          className="px-4 py-2 rounded-full text-sm font-bold"
          style={{ background: bandColor.bg, color: bandColor.text, border: `1px solid ${bandColor.border}` }}
        >
          {healthScore.band}
        </span>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-8 mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--sapProgress_Background)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={bandColor.text}
              strokeWidth="3"
              strokeDasharray={`${healthScore.overall}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {healthScore.overall}
              </div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                / 100
              </div>
            </div>
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="flex-1 grid grid-cols-3 gap-3">
          {healthScore.components.map((component) => {
            const statusColor = component.status === 'good' 
              ? 'var(--sapPositiveColor)' 
              : component.status === 'warning' 
              ? 'var(--sapCriticalColor)' 
              : 'var(--sapNegativeColor)';

            return (
              <a
                key={component.name}
                href={component.drillRoute}
                className="p-3 rounded-lg hover:bg-[var(--sapList_Hover_Background)] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {component.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {component.weight}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${component.score}%`, background: statusColor }}
                    />
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {component.score}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
          Health Score Trend (Last 6 Months)
        </div>
        <div className="flex items-end gap-2 h-20">
          {healthScore.trend.map((point, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${point.score}%`,
                  background: point.score >= 80 ? 'var(--sapPositiveColor)' : point.score >= 60 ? 'var(--sapCriticalColor)' : 'var(--sapNegativeColor)',
                }}
              />
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {point.period.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Project Section ─────────────────────────────────────────────────────────

function ProjectSection({ 
  section, 
  isExpanded, 
  onToggle 
}: { 
  section: Project360Section;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const iconMap: Record<string, any> = {
    'file-text': FileText,
    'hard-hat': HardHat,
    'shopping-cart': ShoppingCart,
    'package': Package,
    'users': Users,
    'truck': Truck,
    'check-circle': CheckCircle,
    'shield': Shield,
    'dollar-sign': DollarSign,
    'landmark': Landmark,
  };

  const Icon = iconMap[section.icon] || FileText;

  return (
    <div className="sap-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--sapList_Hover_Background)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: 'var(--sapAccentBackgroundColor6)' }}>
            <Icon size={20} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            {section.title}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} style={{ color: 'var(--sapContent_LabelColor)' }} />
        ) : (
          <ChevronDown size={20} style={{ color: 'var(--sapContent_LabelColor)' }} />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {section.kpis.map((kpi) => (
              <KpiCardV2
                key={kpi.kpiKey}
                value={kpi}
                definition={createMockDefinition(kpi.kpiKey)}
                variant="numeric"
              />
            ))}
          </div>
          <div className="mt-4 text-right">
            <a
              href={section.drillRoute}
              className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)',
              }}
            >
              View Details
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
