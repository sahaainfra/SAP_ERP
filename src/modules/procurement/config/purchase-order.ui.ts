/**
 * Part 18 — Purchase Order UI Metadata
 * 
 * Real example of entity UI metadata that drives generated screens.
 * This single object produces the PO list, object page, forms, and actions.
 */

import { EntityUiMetadata } from '../../../platform/ui/metadata/types';

export const PurchaseOrderUi: EntityUiMetadata = {
  entity: 'purchaseOrder',
  label: {
    singular: 'Purchase Order',
    plural: 'Purchase Orders',
  },
  route: '/procurement/purchase-orders',
  api: '/api/dx/v1/procurement/purchase-orders',
  permissionPrefix: 'procure.po',
  documentType: 'PO',

  fields: {
    documentNumber: {
      label: 'PO Number',
      shortLabel: 'PO No.',
      type: 'text',
      semantic: 'documentNumber',
      filterable: true,
      sortable: true,
      searchable: true,
    },
    documentDate: {
      label: 'PO Date',
      type: 'date',
      filterable: true,
      sortable: true,
    },
    vendor: {
      label: 'Vendor',
      type: 'reference',
      searchable: true,
      filterable: true,
      reference: {
        entity: 'vendor',
        displayField: 'name',
        searchApi: '/api/dx/v1/masters/vendors',
      },
    },
    project: {
      label: 'Project',
      type: 'reference',
      filterable: true,
      reference: {
        entity: 'project',
        displayField: 'name',
        searchApi: '/api/dx/v1/masters/projects',
      },
    },
    totalValue: {
      label: 'PO Value',
      type: 'money',
      semantic: 'amount',
      currencyField: 'currency',
      aggregate: 'SUM',
      sortable: true,
      filterable: true,
      permission: 'procure.po.view_rates',
    },
    openCommitment: {
      label: 'Open Commitment',
      type: 'money',
      aggregate: 'SUM',
      permission: 'procure.po.view_rates',
    },
    status: {
      label: 'Status',
      type: 'status',
      semantic: 'status',
      filterable: true,
      enumValues: [
        { value: 'DRAFT', label: 'Draft', state: 'NEUTRAL', icon: 'draft' },
        { value: 'PENDING_APPROVAL', label: 'Pending Approval', state: 'WARNING', icon: 'pending' },
        { value: 'APPROVED', label: 'Approved', state: 'GOOD', icon: 'accept' },
        { value: 'RELEASED', label: 'Released', state: 'GOOD', icon: 'sent' },
        { value: 'PARTIALLY_EXECUTED', label: 'Part Received', state: 'WARNING', icon: 'progress' },
        { value: 'CLOSED', label: 'Closed', state: 'NEUTRAL', icon: 'complete' },
        { value: 'CANCELLED', label: 'Cancelled', state: 'CRITICAL', icon: 'decline' },
      ],
    },
    deliveryDate: {
      label: 'Delivery Due',
      type: 'date',
      filterable: true,
      criticality: 'deliveryDate < today && status != "CLOSED" ? "CRITICAL" : "NEUTRAL"',
    },
    budgetStatus: {
      label: 'Budget',
      type: 'enum',
      enumValues: [
        { value: 'WITHIN', label: 'Within', state: 'GOOD' },
        { value: 'EXCEEDED', label: 'Exceeded', state: 'CRITICAL' },
        { value: 'OVERRIDDEN', label: 'Overridden', state: 'WARNING' },
      ],
    },
    currency: {
      label: 'Currency',
      type: 'text',
      visible: false, // Hidden, used for money field pairing
    },
    poType: {
      label: 'PO Type',
      type: 'enum',
      filterable: true,
      enumValues: [
        { value: 'STANDARD', label: 'Standard' },
        { value: 'BLANKET', label: 'Blanket' },
        { value: 'CONTRACT', label: 'Contract' },
      ],
    },
    costCode: {
      label: 'Cost Code',
      type: 'reference',
      filterable: true,
      reference: {
        entity: 'costCode',
        displayField: 'code',
        searchApi: '/api/dx/v1/masters/cost-codes',
      },
    },
    createdBy: {
      label: 'Created By',
      type: 'reference',
      filterable: true,
      reference: {
        entity: 'user',
        displayField: 'name',
        searchApi: '/api/dx/v1/admin/users',
      },
    },
  },

  listReport: {
    defaultFilters: ['project', 'status', 'documentDate', 'vendor'],
    advancedFilters: ['poType', 'costCode', 'budgetStatus', 'deliveryDate', 'createdBy'],
    columns: [
      { field: 'documentNumber', importance: 1, width: 160 },
      { field: 'vendor', importance: 1 },
      { field: 'documentDate', importance: 2, width: 110 },
      { field: 'project', importance: 2 },
      { field: 'totalValue', importance: 1, width: 140 },
      { field: 'openCommitment', importance: 3, width: 140 },
      { field: 'deliveryDate', importance: 3, width: 120 },
      { field: 'status', importance: 1, width: 150 },
    ],
    defaultSort: [{ field: 'documentDate', dir: 'desc' }],
    totals: ['totalValue', 'openCommitment'],
    kpiHeader: ['procure.committed_value', 'procure.open_po_count', 'procure.overdue_deliveries'],
    variants: true,
    massActions: ['export', 'print', 'shortClose'],
    quickFilters: [
      { label: 'Awaiting my approval', filter: 'pendingWithMe eq true', badge: 'approvals' },
      { label: 'Overdue delivery', filter: 'deliveryDate lt today and status ne "CLOSED"' },
      { label: 'Budget exceeded', filter: 'budgetStatus eq "EXCEEDED"' },
    ],
    emptyState: {
      title: 'No purchase orders',
      body: 'Approved comparatives become POs here.',
      action: 'create',
    },
    rowNavigation: 'objectPage',
    exportable: true,
  },

  cardConfig: {
    primary: 'documentNumber',
    secondary: ['vendor', 'documentDate', 'project'],
    metric: { field: 'totalValue' },
    status: 'status',
    actions: ['approve', 'view'],
    expand: ['openCommitment', 'deliveryDate', 'budgetStatus', 'poType'],
    avatar: { field: 'vendor', type: 'initials' },
  },

  objectPage: {
    headerFields: ['vendor', 'documentDate', 'totalValue', 'status', 'budgetStatus'],
    headerKpis: ['po.received_pct', 'po.invoiced_pct', 'po.paid_pct'],
    sections: [
      {
        id: 'general',
        label: 'General',
        type: 'form',
        fields: ['documentNumber', 'documentDate', 'vendor', 'project', 'poType', 'costCode', 'deliveryDate'],
      },
      {
        id: 'lines',
        label: 'Items',
        type: 'table',
        entity: 'purchaseOrderLine',
        totals: ['amount'],
        editable: 'status eq "DRAFT"',
      },
      {
        id: 'schedule',
        label: 'Delivery Schedule',
        type: 'table',
        entity: 'poDeliverySchedule',
      },
      {
        id: 'receipts',
        label: 'Receipts',
        type: 'table',
        entity: 'grn',
        filter: 'poId eq {id}',
      },
      {
        id: 'invoices',
        label: 'Invoices & Payments',
        type: 'table',
        entity: 'payable',
        permission: 'finance.payable.view',
      },
      {
        id: 'amendments',
        label: 'Amendments',
        type: 'timeline',
        entity: 'poAmendment',
      },
      {
        id: 'workflow',
        label: 'Approval Trail',
        type: 'workflow',
      },
      {
        id: 'documents',
        label: 'Attachments',
        type: 'attachments',
      },
      {
        id: 'audit',
        label: 'Change History',
        type: 'audit',
        permission: 'admin.audit.view',
      },
    ],
    relatedApps: [
      { label: 'Vendor 360', route: '/masters/vendors/{vendorId}' },
      { label: 'Budget position', route: '/finance/budget?costCode={costCodeId}' },
    ],
  },

  actions: [
    {
      name: 'submit',
      label: 'Submit for Approval',
      permission: 'procure.po.update',
      visible: 'status eq "DRAFT"',
      emphasis: 'primary',
    },
    {
      name: 'approve',
      label: 'Approve',
      permission: 'procure.po.approve',
      visible: 'status eq "PENDING_APPROVAL" and pendingWithMe',
      emphasis: 'primary',
    },
    {
      name: 'release',
      label: 'Release to Vendor',
      permission: 'procure.po.release',
      visible: 'status eq "APPROVED"',
      emphasis: 'primary',
      confirm: {
        title: 'Release PO?',
        body: 'The vendor will be notified and the commitment booked.',
      },
    },
    {
      name: 'amend',
      label: 'Amend',
      permission: 'procure.po.amend',
      visible: 'status in ("RELEASED","PARTIALLY_EXECUTED")',
      dialog: 'PoAmendmentDialog',
    },
    {
      name: 'shortClose',
      label: 'Short Close',
      permission: 'procure.po.short_close',
      visible: 'status eq "PARTIALLY_EXECUTED"',
      requiresReason: true,
    },
    {
      name: 'cancel',
      label: 'Cancel',
      permission: 'procure.po.cancel',
      visible: 'status in ("DRAFT","APPROVED") and receivedValue eq 0',
      requiresReason: true,
      emphasis: 'negative',
    },
    {
      name: 'print',
      label: 'Print PO',
      permission: 'procure.po.print',
      templates: ['PO_STANDARD'],
    },
  ],
};
