/**
 * Design System Showcase
 * 
 * Route: /dev/design-system
 * Shows every token, every state component, and every theme side by side
 * for visual regression review.
 */

import { useState } from 'react';
import { useThemeEngine, THEMES, DENSITIES } from '../hooks/useThemeEngine';
import {
  KPICardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  EmptyState,
  EmptyFilteredState,
  EmptyNoPermissionState,
  EmptyNotConfiguredState,
  ErrorState,
  WidgetError,
} from './StateComponents';
import { Inbox, Filter, Lock, Settings } from 'lucide-react';

export default function DesignSystemShowcase() {
  const { theme, resolvedTheme, density, setTheme, setDensity } = useThemeEngine();
  const [activeTab, setActiveTab] = useState<'tokens' | 'states' | 'themes' | 'density'>('tokens');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--sapTitleColor)' }}>
          Design System Showcase
        </h1>
        <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
          SAP Fiori Horizon aligned tokens, components, and themes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'var(--sapPageHeader_BorderColor)' }}>
        {(['tokens', 'states', 'themes', 'density'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={{
              color: activeTab === tab ? 'var(--sapLinkColor)' : 'var(--sapContent_LabelColor)',
              borderColor: activeTab === tab ? 'var(--sapLinkColor)' : 'transparent',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'tokens' && <TokensShowcase />}
      {activeTab === 'states' && <StatesShowcase />}
      {activeTab === 'themes' && <ThemesShowcase theme={theme} setTheme={setTheme} />}
      {activeTab === 'density' && <DensityShowcase density={density} setDensity={setDensity} />}
    </div>
  );
}

function TokensShowcase() {
  const tokenGroups = [
    {
      title: 'Brand & Base Colors',
      tokens: [
        { name: '--sapBrandColor', label: 'Brand' },
        { name: '--sapHighlightColor', label: 'Highlight' },
        { name: '--sapBaseColor', label: 'Base' },
        { name: '--sapBackgroundColor', label: 'Background' },
        { name: '--sapTextColor', label: 'Text' },
      ],
    },
    {
      title: 'Semantic Colors',
      tokens: [
        { name: '--sapPositiveColor', label: 'Positive' },
        { name: '--sapCriticalColor', label: 'Critical' },
        { name: '--sapNegativeColor', label: 'Negative' },
        { name: '--sapInformativeColor', label: 'Informative' },
        { name: '--sapNeutralColor', label: 'Neutral' },
      ],
    },
    {
      title: 'Status Backgrounds',
      tokens: [
        { name: '--sapSuccessBackground', label: 'Success BG' },
        { name: '--sapWarningBackground', label: 'Warning BG' },
        { name: '--sapErrorBackground', label: 'Error BG' },
        { name: '--sapInformationBackground', label: 'Info BG' },
        { name: '--sapNeutralBackground', label: 'Neutral BG' },
      ],
    },
    {
      title: 'Typography',
      tokens: [
        { name: '--sapFontHeader1Size', label: 'Header 1 (48px)' },
        { name: '--sapFontHeader2Size', label: 'Header 2 (32px)' },
        { name: '--sapFontHeader3Size', label: 'Header 3 (24px)' },
        { name: '--sapFontHeader4Size', label: 'Header 4 (20px)' },
        { name: '--sapFontHeader5Size', label: 'Header 5 (16px)' },
        { name: '--sapFontSize', label: 'Body (14px)' },
        { name: '--sapFontSmallSize', label: 'Small (12px)' },
      ],
    },
    {
      title: 'Spacing',
      tokens: [
        { name: '--erp-space-1', label: 'Space 1 (4px)' },
        { name: '--erp-space-2', label: 'Space 2 (8px)' },
        { name: '--erp-space-3', label: 'Space 3 (12px)' },
        { name: '--erp-space-4', label: 'Space 4 (16px)' },
        { name: '--erp-space-5', label: 'Space 5 (24px)' },
        { name: '--erp-space-6', label: 'Space 6 (32px)' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {tokenGroups.map((group) => (
        <div key={group.title}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
            {group.title}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {group.tokens.map((token) => (
              <div key={token.name} className="sap-card p-4">
                <div
                  className="w-full h-16 rounded-lg mb-3 border"
                  style={{
                    background: `var(${token.name})`,
                    borderColor: 'var(--sapGroup_ContentBorderColor)',
                  }}
                />
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {token.name}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  {token.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatesShowcase() {
  return (
    <div className="space-y-8">
      {/* Loading States */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
          Loading States
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
              KPI Card Skeleton
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Table Skeleton
            </h3>
            <TableSkeleton rows={3} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Chart Skeleton
            </h3>
            <ChartSkeleton />
          </div>
        </div>
      </div>

      {/* Empty States */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
          Empty States
        </h2>
        <div className="space-y-4">
          <div className="sap-card p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
              No Data Yet
            </h3>
            <EmptyState
              icon={<Inbox size={28} style={{ color: 'var(--sapNeutralColor)' }} />}
              title="No purchase orders yet"
              description="Create your first purchase order to get started."
              action={{ label: 'Create Purchase Order', onClick: () => {} }}
            />
          </div>
          <div className="sap-card p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Filtered to Nothing
            </h3>
            <EmptyFilteredState onClearFilters={() => {}} />
          </div>
          <div className="sap-card p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
              No Permission
            </h3>
            <EmptyNoPermissionState />
          </div>
          <div className="sap-card p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Module Not Configured
            </h3>
            <EmptyNotConfiguredState />
          </div>
        </div>
      </div>

      {/* Error States */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
          Error States
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Recoverable Error
            </h3>
            <ErrorState
              title="Failed to load data"
              message="Unable to connect to the server. Please check your connection and try again."
              onRetry={() => {}}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Widget Error
            </h3>
            <div className="max-w-md">
              <WidgetError onRetry={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemesShowcase({ theme, setTheme }: { theme: string; setTheme: (t: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
          Theme Selection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(THEMES).map(([key, themeInfo]) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className="sap-tile p-6 text-left"
              style={{
                border: theme === key ? '2px solid var(--sapSelectedColor)' : '2px solid transparent',
              }}
            >
              <div className="text-3xl mb-3">{themeInfo.icon}</div>
              <div className="text-base font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                {themeInfo.name}
              </div>
              <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {themeInfo.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
          Current Theme Preview
        </h2>
        <div className="sap-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Selected Theme
              </div>
              <div className="text-sm font-mono font-medium" style={{ color: 'var(--sapTextColor)' }}>
                {theme}
              </div>
            </div>
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Background
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{
                    background: 'var(--sapBackgroundColor)',
                    borderColor: 'var(--sapGroup_ContentBorderColor)',
                  }}
                />
                <span className="text-xs font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  var(--sapBackgroundColor)
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Text Color
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{
                    background: 'var(--sapTextColor)',
                    borderColor: 'var(--sapGroup_ContentBorderColor)',
                  }}
                />
                <span className="text-xs font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  var(--sapTextColor)
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Brand Color
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{
                    background: 'var(--sapBrandColor)',
                    borderColor: 'var(--sapGroup_ContentBorderColor)',
                  }}
                />
                <span className="text-xs font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  var(--sapBrandColor)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DensityShowcase({ density, setDensity }: { density: string; setDensity: (d: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
          Density Selection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(DENSITIES).map(([key, densityInfo]) => (
            <button
              key={key}
              onClick={() => setDensity(key)}
              className="sap-tile p-6 text-left"
              style={{
                border: density === key ? '2px solid var(--sapSelectedColor)' : '2px solid transparent',
              }}
            >
              <div className="text-base font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                {densityInfo.name}
              </div>
              <div className="text-sm mb-3" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {densityInfo.description}
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Control Height: {densityInfo.controlHeight}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTitleColor)' }}>
          Density Preview
        </h2>
        <div className="sap-card p-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Current Density
              </div>
              <div className="text-sm font-mono font-medium" style={{ color: 'var(--sapTextColor)' }}>
                {density}
              </div>
            </div>
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Sample Controls
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="px-4 rounded font-medium transition-colors"
                  style={{
                    height: 'var(--sapElement_Height)',
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 rounded font-medium transition-colors"
                  style={{
                    height: 'var(--sapElement_Height)',
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)',
                  }}
                >
                  Secondary Button
                </button>
                <input
                  type="text"
                  placeholder="Input field"
                  className="px-3 rounded"
                  style={{
                    height: 'var(--sapElement_Height)',
                    background: 'var(--sapField_Background)',
                    color: 'var(--sapField_TextColor)',
                    border: '1px solid var(--sapField_BorderColor)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
