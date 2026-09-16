/**
 * Page Templates - Part 2
 * 
 * Five reusable page templates:
 * 1. OverviewPage - Dashboard grid
 * 2. ListReportPage - Transaction list with filters
 * 3. ObjectPage - Single record detail
 * 4. AnalyticalListPage - Chart + table
 * 5. WizardPage - Multi-step form
 */

import { ReactNode } from 'react';
import { ChevronRight, Filter, Download, Settings2, MoreHorizontal, Plus, Save } from 'lucide-react';

// ─── Page Header ─────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; route?: string }>;
  status?: { label: string; variant: 'positive' | 'critical' | 'negative' | 'information' | 'neutral' };
  actions?: Array<{
    label: string;
    variant?: 'primary' | 'secondary' | 'icon';
    icon?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    tooltip?: string;
  }>;
}

export function PageHeader({ title, subtitle, breadcrumbs, status, actions }: PageHeaderProps) {
  const statusColors = {
    positive: { bg: 'var(--sapSuccessBackground)', text: 'var(--sapPositiveTextColor)', border: 'var(--sapSuccessBorderColor)' },
    critical: { bg: 'var(--sapWarningBackground)', text: 'var(--sapCriticalTextColor)', border: 'var(--sapWarningBorderColor)' },
    negative: { bg: 'var(--sapErrorBackground)', text: 'var(--sapNegativeTextColor)', border: 'var(--sapErrorBorderColor)' },
    information: { bg: 'var(--sapInformationBackground)', text: 'var(--sapInformativeTextColor)', border: 'var(--sapInformationBorderColor)' },
    neutral: { bg: 'var(--sapNeutralBackground)', text: 'var(--sapNeutralTextColor)', border: 'var(--sapNeutralBorderColor)' },
  };

  return (
    <div className="mb-5">
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs mb-2" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={10} style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />}
              {crumb.route ? (
                <a href={crumb.route} className="hover:underline" style={{ color: 'var(--sapLinkColor)' }}>
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium" style={{ color: 'var(--sapTextColor)' }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 'var(--sapFontHeader2Size)', fontWeight: 'bold', color: 'var(--sapTitleColor)' }}>
            {title}
          </h1>
          {status && (
            <span 
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ 
                background: statusColors[status.variant].bg,
                color: statusColors[status.variant].text,
                border: `1px solid ${statusColors[status.variant].border}`
              }}
            >
              {status.label}
            </span>
          )}
        </div>
        
        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, i) => {
              if (action.variant === 'icon') {
                return (
                  <button
                    key={i}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="p-2 rounded-md hover:bg-[var(--sapButton_Hover_Background)] transition-colors"
                    style={{ 
                      color: action.disabled ? 'var(--sapContent_DisabledTextColor)' : 'var(--sapButton_TextColor)',
                      opacity: action.disabled ? 'var(--sapContent_DisabledOpacity)' : 1
                    }}
                    title={action.tooltip}
                  >
                    {action.icon}
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: action.variant === 'primary' ? 'var(--sapButton_Emphasized_Background)' : 'var(--sapButton_Background)',
                    color: action.variant === 'primary' ? 'var(--sapButton_Emphasized_TextColor)' : 'var(--sapButton_TextColor)',
                    border: action.variant === 'primary' ? 'none' : '1px solid var(--sapButton_BorderColor)',
                    opacity: action.disabled ? 'var(--sapContent_DisabledOpacity)' : 1,
                  }}
                  title={action.disabled ? action.tooltip : undefined}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>{subtitle}</p>
      )}
    </div>
  );
}

// ─── Template 1: Overview Page ───────────────────────────────────────────────

interface OverviewPageProps {
  header: PageHeaderProps;
  children: ReactNode;
}

export function OverviewPage({ header, children }: OverviewPageProps) {
  return (
    <div className="animate-slide-in">
      <PageHeader {...header} />
      <div className="grid-responsive">
        {children}
      </div>
    </div>
  );
}

// ─── Template 2: List Report Page ────────────────────────────────────────────

