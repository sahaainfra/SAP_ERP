/**
 * Real-time Engine Hook - Part 4
 * 
 * Manages WebSocket connection, event processing, KPI computation,
 * alert evaluation, and SLA tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  EventEnvelope,
  KpiValue,
  KpiDefinition,
  Alert,
  AlertRule,
  SlaTracking,
  ConnectionStatus,
  WebSocketMessage,
  EventType,
} from '../types/realtime';
import { kpiDefinitions, alertRules } from '../data/eventCatalogue';
import { usePermissions } from './usePermissions';

// ─── Event Catalogue ─────────────────────────────────────────────────────────

const eventCatalogue: Record<EventType, string> = {
  'project.created': 'Project created',
  'project.status_changed': 'Project status changed',
  'project.progress_updated': 'Project progress updated',
  'project.budget_revised': 'Project budget revised',
  'project.milestone_reached': 'Milestone reached',
  'project.milestone_missed': 'Milestone missed',
  'purchase_order.created': 'Purchase order created',
  'purchase_order.approved': 'Purchase order approved',
  'purchase_order.rejected': 'Purchase order rejected',
  'purchase_order.delivery_overdue': 'PO delivery overdue',
  'purchase_requisition.submitted': 'PR submitted',
  'grn.created': 'GRN created',
  'grn.approved': 'GRN approved',
  'stock.received': 'Stock received',
  'stock.issued': 'Stock issued',
  'stock.below_reorder': 'Stock below reorder level',
  'stock.negative': 'Negative stock detected',
  'dpr.submitted': 'DPR submitted',
  'measurement_book.certified': 'Measurement book certified',
  'progress.updated': 'Progress updated',
  'ra_bill.created': 'RA bill created',
  'ra_bill.certified': 'RA bill certified',
  'ra_bill.approved': 'RA bill approved',
  'invoice.overdue': 'Invoice overdue',
  'payment.made': 'Payment made',
  'receipt.received': 'Receipt received',
  'budget.exceeded': 'Budget exceeded',
  'budget.threshold_breached': 'Budget threshold breached',
  'wir.raised': 'WIR raised',
  'ncr.raised': 'NCR raised',
  'ncr.overdue': 'NCR overdue',
  'incident.reported': 'Safety incident reported',
  'approval.requested': 'Approval requested',
  'approval.granted': 'Approval granted',
  'approval.rejected': 'Approval rejected',
  'task.assigned': 'Task assigned',
  'task.completed': 'Task completed',
  'task.overdue': 'Task overdue',
  'sla.at_risk': 'SLA at risk',
  'sla.breached': 'SLA breached',
  'permission.changed': 'Permission changed',
  'assignment.changed': 'Assignment changed',
};

// ─── KPI Computation Engine ──────────────────────────────────────────────────

function computeKpiValue(
  definition: KpiDefinition,
  projectId: number | null,
  events: EventEnvelope[]
): KpiValue {
  // Simulate KPI computation based on events
  // In production, this would query the database with permission filtering
  
  const relevantEvents = events.filter(e => 
    definition.kpiKey.includes(e.entityType) ||
    e.affectedKpis.includes(definition.kpiKey)
  );

  // Simulate computation time
  const computeMs = Math.floor(Math.random() * 50) + 10;
  
  // Generate a value based on the KPI type
  let value: number | null = null;
  let target: number | null = null;
  
  switch (definition.calculationType) {
    case 'SUM':
      value = relevantEvents.length * 1000;
      target = 100000;
      break;
    case 'COUNT':
      value = relevantEvents.length;
      target = 50;
      break;
    case 'AVG':
      value = relevantEvents.length > 0 ? 75.5 : null;
      target = 80;
      break;
    case 'RATIO':
      value = relevantEvents.length > 0 ? 0.85 : null;
      target = 0.9;
      break;
    case 'VARIANCE':
      value = -5000;
      target = 0;
      break;
    default:
      value = null;
  }

  // Calculate variance
  const variance = value !== null && target !== null ? value - target : null;
  const variancePercent = variance !== null && target !== null && target !== 0
    ? (variance / target) * 100
    : null;

  // Determine trend
  const trend = variance !== null
    ? variance > 0 ? 'up' : variance < 0 ? 'down' : 'stable'
    : 'stable';

  // Determine status based on thresholds
  let status: 'good' | 'warning' | 'critical' | 'neutral' = 'neutral';
  
  if (value !== null && target !== null && variancePercent !== null) {
    const absVariance = Math.abs(variancePercent);
    
    if (definition.goodDirection === 'UP') {
      if (variancePercent >= 0) status = 'good';
      else if (absVariance <= 10) status = 'warning';
      else status = 'critical';
    } else if (definition.goodDirection === 'DOWN') {
      if (variancePercent <= 0) status = 'good';
      else if (absVariance <= 10) status = 'warning';
      else status = 'critical';
    } else {
      if (absVariance <= 5) status = 'good';
      else if (absVariance <= 15) status = 'warning';
      else status = 'critical';
    }
  }

  return {
    kpiKey: definition.kpiKey,
    value,
    previousValue: value !== null ? value * 0.95 : null,
    target,
    variance,
    variancePercent,
    trend,
    status,
    unit: definition.unit || '',
    asOf: new Date().toISOString(),
    isPartial: false,
    computeMs,
    rowCount: relevantEvents.length,
    fromCache: false,
    cacheAgeSeconds: 0,
  };
}

// ─── Alert Evaluation Engine ─────────────────────────────────────────────────

function evaluateAlertRules(
  rules: AlertRule[],
  events: EventEnvelope[],
  projectId: number | null
): Alert[] {
  const alerts: Alert[] = [];
  
  rules.forEach(rule => {
    // Check if rule is active and applies to this project
    if (!rule.isActive) return;
    if (rule.projectId && rule.projectId !== projectId) return;
    
    // Evaluate based on trigger type
    if (rule.triggerType === 'EVENT' && rule.triggerEvent) {
      const matchingEvents = events.filter(e => e.eventType === rule.triggerEvent);
      
      if (matchingEvents.length > 0) {
        const latestEvent = matchingEvents[matchingEvents.length - 1];
        
        alerts.push({
          id: Math.floor(Math.random() * 1000000),
          ruleId: rule.id,
          ruleCode: rule.ruleCode,
          severity: rule.severity,
          title: rule.ruleName,
          message: rule.messageTemplate.replace(
            '{entity}',
            latestEvent.entityType
          ).replace(
            '{id}',
            latestEvent.entityId.toString()
          ),
          entityType: latestEvent.entityType,
          entityId: latestEvent.entityId,
          companyId: latestEvent.scope.companyId,
          projectId: latestEvent.scope.projectId,
          siteId: latestEvent.scope.siteId,
          status: 'OPEN',
          raisedAt: latestEvent.occurredAt,
          occurrenceCount: matchingEvents.length,
          lastOccurredAt: latestEvent.occurredAt,
        });
      }
    }
  });
  
  return alerts;
}

// ─── Main Hook ───────────────────────────────────────────────────────────────

export function useRealtimeEngine(userId: number, projectId: number | null) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [kpiValues, setKpiValues] = useState<Map<string, KpiValue>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [slaTracking, setSlaTracking] = useState<SlaTracking[]>([]);
  const [lastSequence, setLastSequence] = useState(0);
  
  const wsRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  
  const { permissions } = usePermissions(userId, projectId);

  // ─── WebSocket Connection Simulation ─────────────────────────────────────
  
  const connect = useCallback(() => {
    console.log('[RealtimeEngine] Connecting...');
    setConnectionStatus('reconnecting');
    
    // Simulate connection delay
    setTimeout(() => {
      console.log('[RealtimeEngine] Connected');
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      
      // Start event simulation
      startEventSimulation();
    }, 1000);
  }, []);

  const disconnect = useCallback(() => {
    console.log('[RealtimeEngine] Disconnecting...');
    setConnectionStatus('offline');
    if (wsRef.current) {
      clearInterval(wsRef.current);
      wsRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectAttempts.current < 5) {
      reconnectAttempts.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      console.log(`[RealtimeEngine] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      setTimeout(connect, delay);
    }
  }, [connect]);

  // ─── Event Simulation ────────────────────────────────────────────────────
  
  const startEventSimulation = useCallback(() => {
    // Simulate events arriving every 5-15 seconds
    const interval = setInterval(() => {
      if (connectionStatus !== 'connected') return;
      
      const eventTypes = Object.keys(eventCatalogue) as EventType[];
      const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const newEvent: EventEnvelope = {
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventType: randomEventType,
        occurredAt: new Date().toISOString(),
        actorUserId: userId,
        entityType: randomEventType.split('.')[0],
        entityId: Math.floor(Math.random() * 10000) + 1,
        scope: {
          companyId: 1,
          projectId: projectId || 1,
          siteId: Math.floor(Math.random() * 5) + 1,
          financialYear: '2026-27',
        },
        changes: {
          status: { from: 'PENDING', to: 'APPROVED' },
        },
        affectedKpis: [
          `${randomEventType.split('.')[0]}.count`,
          `${randomEventType.split('.')[0]}.value`,
        ],
        version: 1,
      };
      
      // Add event to outbox
      setEvents(prev => [...prev.slice(-99), newEvent]); // Keep last 100 events
      setLastSequence(prev => prev + 1);
      
      console.log('[RealtimeEngine] Event received:', newEvent.eventType);
      
      // Process event
      processEvent(newEvent);
    }, Math.random() * 10000 + 5000);
    
    wsRef.current = interval as any;
  }, [connectionStatus, userId, projectId]);

  // ─── Event Processing ────────────────────────────────────────────────────
  
  const processEvent = useCallback((event: EventEnvelope) => {
    // Update KPIs
    const affectedKpiKeys = event.affectedKpis;
    
    affectedKpiKeys.forEach(kpiKey => {
      const definition = kpiDefinitions.find(k => k.kpiKey === kpiKey);
      if (definition) {
        const kpiValue = computeKpiValue(definition, projectId, events);
        setKpiValues(prev => {
          const newMap = new Map(prev);
          newMap.set(kpiKey, kpiValue);
          return newMap;
        });
      }
    });
    
    // Evaluate alert rules
    const newAlerts = evaluateAlertRules(alertRules, [...events, event], projectId);
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
    }
  }, [events, projectId]);

  // ─── KPI Management ──────────────────────────────────────────────────────
  
  const getKpiValue = useCallback((kpiKey: string): KpiValue | null => {
    return kpiValues.get(kpiKey) || null;
  }, [kpiValues]);

  const refreshKpi = useCallback((kpiKey: string) => {
    const definition = kpiDefinitions.find(k => k.kpiKey === kpiKey);
    if (definition) {
      const kpiValue = computeKpiValue(definition, projectId, events);
      setKpiValues(prev => {
        const newMap = new Map(prev);
        newMap.set(kpiKey, kpiValue);
        return newMap;
      });
    }
  }, [projectId, events]);

  const refreshAllKpis = useCallback(() => {
    const newValues = new Map<string, KpiValue>();
    
    kpiDefinitions.forEach(definition => {
      const kpiValue = computeKpiValue(definition, projectId, events);
      newValues.set(definition.kpiKey, kpiValue);
    });
    
    setKpiValues(newValues);
  }, [projectId, events]);

  // ─── Alert Management ────────────────────────────────────────────────────
  
  const acknowledgeAlert = useCallback((alertId: number) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { 
            ...a, 
            status: 'ACKNOWLEDGED' as const,
            acknowledgedBy: userId,
            acknowledgedAt: new Date().toISOString(),
          }
        : a
    ));
  }, [userId]);

  const resolveAlert = useCallback((alertId: number, note: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { 
            ...a, 
            status: 'RESOLVED' as const,
            resolvedBy: userId,
            resolvedAt: new Date().toISOString(),
            resolutionNote: note,
          }
        : a
    ));
  }, [userId]);

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Auto-refresh KPIs every 30 seconds
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(() => {
        refreshAllKpis();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus, refreshAllKpis]);

  return {
    // Connection
    connectionStatus,
    connect,
    disconnect,
    reconnect,
    lastSequence,
    
    // Events
    events,
    
    // KPIs
    kpiValues,
    getKpiValue,
    refreshKpi,
    refreshAllKpis,
    
    // Alerts
    alerts,
    acknowledgeAlert,
    resolveAlert,
    
    // SLA
    slaTracking,
  };
}
