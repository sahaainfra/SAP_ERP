/**
 * Permission Resolver Hook - Part 3
 * 
 * Simulates server-side permission resolution.
 * In production, this would be an API call to the backend.
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  EffectivePermissionSet, ProjectAssignment, 
  ApprovalAuthority, DocumentType, FieldVisibility, SoDRule
} from '../types/permissions';
import {
  permissionCatalogue,
  responsibilityTemplates,
  projectAssignments,
  approvalAuthorities,
  users,
  delegations,
  fieldRestrictions,
  sodRules,
} from '../data/permissionData';

// Cache for resolved permissions
const permissionCache = new Map<string, { data: EffectivePermissionSet; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes

/**
 * Resolve effective permissions for a user on a project
 */
function resolvePermissionsSync(
  userId: number, 
  projectId: number | null
): EffectivePermissionSet {
  const cacheKey = `${userId}:${projectId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Layer 1: Super Admin bypass
  if (user.isSuperAdmin) {
    const allPermissions = new Set(permissionCatalogue.map(p => p.permissionKey));
    const result: EffectivePermissionSet = {
      userId,
      projectId,
      isSuperAdmin: true,
      permissions: allPermissions,
      deniedPermissions: new Set(),
      dataScope: 'ALL_ASSIGNED',
      allowedSiteIds: 'ALL',
      allowedPackageIds: 'ALL',
      allowedStoreIds: 'ALL',
      approvalAuthority: {},
      fieldRestrictions: {},
      activeDelegationsReceived: [],
      resolvedAt: new Date().toISOString(),
      ttlSeconds: 60, // Shorter TTL for Super Admin
    };
    permissionCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  // Layer 2: Get user's active assignments
  const userAssignments = projectAssignments.filter(a => 
    a.userId === userId && 
    a.status === 'ACTIVE' &&
    new Date(a.validFrom) <= new Date() &&
    (!a.validTo || new Date(a.validTo) >= new Date())
  );

  // If no project specified, return org-wide permissions
  if (projectId === null) {
    const orgPermissions = new Set<string>();
    userAssignments.forEach(assignment => {
      const template = responsibilityTemplates.find(t => t.id === assignment.templateId);
      if (template) {
        template.permissionIds.forEach(permId => {
          const perm = permissionCatalogue.find(p => p.id === permId);
          if (perm) orgPermissions.add(perm.permissionKey);
        });
      }
    });

    const result: EffectivePermissionSet = {
      userId,
      projectId: null,
      isSuperAdmin: false,
      permissions: orgPermissions,
      deniedPermissions: new Set(),
      dataScope: 'ALL_ASSIGNED',
      allowedSiteIds: 'ALL',
      allowedPackageIds: 'ALL',
      allowedStoreIds: 'ALL',
      approvalAuthority: {},
      fieldRestrictions: {},
      activeDelegationsReceived: [],
      resolvedAt: new Date().toISOString(),
      ttlSeconds: 300,
    };
    permissionCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  // Layer 3: Find assignment for this specific project
  const assignment = userAssignments.find(a => a.projectId === projectId);
  
  if (!assignment) {
    // No access to this project
    const result: EffectivePermissionSet = {
      userId,
      projectId,
      isSuperAdmin: false,
      permissions: new Set(),
      deniedPermissions: new Set(),
      dataScope: 'PROJECT',
      allowedSiteIds: [],
      allowedPackageIds: [],
      allowedStoreIds: [],
      approvalAuthority: {},
      fieldRestrictions: {},
      activeDelegationsReceived: [],
      resolvedAt: new Date().toISOString(),
      ttlSeconds: 300,
    };
    permissionCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  // Layer 4: Resolve permissions from template
  const template = responsibilityTemplates.find(t => t.id === assignment.templateId);
  const permissions = new Set<string>();
  
  if (template) {
    template.permissionIds.forEach(permId => {
      const perm = permissionCatalogue.find(p => p.id === permId);
      if (perm) permissions.add(perm.permissionKey);
    });
  }

  // Layer 5: Apply explicit overrides (none in this demo, but structure is there)
  // In production, would query dx_assignment_permission table

  // Layer 6: Get approval authorities for this assignment
  const authorities = approvalAuthorities.filter(a => a.assignmentId === assignment.id);
  const authorityMap: Record<string, ApprovalAuthority[]> = {};
  authorities.forEach(auth => {
    if (!authorityMap[auth.documentType]) {
      authorityMap[auth.documentType] = [];
    }
    authorityMap[auth.documentType].push(auth);
  });

  // Layer 7: Get field restrictions
  const restrictions = fieldRestrictions.filter(r => r.assignmentId === assignment.id);
  const fieldRestrictionMap: Record<string, Record<string, FieldVisibility>> = {};
  restrictions.forEach(r => {
    if (!fieldRestrictionMap[r.entity]) {
      fieldRestrictionMap[r.entity] = {};
    }
    fieldRestrictionMap[r.entity][r.fieldName] = r.visibility;
  });

  // Layer 8: Get active delegations received
  const activeDelegations = delegations.filter(d => 
    d.toUserId === userId &&
    d.status === 'ACTIVE' &&
    new Date(d.validFrom) <= new Date() &&
    new Date(d.validTo) >= new Date() &&
    (!d.projectId || d.projectId === projectId)
  );

  // Build result
  const result: EffectivePermissionSet = {
    userId,
    projectId,
    isSuperAdmin: false,
    permissions,
    deniedPermissions: new Set(),
    dataScope: assignment.dataScope,
    allowedSiteIds: assignment.dataScope === 'SITE' ? [1, 2] : 'ALL', // Simplified
    allowedPackageIds: assignment.dataScope === 'PACKAGE' ? [1] : 'ALL',
    allowedStoreIds: 'ALL',
    approvalAuthority: authorityMap as Record<DocumentType, ApprovalAuthority[]>,
    fieldRestrictions: fieldRestrictionMap,
    activeDelegationsReceived: activeDelegations,
    resolvedAt: new Date().toISOString(),
    ttlSeconds: 300,
  };

  permissionCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Hook to use permission resolution
 */
export function usePermissions(userId: number, projectId: number | null) {
  const [permissions, setPermissions] = useState<EffectivePermissionSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulate async resolution (would be API call in production)
    setTimeout(() => {
      const resolved = resolvePermissionsSync(userId, projectId);
      setPermissions(resolved);
      setLoading(false);
    }, 50); // Simulate network delay
  }, [userId, projectId]);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (!permissions) return false;
    if (permissions.isSuperAdmin) return true;
    if (permissions.deniedPermissions.has(permissionKey)) return false;
    return permissions.permissions.has(permissionKey);
  }, [permissions]);

  const canApprove = useCallback((documentType: DocumentType, amount: number): boolean => {
    if (!permissions) return false;
    if (permissions.isSuperAdmin) return true;
    
    const authorities = permissions.approvalAuthority[documentType];
    if (!authorities || authorities.length === 0) return false;
    
    return authorities.some(auth => 
      auth.canApprove &&
      auth.isActive &&
      amount >= auth.minAmount &&
      (auth.maxAmount === null || auth.maxAmount === undefined || amount <= auth.maxAmount)
    );
  }, [permissions]);

  const getApprovalLimit = useCallback((documentType: DocumentType): number | null => {
    if (!permissions) return null;
    if (permissions.isSuperAdmin) return null; // Unlimited
    
    const authorities = permissions.approvalAuthority[documentType];
    if (!authorities || authorities.length === 0) return 0;
    
    const maxLimit = Math.max(...authorities.map(a => a.maxAmount || Infinity));
    return maxLimit === Infinity ? null : maxLimit;
  }, [permissions]);

  const getFieldVisibility = useCallback((entity: string, fieldName: string): FieldVisibility => {
    if (!permissions) return 'HIDDEN';
    if (permissions.isSuperAdmin) return 'VISIBLE';
    
    return permissions.fieldRestrictions[entity]?.[fieldName] || 'VISIBLE';
  }, [permissions]);

  const invalidateCache = useCallback(() => {
    const cacheKey = `${userId}:${projectId}`;
    permissionCache.delete(cacheKey);
    const resolved = resolvePermissionsSync(userId, projectId);
    setPermissions(resolved);
  }, [userId, projectId]);

  return {
    permissions,
    loading,
    hasPermission,
    canApprove,
    getApprovalLimit,
    getFieldVisibility,
    invalidateCache,
  };
}

/**
 * Check SoD violations for a set of permissions
 */
export function checkSoDViolations(permissionIds: number[]): Array<{ ruleCode: string; ruleName: string; severity: 'WARNING' | 'BLOCK' }> {
  const violations: Array<{ ruleCode: string; ruleName: string; severity: 'WARNING' | 'BLOCK' }> = [];
  
  sodRules.forEach((rule) => {
    if (permissionIds.includes(rule.permissionAId) && permissionIds.includes(rule.permissionBId)) {
      violations.push({
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        severity: rule.severity,
      });
    }
  });
  
  return violations;
}
