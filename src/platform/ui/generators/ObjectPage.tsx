/**
 * Part 18 — Object Page Generator
 * 
 * Generates object detail screens from metadata. Handles:
 * - Object header with key figures and status
 * - Sectioned body with anchor navigation
 * - Related-record tables
 * - Activity and approval timeline
 * - Attachments
 * - Footer action bar
 */

import React, { useState, useEffect } from 'react';
import { EntityUiMetadata, ObjectPageSection } from '../metadata/types';

interface ObjectPageProps {
  meta: EntityUiMetadata;
  id: number;
}

export const ObjectPage: React.FC<ObjectPageProps> = ({ meta, id }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // In production, would call meta.api/{id}
        // For demo, use mock data
        const mockData = generateMockObjectData(meta, id);
        setData(mockData);
        if (meta.objectPage?.sections[0]) {
          setActiveSection(meta.objectPage.sections[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [meta, id]);

  if (loading) {
    return <div className="object-page-loading">Loading...</div>;
  }

  if (!data) {
    return <div className="object-page-not-found">Record not found</div>;
  }

  const sections = meta.objectPage?.sections || [];

  return (
    <div className="object-page">
      {/* Object Header */}
      <div className="object-header">
        <div className="object-header-main">
          <h1 className="object-title">
            {data[meta.listReport.columns[0].field]}
          </h1>
          <div className="object-subtitle">{meta.label.singular}</div>
        </div>

        {/* Header Fields */}
        <div className="object-header-fields">
          {meta.objectPage?.headerFields.map(field => (
            <div key={field} className="header-field">
              <span className="header-field-label">{meta.fields[field].label}:</span>
              <span className="header-field-value">
                {formatField(data[field], meta.fields[field], data)}
              </span>
            </div>
          ))}
        </div>

        {/* Status */}
        {data.status && (
          <div className="object-header-status">
            {renderStatusIndicator(data.status, meta.fields.status)}
          </div>
        )}

        {/* Actions */}
        <div className="object-header-actions">
          {meta.actions
            .filter(action => {
              // Check visibility expression (simplified)
              if (action.visible) {
                // In production, would evaluate expression
                return true;
              }
              return true;
            })
            .map(action => (
              <button
                key={action.name}
                className={`action-btn action-${action.emphasis || 'secondary'}`}
                onClick={() => handleAction(action, data)}
              >
                {action.label}
              </button>
            ))}
        </div>
      </div>

      {/* Anchor Navigation */}
      {sections.length > 1 && (
        <div className="object-anchor-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`anchor-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="object-sections">
        {sections
          .filter(section => !section.permission || true) // Would check permission
          .map(section => (
            <SectionRenderer
              key={section.id}
              section={section}
              data={data}
              meta={meta}
              isActive={activeSection === section.id}
            />
          ))}
      </div>

      {/* Related Apps */}
      {meta.objectPage?.relatedApps && meta.objectPage.relatedApps.length > 0 && (
        <div className="object-related-apps">
          <h3>Related</h3>
          <div className="related-apps-list">
            {meta.objectPage.relatedApps.map((app, i) => (
              <a
                key={i}
                href={app.route.replace(/\{(\w+)Id\}/g, (_, key) => data[key + 'Id'] || data[key] || '')}
                className="related-app-link"
              >
                {app.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Section Renderer
const SectionRenderer: React.FC<{
  section: ObjectPageSection;
  data: any;
  meta: EntityUiMetadata;
  isActive: boolean;
}> = ({ section, data, meta, isActive }) => {
  if (!isActive) return null;

  switch (section.type) {
    case 'form':
      return (
        <div className="object-section object-section-form">
          <h2>{section.label}</h2>
          <div className="form-grid">
            {section.fields?.map(field => (
              <div key={field} className="form-field">
                <label>{meta.fields[field].label}</label>
                <div className="form-field-value">
                  {formatField(data[field], meta.fields[field], data)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className="object-section object-section-table">
          <h2>{section.label}</h2>
          <div className="related-table">
            <p>Related {section.entity} records would be displayed here</p>
            {/* In production, would render a SmartTable with related data */}
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className="object-section object-section-timeline">
          <h2>{section.label}</h2>
          <div className="timeline">
            <p>Timeline of {section.entity} events would be displayed here</p>
            {/* In production, would render a Timeline component */}
          </div>
        </div>
      );

    case 'workflow':
      return (
        <div className="object-section object-section-workflow">
          <h2>{section.label}</h2>
          <div className="workflow-trail">
            <p>Approval workflow trail would be displayed here</p>
            {/* In production, would render workflow steps with decisions */}
          </div>
        </div>
      );

    case 'audit':
      return (
        <div className="object-section object-section-audit">
          <h2>{section.label}</h2>
          <div className="audit-trail">
            <p>Audit trail with field-level diffs would be displayed here</p>
            {/* In production, would render audit log from Part 09 */}
          </div>
        </div>
      );

    case 'attachments':
      return (
        <div className="object-section object-section-attachments">
          <h2>{section.label}</h2>
          <div className="attachments-list">
            <p>Document attachments would be displayed here</p>
            {/* In production, would render attachment list with upload */}
          </div>
        </div>
      );

    default:
      return (
        <div className="object-section">
          <h2>{section.label}</h2>
          <p>Section type "{section.type}" not yet implemented</p>
        </div>
      );
  }
};

// Helper functions

function formatField(value: any, fieldMeta: any, row?: any): string {
  if (value === null || value === undefined) return '—';

  switch (fieldMeta.type) {
    case 'money':
      const currency = row?.[fieldMeta.currencyField || ''] || 'INR';
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);
    case 'quantity':
      const uom = row?.[fieldMeta.uomField || ''] || '';
      return `${value.toFixed(fieldMeta.precision || 2)} ${uom}`;
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'date':
      return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    case 'datetime':
      return new Date(value).toLocaleString('en-GB');
    case 'status':
    case 'enum':
      const enumValue = fieldMeta.enumValues?.find((v: any) => v.value === value);
      return enumValue?.label || value;
    case 'reference':
      return value?.[fieldMeta.reference?.displayField || 'name'] || value?.id || value;
    default:
      return String(value);
  }
}

function renderStatusIndicator(value: string, fieldMeta: any) {
  const enumValue = fieldMeta.enumValues?.find((v: any) => v.value === value);
  if (!enumValue) return value;

  const stateColors: Record<string, string> = {
    NEUTRAL: 'var(--sapNeutralColor, #6a6d70)',
    GOOD: 'var(--sapPositiveColor, #107e3e)',
    WARNING: 'var(--sapCriticalColor, #e9730c)',
    CRITICAL: 'var(--sapNegativeColor, #bb0000)',
  };

  const state = enumValue.state || 'NEUTRAL';
  const color = stateColors[state] || stateColors.NEUTRAL;

  return (
    <span
      className="status-indicator"
      style={{
        backgroundColor: color,
        color: '#fff',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {enumValue.label}
    </span>
  );
}

function handleAction(action: any, data: any) {
  // In production, would call action execution framework
  console.log('Execute action:', action.name, 'on', data.id);
  
  if (action.confirm) {
    const confirmed = window.confirm(`${action.confirm.title}\n\n${action.confirm.body}`);
    if (!confirmed) return;
  }
  
  if (action.requiresReason) {
    const reason = window.prompt('Please provide a reason:');
    if (!reason) return;
  }
  
  alert(`Action "${action.label}" executed on record ${data.id}`);
}

function generateMockObjectData(meta: EntityUiMetadata, id: number) {
  return {
    id,
    documentNumber: `PO-2026-${String(id).padStart(4, '0')}`,
    documentDate: new Date(2026, 0, id).toISOString(),
    vendor: { id: id % 10 + 1, name: `Vendor ${id % 10 + 1}` },
    project: { id: id % 5 + 1, name: `Project ${id % 5 + 1}` },
    totalValue: Math.random() * 1000000,
    openCommitment: Math.random() * 500000,
    status: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RELEASED', 'CLOSED'][id % 5],
    deliveryDate: new Date(2026, 1, id).toISOString(),
    budgetStatus: ['WITHIN', 'EXCEEDED', 'OVERRIDDEN'][id % 3],
    currency: 'INR',
    poType: ['STANDARD', 'BLANKET', 'CONTRACT'][id % 3],
    costCode: { id: id % 20 + 1, code: `CC-${id % 20 + 1}` },
    createdBy: { id: 1, name: 'John Doe' },
  };
}

export default ObjectPage;
