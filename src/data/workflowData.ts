/**
 * Workflow Mock Data - Part 7
 * 
 * Mock data for Approval Centre, Task Centre, Exception Centre, and Notifications
 */

import type { 
  ApprovalItem, Task, Exception, Notification, 
  NotificationPreference, OutOfOffice 
} from '../types/workflow';

// ─── Approval Items ──────────────────────────────────────────────────────────

export const approvalItems: ApprovalItem[] = [
  {
    id: 1,
    entityType: 'purchase_order',
    entityNumber: 'PO-2026-000412',
    entityTitle: 'Steel Reinforcement - Grade Fe500D',
    requester: 'Mike Johnson',
    requesterId: 10,
    project: 'Metro Line Extension',
    projectId: 1,
    site: 'Site A - Downtown',
    siteId: 1,
    amount: 2450000,
    currency: 'INR',
    submittedAt: '2026-02-08T09:30:00Z',
    dueAt: '2026-02-10T17:00:00Z',
    slaState: 'at_risk',
    priority: 'high',
    status: 'pending',
    riskFlags: [
      {
        type: 'budget_exceeded',
        severity: 'high',
        message: 'Budget exceeded',
        details: 'This PO takes Material cost head to 103% of budget'
      }
    ],
    budgetImpact: {
      costHead: 'Material - Steel',
      currentSpend: 48500000,
      budget: 50000000,
      afterApproval: 50950000,
      percentageAfter: 103,
      isOverBudget: true
    },
    comparisonContext: {
      type: 'po',
      alternatives: [
        { vendor: 'Tata Steel Ltd', amount: 2450000, selected: true, reason: 'Best price, established vendor' },
        { vendor: 'JSW Steel', amount: 2580000, selected: false },
        { vendor: 'SAIL', amount: 2620000, selected: false }
      ]
    }
  },
  {
    id: 2,
    entityType: 'measurement_book',
    entityNumber: 'MB-2026-000088',
    entityTitle: 'Foundation Work - Block A',
    requester: 'John Smith',
    requesterId: 9,
    project: 'Commercial Tower Complex',
    projectId: 3,
    site: 'Main Site',
    siteId: 3,
    amount: 1850000,
    currency: 'INR',
    submittedAt: '2026-02-09T14:20:00Z',
    dueAt: '2026-02-11T17:00:00Z',
    slaState: 'on_track',
    priority: 'medium',
    status: 'pending',
    riskFlags: [],
    comparisonContext: {
      type: 'mb',
      previousValue: 1200000,
      cumulativeValue: 3050000
    }
  },
  {
    id: 3,
    entityType: 'ra_bill',
    entityNumber: 'RA-2026-000156',
    entityTitle: 'RA Bill #5 - Electrical Works',
    requester: 'David Park',
    requesterId: 4,
    project: 'Airport Terminal Expansion',
    projectId: 5,
    amount: 3200000,
    currency: 'INR',
    submittedAt: '2026-02-07T11:15:00Z',
    dueAt: '2026-02-09T17:00:00Z',
    slaState: 'overdue',
    priority: 'critical',
    status: 'pending',
    riskFlags: [
      {
        type: 'unusual_amount',
        severity: 'medium',
        message: 'Unusual amount',
        details: 'This bill is 45% higher than the previous bill for same work'
      }
    ],
    comparisonContext: {
      type: 'bill',
      previousValue: 2200000,
      cumulativeValue: 12500000
    }
  },
  {
    id: 4,
    entityType: 'purchase_requisition',
    entityNumber: 'PR-2026-000234',
    entityTitle: 'Cement - OPC 53 Grade',
    requester: 'Tom Brown',
    requesterId: 8,
    project: 'Metro Line Extension',
    projectId: 1,
    site: 'Site B - River Crossing',
    siteId: 2,
    amount: 850000,
    currency: 'INR',
    submittedAt: '2026-02-09T16:45:00Z',
    dueAt: '2026-02-12T17:00:00Z',
    slaState: 'on_track',
    priority: 'medium',
    status: 'pending',
    riskFlags: []
  },
  {
    id: 5,
    entityType: 'purchase_order',
    entityNumber: 'PO-2026-000415',
    entityTitle: 'Ready Mix Concrete - M30 Grade',
    requester: 'Mike Johnson',
    requesterId: 10,
    project: 'Commercial Tower Complex',
    projectId: 3,
    amount: 1250000,
    currency: 'INR',
    submittedAt: '2026-02-10T08:20:00Z',
    dueAt: '2026-02-13T17:00:00Z',
    slaState: 'on_track',
    priority: 'low',
    status: 'pending',
    riskFlags: [
      {
        type: 'vendor_hold',
        severity: 'high',
        message: 'Vendor on hold',
        details: 'Vendor ABC Concrete is currently on hold due to quality issues'
      }
    ]
  }
];