interface ListReportPageProps {
  header: PageHeaderProps;
  filterBar?: ReactNode;
  toolbar?: {
    count?: number;
    viewMode?: 'table' | 'grid';
    onViewChange?: (mode: 'table' | 'grid') => void;
  };
  children: ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function ListReportPage({ header, filterBar, toolbar, children, pagination }: ListReportPageProps) {
  return (
    <div className="animate-slide-in">
      <PageHeader {...header} />
      
      {/* Filter Bar */}
      {filterBar && (
        <div className="sap-card p-3 mb-4">
          {filterBar}
        </div>
      )}

      {/* Toolbar */}
      {toolbar && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {toolbar.count !== undefined && (
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {toolbar.count} records
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="Filter">
              <Filter size={16} style={{ color: 'var(--sapContent_IconColor)' }} />
            </button>
            <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="Export">
              <Download size={16} style={{ color: 'var(--sapContent_IconColor)' }} />
            </button>
            <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]" title="Settings">
              <Settings2 size={16} style={{ color: 'var(--sapContent_IconColor)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {children}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 sap-card">
          <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 rounded text-sm border hover:bg-[var(--sapButton_Hover_Background)] disabled:opacity-40"
              style={{ borderColor: 'var(--sapButton_BorderColor)', color: 'var(--sapButton_TextColor)' }}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
              Page {pagination.page}
            </span>
            <button 
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1 rounded text-sm border hover:bg-[var(--sapButton_Hover_Background)] disabled:opacity-40"
              style={{ borderColor: 'var(--sapButton_BorderColor)', color: 'var(--sapButton_TextColor)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Template 3: Object Page ─────────────────────────────────────────────────

interface ObjectPageProps {
  header: PageHeaderProps;
  facts?: Array<{ label: string; value: string | number }>;
  children: ReactNode;
}

export function ObjectPage({ header, facts, children }: ObjectPageProps) {
  return (
    <div className="animate-slide-in">
      <PageHeader {...header} />
      
      {/* Key Facts */}
      {facts && facts.length > 0 && (
        <div className="sap-card p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {facts.map((fact, i) => (
              <div key={i}>
                <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {fact.label}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {fact.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// ─── Template 4: Analytical List Page ────────────────────────────────────────

interface AnalyticalListPageProps {
  header: PageHeaderProps;
  chart: ReactNode;
  table: ReactNode;
  filterBar?: ReactNode;
}

export function AnalyticalListPage({ header, chart, table, filterBar }: AnalyticalListPageProps) {
  return (
    <div className="animate-slide-in">
      <PageHeader {...header} />
      
      {filterBar && (
        <div className="sap-card p-3 mb-4">
          {filterBar}
        </div>
      )}

      {/* Chart Region */}
      <div className="sap-card p-5 mb-4">
        {chart}
      </div>

      {/* Table Region */}
      <div>
        {table}
      </div>
    </div>
  );
}

// ─── Template 5: Wizard / Guided Flow ────────────────────────────────────────

interface WizardPageProps {
  header: PageHeaderProps;
  steps: Array<{ label: string; completed: boolean; active: boolean }>;
  children: ReactNode;
  onSaveDraft?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isLastStep?: boolean;
}

export function WizardPage({ header, steps, children, onSaveDraft, onBack, onNext, onSubmit, isLastStep }: WizardPageProps) {
  return (
    <div className="animate-slide-in">
      <PageHeader {...header} />

      {/* Step Indicator */}
      <div className="sap-card p-4 mb-4">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.completed ? 'text-white' : step.active ? 'text-white' : ''
                  }`}
                  style={{
                    background: step.completed 
                      ? 'var(--sapPositiveColor)' 
                      : step.active 
                      ? 'var(--sapBrandColor)' 
                      : 'var(--sapBaseColor)',
                    color: step.completed || step.active ? '#fff' : 'var(--sapContent_LabelColor)',
                  }}
                >
                  {step.completed ? '✓' : i + 1}
                </div>
                <span 
                  className="text-sm font-medium hidden sm:block"
                  style={{ 
                    color: step.active ? 'var(--sapBrandColor)' : 'var(--sapContent_LabelColor)' 
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 sm:w-16 h-0.5 mx-2" 
                  style={{ background: step.completed ? 'var(--sapPositiveColor)' : 'var(--sapBaseColor)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="sap-card p-5 mb-4">
        {children}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between sap-card p-4">
        <div>
          {onSaveDraft && (
            <button 
              onClick={onSaveDraft}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm"
              style={{ 
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)'
              }}
            >
              <Save size={14} />
              Save Draft
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-4 py-2 rounded-md text-sm"
              style={{ 
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)'
              }}
            >
              Back
            </button>
          )}
          {isLastStep ? (
            <button 
              onClick={onSubmit}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ 
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}
            >
              Submit
            </button>
          ) : (
            <button 
              onClick={onNext}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ 
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
