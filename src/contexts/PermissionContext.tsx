/**
 * Part 01 — Permission Context
 * 
 * Provides the current user's permission set to all components.
 * Rule 4: Permission is server-side. This context reflects what the
 * server has authorised — the UI merely hides what's not permitted.
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { UserIdentity, PermissionKey } from '../types/workspace';

interface PermissionContextValue {
  user: UserIdentity;
  hasPermission: (key: PermissionKey) => boolean;
  hasAnyPermission: (keys: PermissionKey[]) => boolean;
  hasAllPermissions: (keys: PermissionKey[]) => boolean;
  canAccessProject: (projectId: string) => boolean;
  canAccessSite: (siteId: string) => boolean;
  canAccessOrg: (orgId: string) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

// Demo user for Part 01 — represents the permission framework
const DEMO_USER: UserIdentity = {
  id: 'usr_001',
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@construction.co',
  roles: ['project_manager', 'site_engineer'],
  permissions: {
    keys: [
      // Project management
      'project.project.view',
      'project.project.create',
      'project.project.edit',
      'project.wbs.view',
      'project.wbs.edit',
      'project.dpr.view',
      'project.dpr.create',
      // Procurement
      'procure.po.view',
      'procure.po.create',
      'procure.po.edit',
      'procure.po.submit',
      'procure.po.approve',
      'procure.indent.view',
      'procure.indent.create',
      'procure.rfq.view',
      'procure.comparative.view',
      // Store/Materials
      'store.grn.view',
      'store.grn.create',
      'store.stock.view',
      'store.issue.view',
      'store.issue.create',
      // Billing
      'bill.client.view',
      'bill.client.create',
      'bill.mb.view',
      'bill.mb.create',
      // Finance
      'finance.voucher.view',
      'finance.voucher.create',
      // HR
      'hr.employee.view',
      'hr.attendance.view',
      // QA/QC
      'qa.inspection.view',
      'qa.inspection.create',
      // HSE
      'hse.incident.view',
      'hse.incident.create',
      'hse.permit.view',
      // Equipment
      'asset.equipment.view',
      'asset.equipment.edit',
      // Master data
      'master.vendor.view',
      'master.item.view',
      'master.rate.view',
      // Reports
      'report.mis.view',
      'report.mis.export',
      // Admin
      'admin.user.view',
      'admin.role.view',
    ],
    projectScope: ['prj_001', 'prj_002', 'prj_003'],
    orgScope: ['org_001', 'org_002'],
    siteScope: ['site_001', 'site_002', 'site_003', 'site_004'],
  },
  defaultProjectId: 'prj_001',
  defaultSiteId: 'site_001',
};

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<PermissionContextValue>(() => ({
    user: DEMO_USER,
    hasPermission: (key: PermissionKey) => {
      return DEMO_USER.permissions.keys.includes(key);
    },
    hasAnyPermission: (keys: PermissionKey[]) => {
      return keys.some(key => DEMO_USER.permissions.keys.includes(key));
    },
    hasAllPermissions: (keys: PermissionKey[]) => {
      return keys.every(key => DEMO_USER.permissions.keys.includes(key));
    },
    canAccessProject: (projectId: string) => {
      return DEMO_USER.permissions.projectScope.includes(projectId);
    },
    canAccessSite: (siteId: string) => {
      return DEMO_USER.permissions.siteScope.includes(siteId);
    },
    canAccessOrg: (orgId: string) => {
      return DEMO_USER.permissions.orgScope.includes(orgId);
    },
  }), []);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermission must be used within PermissionProvider');
  return ctx;
}

export function useHasPermission(key: PermissionKey): boolean {
  const { hasPermission } = usePermission();
  return hasPermission(key);
}