// ─── Approval History ────────────────────────────────────────────────────────

export const approvalHistory = [
  {
    id: 1,
    approver: 'Sarah Chen',
    approverId: 2,
    action: 'approve' as const,
    timestamp: '2026-02-08T15:30:00Z',
    comment: 'Approved. Vendor has good track record.',
    timeTaken: 180,
    slaMet: true
  },
  {
    id: 2,
    approver: 'Lisa Anderson',
    approverId: 5,
    action: 'return' as const,
    timestamp: '2026-02-07T11:20:00Z',
    comment: 'Please attach the comparative statement',
    timeTaken: 240,
    slaMet: true
  },
  {
    id: 3,
    approver: 'James Wilson',
    approverId: 6,
    action: 'approve' as const,
    timestamp: '2026-02-06T14:45:00Z',
    timeTaken: 120,
    slaMet: true
  }
];

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasks: Task[] = [
  {
    id: 1,
    taskNumber: 'TSK-2026-0001',
    title: 'Resolve boundary dispute at Ch. 4+200',
    description: 'Boundary dispute with adjacent property owner needs resolution before foundation work can proceed',
    taskType: 'manual',
    projectId: 1,
    projectName: 'Metro Line Extension',
    assignedTo: 3,
    assignedToName: 'Michael Torres',
    assignedBy: 2,
    assignedByName: 'Sarah Chen',
    assignedAt: '2026-02-05T10:00:00Z',
    dueAt: '2026-02-12T17:00:00Z',
    priority: 'high',
    status: 'in_progress',
    progressPercent: 40,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-09T14:30:00Z',
    comments: [
      {
        id: 1,
        userId: 3,
        userName: 'Michael Torres',
        comment: 'Met with property owner today. They are claiming additional compensation.',
        createdAt: '2026-02-09T14:30:00Z'
      }
    ],
    attachments: [],
    subtasks: []
  },
  {
    id: 2,
    taskNumber: 'TSK-2026-0002',
    title: 'Submit DPR for 15-Sep',
    description: 'Daily Progress Report submission',
    taskType: 'recurring',
    projectId: 1,
    projectName: 'Metro Line Extension',
    assignedTo: 3,
    assignedToName: 'Michael Torres',
    assignedBy: 1,
    assignedByName: 'System',
    assignedAt: '2026-02-10T06:00:00Z',
    dueAt: '2026-02-10T18:00:00Z',
    priority: 'medium',
    status: 'open',
    progressPercent: 0,
    recurrenceRule: 'FREQ=DAILY;BYHOUR=18',
    createdAt: '2026-02-10T06:00:00Z',
    updatedAt: '2026-02-10T06:00:00Z',
    comments: [],
    attachments: [],
    subtasks: []
  },
  {
    id: 3,
    taskNumber: 'TSK-2026-0003',
    title: 'Investigate negative stock: TMT 12mm at Store 3',
    description: 'Negative stock detected for TMT 12mm at Store 3. Investigate root cause and rectify.',
    taskType: 'alert',
    sourceEntity: 'stock',
    sourceId: 123,
    projectId: 1,
    projectName: 'Metro Line Extension',
    assignedTo: 8,
    assignedToName: 'Tom Brown',
    assignedBy: 1,
    assignedByName: 'System',
    assignedAt: '2026-02-10T11:30:00Z',
    dueAt: '2026-02-10T17:00:00Z',
    priority: 'critical',
    status: 'open',
    progressPercent: 0,
    createdAt: '2026-02-10T11:30:00Z',
    updatedAt: '2026-02-10T11:30:00Z',
    comments: [],
    attachments: [],
    subtasks: []
  },
  {
    id: 4,
    taskNumber: 'TSK-2026-0004',
    title: 'Correct and resubmit PR-2026-000188',
    description: 'Purchase requisition returned for correction. Please update the delivery schedule.',
    taskType: 'workflow',
    sourceEntity: 'purchase_requisition',
    sourceId: 188,
    projectId: 3,
    projectName: 'Commercial Tower Complex',
    assignedTo: 10,
    assignedToName: 'Mike Johnson',
    assignedBy: 5,
    assignedByName: 'Lisa Anderson',
    assignedAt: '2026-02-09T15:20:00Z',
    dueAt: '2026-02-11T17:00:00Z',
    priority: 'high',
    status: 'in_progress',
    progressPercent: 60,
    createdAt: '2026-02-09T15:20:00Z',
    updatedAt: '2026-02-10T09:15:00Z',
    comments: [
      {
        id: 2,
        userId: 10,
        userName: 'Mike Johnson',
        comment: 'Updated delivery schedule as requested. Resubmitting now.',
        createdAt: '2026-02-10T09:15:00Z'
      }
    ],
    attachments: [],
    subtasks: []
  },
  {
    id: 5,
    taskNumber: 'TSK-2026-0005',
    title: 'Weekly safety inspection',
    description: 'Conduct weekly safety inspection of all work fronts',
    taskType: 'recurring',
    projectId: 1,
    projectName: 'Metro Line Extension',
    assignedTo: 7,
    assignedToName: 'Emma Rodriguez',
    assignedBy: 1,
    assignedByName: 'System',
    assignedAt: '2026-02-10T08:00:00Z',
    dueAt: '2026-02-14T17:00:00Z',
    priority: 'medium',
    status: 'open',
    progressPercent: 0,
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z',
    comments: [],
    attachments: [],
    subtasks: []
  },
  {
    id: 6,
    taskNumber: 'TSK-2026-0006',
    title: 'Prepare period close checklist - January',
    description: 'Complete all items on the period close checklist for January 2026',
    taskType: 'checklist',
    projectId: 1,
    projectName: 'Metro Line Extension',
    assignedTo: 6,
    assignedToName: 'James Wilson',
    assignedBy: 2,
    assignedByName: 'Sarah Chen',
    assignedAt: '2026-02-01T09:00:00Z',
    dueAt: '2026-02-05T17:00:00Z',
    priority: 'high',
    status: 'completed',
    progressPercent: 100,
    completedAt: '2026-02-04T16:30:00Z',
    completedBy: 6,
    completionNote: 'All checklist items completed. Books closed successfully.',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-04T16:30:00Z',
    comments: [],
    attachments: [],
    subtasks: []
  }
];

