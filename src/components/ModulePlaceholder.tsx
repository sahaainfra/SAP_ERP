/**
 * Part 01 — Module Placeholder
 * 
 * For views that will be implemented by subsequent parts (27–69),
 * this component shows the module's planned scope and its position
 * in the build order. This demonstrates the workspace framework
 * is ready to receive module content.
 */

import React from 'react';
import {
  Briefcase,
  Package,
  HardHat,
  Calculator,
  FileText,
  Users,
  Truck,
  FlaskConical,
  Shield,
  FileCheck,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface ModulePlaceholderProps {
  module: string;
}

const MODULE_INFO: Record<string, { title: string; part: string; description: string; icon: React.ReactNode; status: string; dependencies: string[] }> = {
  projects: {
    title: 'Projects & Sites',
    part: 'Part 27',
    description: 'Organization, Company, Project & Site Architecture — the master hierarchy that every transaction references.',
    icon: <Briefcase size={24} />,
    status: 'Awaiting Part 27',
    dependencies: ['Part 06 (User/Role)', 'Part 09 (Document Framework)', 'Part 26 (Template)'],
  },
  procurement: {
    title: 'Procurement',
    part: 'Part 35',
    description: 'Indent → RFQ → Comparative → Purchase Order — the complete procurement document chain.',
    icon: <Package size={24} />,
    status: 'Awaiting Part 35',
    dependencies: ['Part 26 (Template)', 'Part 28 (Master Data)', 'Part 29 (Vendor)', 'Part 33 (Planning)'],
  },
  execution: {
    title: 'Site Execution',
    part: 'Part 34',
    description: 'Site Execution, Daily Progress Report & Physical Progress measurement.',
    icon: <HardHat size={24} />,
    status: 'Awaiting Part 34',
    dependencies: ['Part 33 (Planning)', 'Part 28 (Master Data)'],
  },
  billing: {
    title: 'Billing & Quantity Surveying',
    part: 'Part 39 / 54',
    description: 'Client Billing, RA Bills, Retention & Revenue — plus the QS Cockpit.',
    icon: <Calculator size={24} />,
    status: 'Awaiting Part 39',
    dependencies: ['Part 38 (MB)', 'Part 36 (Materials)', 'Part 37 (Contracts)'],
  },
  finance: {
    title: 'Finance & Accounts',
    part: 'Part 40',
    description: 'Finance, Accounts, Voucher Engine & Period Close — the general ledger and financial backbone.',
    icon: <FileText size={24} />,
    status: 'Awaiting Part 40',
    dependencies: ['Part 11 (Posting Engine)', 'Part 35 (Procurement)', 'Part 36 (Materials)', 'Part 39 (Billing)'],
  },
  hr: {
    title: 'HR & Workforce',
    part: 'Part 43',
    description: 'HR, Employee & Workforce Management — allocation, attendance, payroll pipeline.',
    icon: <Users size={24} />,
    status: 'Awaiting Part 43',
    dependencies: ['Part 27 (Organization)', 'Part 40 (Finance)'],
  },
  equipment: {
    title: 'Equipment & Machinery',
    part: 'Part 46',
    description: 'Equipment, Machinery, Logsheets, Fuel & Maintenance tracking.',
    icon: <Truck size={24} />,
    status: 'Awaiting Part 46',
    dependencies: ['Part 28 (Master Data)', 'Part 36 (Materials)', 'Part 40 (Finance)'],
  },
  quality: {
    title: 'QA/QC',
    part: 'Part 48',
    description: 'QA/QC — ITP, Inspection, Testing & Non-Conformance management.',
    icon: <FlaskConical size={24} />,
    status: 'Awaiting Part 48',
    dependencies: ['Part 33 (Planning)', 'Part 38 (Measurement Book)'],
  },
  safety: {
    title: 'HSE — Health, Safety & Environment',
    part: 'Part 49',
    description: 'Safety, Permits, Incidents & Observations — the HSE management system.',
    icon: <Shield size={24} />,
    status: 'Awaiting Part 49',
    dependencies: ['Part 43 (HR)', 'Part 48 (QA/QC)'],
  },
  documents: {
    title: 'Document Management',
    part: 'Part 50',
    description: 'Document Management, Drawings & Correspondence — the DMS.',
    icon: <FileCheck size={24} />,
    status: 'Awaiting Part 50',
    dependencies: ['Part 33 (Planning)', 'Part 48 (QA/QC)'],
  },
  reports: {
    title: 'MIS Reports',
    part: 'Part 58',
    description: 'MIS, Report Builder & Print Engine — the reporting framework.',
    icon: <BarChart3 size={24} />,
    status: 'Awaiting Part 58',
    dependencies: ['Part 15 (Analytics)', 'Part 18 (Metadata UI)', 'Part 42 (Cost Control)'],
  },
};

export function ModulePlaceholder({ module }: ModulePlaceholderProps) {
  const info = MODULE_INFO[module];

  if (!info) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Module not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Module header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 shrink-0">
          {info.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{info.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{info.description}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={18} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Build Status</h2>
        </div>
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm font-medium text-amber-800">{info.status}</span>
        </div>
        <p className="text-sm text-slate-600 mt-4">
          This module will be implemented in <strong>{info.part}</strong> of the 69-part build programme.
          The workspace foundation (Part 01) has already registered the tile contracts, permission keys,
          and navigation routes that this module will populate.
        </p>
      </div>

      {/* Dependencies */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 size={18} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Dependencies</h2>
        </div>
        <div className="space-y-2">
          {info.dependencies.map((dep, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <ArrowRight size={14} className="text-slate-400" />
              <span>{dep}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Framework readiness */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Framework Ready</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Permission keys registered',
            'Navigation route active',
            'Tile contracts defined',
            'Event types declared',
            'Document states mapped',
            'API path reserved',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={10} className="text-emerald-600" />
              </div>
              <span className="text-slate-600">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
