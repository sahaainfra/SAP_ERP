/**
 * Analytics Dashboard Component - Part 8
 * 
 * Main analytics dashboard combining EVM, Forecasting, Intelligence, 
 * Anomaly Detection, and AI Copilot
 */

import { useState } from 'react';
import { 
  BarChart3, TrendingUp, Lightbulb, AlertTriangle, 
  Bot, FileText, Printer
} from 'lucide-react';
import EVMPanel from './EVMPanel';
import ForecastingPanel from './ForecastingPanel';
import IntelligencePanel from './IntelligencePanel';
import AnomalyDetectionPanel from './AnomalyDetectionPanel';
import CopilotPanel from './CopilotPanel';
import ReportBuilder from './ReportBuilder';
import { 
  evmMetrics, 
  evmTimeSeries, 
  wbsBreakdown,
  forecasts,
  insights,
  anomalies
} from '../data/analyticsData';

type AnalyticsTab = 'evm' | 'forecasting' | 'intelligence' | 'anomalies' | 'reports';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('evm');
  const [copilotOpen, setCopilotOpen] = useState(false);

  const tabs = [
    { key: 'evm', label: 'EVM', icon: BarChart3 },
    { key: 'forecasting', label: 'Forecasting', icon: TrendingUp },
    { key: 'intelligence', label: 'Intelligence', icon: Lightbulb },
    { key: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { key: 'reports', label: 'Reports', icon: FileText }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--sapBackgroundColor)' }}>
      {/* Header */}
      <div className="sap-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Analytics & Intelligence
            </h1>
            <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Advanced analytics, forecasting, and AI-powered insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapAccentColor7)',
                color: 'white'
              }}
            >
              <Bot size={16} />
              AI Copilot
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)'
              }}
            >
              <Printer size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sap-card mb-6">
        <div className="flex border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as AnalyticsTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[var(--sapSelectedColor)]'
                    : 'border-transparent hover:border-[var(--sapContent_BorderColor)]'
                }`}
                style={{
                  color: activeTab === tab.key ? 'var(--sapSelectedColor)' : 'var(--sapContent_LabelColor)'
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="sap-card p-6">
        {activeTab === 'evm' && (
          <EVMPanel 
            metrics={evmMetrics}
            timeSeries={evmTimeSeries}
            wbsBreakdown={wbsBreakdown}
          />
        )}
        {activeTab === 'forecasting' && (
          <ForecastingPanel forecasts={forecasts} />
        )}
        {activeTab === 'intelligence' && (
          <IntelligencePanel insights={insights} />
        )}
        {activeTab === 'anomalies' && (
          <AnomalyDetectionPanel anomalies={anomalies} />
        )}
        {activeTab === 'reports' && (
          <ReportBuilder />
        )}
      </div>

      {/* AI Copilot Panel */}
      <CopilotPanel 
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}