// ─── Exceptions ──────────────────────────────────────────────────────────────

export const exceptions: Exception[] = [
  {
    id: 1,
    category: 'financial',
    type: 'budget_exceeded',
    title: 'Budget exceeded - Material cost head',
    description: 'Material cost head has exceeded budget by 3%. Current spend: ₹5.09 Cr vs Budget: ₹5.00 Cr',
    impact: 950000,
    impactUnit: 'INR',
    entityType: 'project',
    entityId: 1,
    projectId: 1,
    projectName: 'Metro Line Extension',
    raisedAt: '2026-02-10T08:30:00Z',
    status: 'open',
    age: 0
  },
  {
    id: 2,
    category: 'operational',
    type: 'negative_stock',
    title: 'Negative stock detected',
    description: 'TMT 12mm at Store 3 has negative stock of -2.5 MT',
    impact: 137500,
    impactUnit: 'INR',
    entityType: 'stock',
    entityId: 123,
    projectId: 1,
    projectName: 'Metro Line Extension',
    raisedAt: '2026-02-10T11:30:00Z',
    status: 'assigned',
    ownerId: 8,
    ownerName: 'Tom Brown',
    targetResolutionDate: '2026-02-10T17:00:00Z',
    age: 0
  },
  {
    id: 3,
    category: 'compliance',
    type: 'sod_violation',
    title: 'Segregation of duties violation',
    description: 'User has both procurement.purchase_order.create and procurement.purchase_order.approve permissions on Project 3',
    projectId: 3,
    projectName: 'Commercial Tower Complex',
    raisedAt: '2026-02-09T02:00:00Z',
    status: 'in_progress',
    ownerId: 1,
    ownerName: 'Admin User',
    targetResolutionDate: '2026-02-12T17:00:00Z',
    age: 1
  },
  {
    id: 4,
    category: 'process',
    type: 'approval_overdue',
    title: 'Approval pending beyond SLA',
    description: 'RA Bill RA-2026-000156 is 1 day overdue for approval',
    impact: 3200000,
    impactUnit: 'INR',
    entityType: 'ra_bill',
    entityId: 156,
    entityNumber: 'RA-2026-000156',
    projectId: 5,
    projectName: 'Airport Terminal Expansion',
    raisedAt: '2026-02-09T17:00:00Z',
    status: 'open',
    age: 1
  },
  {
    id: 5,
    category: 'operational',
    type: 'boq_exceeded',
    title: 'BOQ quantity exceeded',
    description: 'Excavation work at Site A has exceeded BOQ quantity by 15% without approved variation',
    impact: 450000,
    impactUnit: 'INR',
    entityType: 'activity',
    entityId: 456,
    projectId: 1,
    projectName: 'Metro Line Extension',
    raisedAt: '2026-02-08T14:20:00Z',
    status: 'assigned',
    ownerId: 2,
    ownerName: 'Sarah Chen',
    targetResolutionDate: '2026-02-11T17:00:00Z',
    age: 2
  },
  {
    id: 6,
    category: 'financial',
    type: 'receivable_90_plus',
    title: 'Receivable in 90+ day bucket',
    description: 'Client ABC Corp has outstanding receivable of ₹45 Lakhs in 90+ day bucket',
    impact: 4500000,
    impactUnit: 'INR',
    entityType: 'invoice',
    entityId: 789,
    projectId: 3,
    projectName: 'Commercial Tower Complex',
    raisedAt: '2026-02-07T09:00:00Z',
    status: 'in_progress',
    ownerId: 6,
    ownerName: 'James Wilson',
    targetResolutionDate: '2026-02-14T17:00:00Z',
    age: 3
  }
];

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications: Notification[] = [
  {
    id: 1,
    userId: 2,
    category: 'approval',
    priority: 'high',
    title: '5 purchase orders awaiting your approval',
    body: 'Total value: ₹1.25 Cr. Oldest: 2 days',
    entityType: 'purchase_order',
    actionRoute: '/approvals?entityType=purchase_order',
    projectId: 1,
    isRead: false,
    isActioned: false,
    createdAt: '2026-02-10T12:00:00Z',
    groupKey: 'approval_po_2',
    deliveries: [
      { id: 1, notificationId: 1, channel: 'in_app', status: 'sent', attempts: 1, sentAt: '2026-02-10T12:00:00Z' },
      { id: 2, notificationId: 1, channel: 'email', status: 'sent', attempts: 1, sentAt: '2026-02-10T12:00:05Z' }
    ]
  },
  {
    id: 2,
    userId: 2,
    category: 'task',
    priority: 'critical',
    title: 'Task overdue: Resolve boundary dispute',
    body: 'Task TSK-2026-0001 is 2 days overdue',
    entityType: 'task',
    entityId: 1,
    actionRoute: '/tasks/1',
    projectId: 1,
    isRead: false,
    isActioned: false,
    createdAt: '2026-02-10T06:00:00Z',
    deliveries: [
      { id: 3, notificationId: 2, channel: 'in_app', status: 'sent', attempts: 1, sentAt: '2026-02-10T06:00:00Z' },
      { id: 4, notificationId: 2, channel: 'push', status: 'sent', attempts: 1, sentAt: '2026-02-10T06:00:02Z' }
    ]
  },
  {
    id: 3,
    userId: 2,
    category: 'alert',
    priority: 'critical',
    title: 'Budget exceeded - Metro Line Extension',
    body: 'Material cost head exceeded budget by 3%',
    entityType: 'project',
    entityId: 1,
    actionRoute: '/projects/1/360',
    projectId: 1,
    isRead: true,
    readAt: '2026-02-10T09:00:00Z',
    isActioned: false,
    createdAt: '2026-02-10T08:30:00Z',
    deliveries: [
      { id: 5, notificationId: 3, channel: 'in_app', status: 'sent', attempts: 1, sentAt: '2026-02-10T08:30:00Z' },
      { id: 6, notificationId: 3, channel: 'email', status: 'sent', attempts: 1, sentAt: '2026-02-10T08:30:05Z' },
      { id: 7, notificationId: 3, channel: 'sms', status: 'sent', attempts: 1, sentAt: '2026-02-10T08:30:10Z' }
    ]
  },
  {
    id: 4,
    userId: 2,
    category: 'approval',
    priority: 'normal',
    title: 'Purchase order approved',
    body: 'PO-2026-000410 approved by Lisa Anderson',
    entityType: 'purchase_order',
    entityId: 410,
    actionRoute: '/objects/purchase_order/410',
    projectId: 1,
    isRead: true,
    readAt: '2026-02-09T16:00:00Z',
    isActioned: true,
    createdAt: '2026-02-09T15:30:00Z',
    deliveries: [
      { id: 8, notificationId: 4, channel: 'in_app', status: 'sent', attempts: 1, sentAt: '2026-02-09T15:30:00Z' }
    ]
  },
  {
    id: 5,
    userId: 2,
    category: 'system',
    priority: 'normal',
    title: 'Weekly digest - Project performance',
    body: 'View your weekly project performance summary',
    actionRoute: '/analytics/weekly-digest',
    isRead: false,
    isActioned: false,
    createdAt: '2026-02-10T08:00:00Z',
    deliveries: [
      { id: 9, notificationId: 5, channel: 'in_app', status: 'sent', attempts: 1, sentAt: '2026-02-10T08:00:00Z' },
      { id: 10, notificationId: 5, channel: 'email', status: 'sent', attempts: 1, sentAt: '2026-02-10T08:00:05Z' }
    ]
  }
];

// ─── Notification Preferences ────────────────────────────────────────────────

export const notificationPreferences: NotificationPreference[] = [
  {
    userId: 2,
    category: 'approval',
    inApp: true,
    push: true,
    email: true,
    sms: false,
    frequency: 'immediate'
  },
  {
    userId: 2,
    category: 'task',
    inApp: true,
    push: true,
    email: false,
    sms: false,
    frequency: 'immediate'
  },
  {
    userId: 2,
    category: 'alert',
    inApp: true,
    push: true,
    email: true,
    sms: true,
    frequency: 'immediate'
  },
  {
    userId: 2,
    category: 'mention',
    inApp: true,
    push: false,
    email: false,
    sms: false,
    frequency: 'immediate'
  },
  {
    userId: 2,
    category: 'system',
    inApp: true,
    push: false,
    email: true,
    sms: false,
    frequency: 'daily',
    quietStart: '22:00',
    quietEnd: '08:00'
  },
  {
    userId: 2,
    category: 'digest',
    inApp: true,
    push: false,
    email: true,
    sms: false,
    frequency: 'weekly'
  }
];

// ─── Out of Office ───────────────────────────────────────────────────────────

export const outOfOffice: OutOfOffice | null = null; // Currently no one is OOO

/*
export const outOfOffice: OutOfOffice = {
  userId: 2,
  startDate: '2026-02-15T00:00:00Z',
  endDate: '2026-02-20T23:59:59Z',
  substituteId: 4,
  substituteName: 'David Park',
  reason: 'Annual leave'
};
*/
