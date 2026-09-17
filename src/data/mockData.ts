export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  location: string;
  status: 'active' | 'on-hold' | 'completed' | 'delayed';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  milestones: { total: number; completed: number };
  safety: { incidents: number; score: number };
}

export interface KPIData {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'positive' | 'negative' | 'neutral' | 'critical';
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate: string;
  project: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  project?: string;
  read: boolean;
}

export interface Approval {
  id: string;
  title: string;
  requester: string;
  amount: number;
  type: 'purchase' | 'change-order' | 'payment' | 'variation';
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  project: string;
  priority: 'urgent' | 'normal' | 'low';
}

export const projects: Project[] = [
  {
    id: 'PRJ-001',
    name: 'Metro Line Extension Phase 2',
    code: 'MLE-P2',
    client: 'City Transit Authority',
    location: 'Downtown Corridor',
    status: 'active',
    progress: 67,
    budget: 245000000,
    spent: 164150000,
    startDate: '2024-03-15',
    endDate: '2026-09-30',
    manager: 'Sarah Chen',
    risk: 'medium',
    milestones: { total: 24, completed: 16 },
    safety: { incidents: 0, score: 98 }
  },
  {
    id: 'PRJ-002',
    name: 'Highway Bridge Rehabilitation',
    code: 'HBR-01',
    client: 'State DOT',
    location: 'River Crossing, Sector 7',
    status: 'active',
    progress: 42,
    budget: 89000000,
    spent: 37380000,
    startDate: '2024-08-01',
    endDate: '2026-12-15',
    manager: 'Michael Torres',
    risk: 'high',
    milestones: { total: 18, completed: 7 },
    safety: { incidents: 1, score: 91 }
  },
  {
    id: 'PRJ-003',
    name: 'Commercial Tower Complex',
    code: 'CTC-03',
    client: 'Apex Developments',
    location: 'Business District',
    status: 'active',
    progress: 85,
    budget: 156000000,
    spent: 132600000,
    startDate: '2023-06-01',
    endDate: '2025-12-31',
    manager: 'David Park',
    risk: 'low',
    milestones: { total: 32, completed: 27 },
    safety: { incidents: 0, score: 99 }
  },
  {
    id: 'PRJ-004',
    name: 'Water Treatment Plant Upgrade',
    code: 'WTP-04',
    client: 'Municipal Water Board',
    location: 'Industrial Zone East',
    status: 'delayed',
    progress: 28,
    budget: 67000000,
    spent: 24120000,
    startDate: '2024-01-15',
    endDate: '2026-06-30',
    manager: 'Lisa Anderson',
    risk: 'critical',
    milestones: { total: 20, completed: 5 },
    safety: { incidents: 2, score: 84 }
  },
  {
    id: 'PRJ-005',
    name: 'Airport Terminal Expansion',
    code: 'ATE-05',
    client: 'International Airport Authority',
    location: 'Airport Zone',
    status: 'active',
    progress: 55,
    budget: 320000000,
    spent: 176000000,
    startDate: '2024-02-01',
    endDate: '2027-03-31',
    manager: 'James Wilson',
    risk: 'medium',
    milestones: { total: 40, completed: 22 },
    safety: { incidents: 0, score: 97 }
  },
  {
    id: 'PRJ-006',
    name: 'Solar Farm Infrastructure',
    code: 'SFI-06',
    client: 'Green Energy Corp',
    location: 'Desert Region, Block C',
    status: 'on-hold',
    progress: 15,
    budget: 45000000,
    spent: 6750000,
    startDate: '2024-11-01',
    endDate: '2026-04-30',
    manager: 'Emma Rodriguez',
    risk: 'low',
    milestones: { total: 12, completed: 2 },
    safety: { incidents: 0, score: 100 }
  }
];

export const kpiData: Record<string, KPIData> = {
  totalRevenue: { label: 'Total Revenue', value: 912.4, unit: 'M', trend: 'up', trendValue: 12.3, status: 'positive' },
  activeProjects: { label: 'Active Projects', value: 5, unit: '', trend: 'stable', trendValue: 0, status: 'neutral' },
  avgProgress: { label: 'Avg. Progress', value: 55.4, unit: '%', trend: 'up', trendValue: 3.2, status: 'positive' },
  budgetUtilization: { label: 'Budget Utilization', value: 72.8, unit: '%', trend: 'up', trendValue: 5.1, status: 'neutral' },
  safetyScore: { label: 'Safety Score', value: 94.8, unit: '%', trend: 'up', trendValue: 1.2, status: 'positive' },
  onTimeDelivery: { label: 'On-Time Delivery', value: 78, unit: '%', trend: 'down', trendValue: 2.4, status: 'negative' },
  resourceUtilization: { label: 'Resource Utilization', value: 86, unit: '%', trend: 'up', trendValue: 4.5, status: 'positive' },
  openRFIs: { label: 'Open RFIs', value: 23, unit: '', trend: 'down', trendValue: 8, status: 'positive' }
};

export const tasks: Task[] = [
  { id: 'TSK-001', title: 'Review structural drawings for Bridge Section C', assignee: 'John Smith', priority: 'high', status: 'in-progress', dueDate: '2025-02-15', project: 'HBR-01' },
  { id: 'TSK-002', title: 'Submit monthly progress report', assignee: 'Sarah Chen', priority: 'medium', status: 'pending', dueDate: '2025-02-10', project: 'MLE-P2' },
  { id: 'TSK-003', title: 'Inspect concrete batch quality', assignee: 'Mike Johnson', priority: 'high', status: 'overdue', dueDate: '2025-02-08', project: 'CTC-03' },
  { id: 'TSK-004', title: 'Process subcontractor payment #47', assignee: 'Lisa Anderson', priority: 'medium', status: 'pending', dueDate: '2025-02-12', project: 'WTP-04' },
  { id: 'TSK-005', title: 'Update safety compliance checklist', assignee: 'Tom Brown', priority: 'low', status: 'completed', dueDate: '2025-02-05', project: 'ATE-05' },
  { id: 'TSK-006', title: 'Coordinate crane scheduling', assignee: 'David Park', priority: 'high', status: 'in-progress', dueDate: '2025-02-14', project: 'CTC-03' },
  { id: 'TSK-007', title: 'Environmental impact assessment review', assignee: 'Emma Rodriguez', priority: 'medium', status: 'pending', dueDate: '2025-02-20', project: 'SFI-06' },
  { id: 'TSK-008', title: 'Material procurement for electrical works', assignee: 'James Wilson', priority: 'high', status: 'overdue', dueDate: '2025-02-07', project: 'ATE-05' },
];

export const alerts: Alert[] = [
  { id: 'ALT-001', type: 'critical', message: 'Budget overrun detected on Water Treatment Plant - 12% over threshold', timestamp: '2 min ago', project: 'WTP-04', read: false },
  { id: 'ALT-002', type: 'warning', message: 'Safety incident reported at Highway Bridge site', timestamp: '15 min ago', project: 'HBR-01', read: false },
  { id: 'ALT-003', type: 'info', message: 'Monthly progress report due for Metro Line Extension', timestamp: '1 hour ago', project: 'MLE-P2', read: false },
  { id: 'ALT-004', type: 'success', message: 'Commercial Tower Phase 3 milestone completed ahead of schedule', timestamp: '2 hours ago', project: 'CTC-03', read: true },
  { id: 'ALT-005', type: 'warning', message: 'Material delivery delayed - Steel reinforcement batch #89', timestamp: '3 hours ago', project: 'ATE-05', read: true },
  { id: 'ALT-006', type: 'critical', message: 'Subcontractor non-compliance notice - Electrical works', timestamp: '4 hours ago', project: 'MLE-P2', read: true },
];

export const approvals: Approval[] = [
  { id: 'APR-001', title: 'Steel Reinforcement Purchase Order', requester: 'Mike Johnson', amount: 2450000, type: 'purchase', status: 'pending', submittedDate: '2025-02-08', project: 'CTC-03', priority: 'urgent' },
  { id: 'APR-002', title: 'Design Change Order - Foundation', requester: 'Sarah Chen', amount: 890000, type: 'change-order', status: 'pending', submittedDate: '2025-02-07', project: 'MLE-P2', priority: 'normal' },
  { id: 'APR-003', title: 'Subcontractor Payment - Electrical', requester: 'James Wilson', amount: 1200000, type: 'payment', status: 'pending', submittedDate: '2025-02-06', project: 'ATE-05', priority: 'normal' },
  { id: 'APR-004', title: 'Variation Order - Drainage System', requester: 'Lisa Anderson', amount: 560000, type: 'variation', status: 'pending', submittedDate: '2025-02-05', project: 'WTP-04', priority: 'low' },
  { id: 'APR-005', title: 'Crane Rental Extension', requester: 'David Park', amount: 340000, type: 'purchase', status: 'approved', submittedDate: '2025-02-04', project: 'CTC-03', priority: 'urgent' },
];

export const monthlyProgress = [
  { month: 'Sep', planned: 45, actual: 43 },
  { month: 'Oct', planned: 52, actual: 50 },
  { month: 'Nov', planned: 58, actual: 55 },
  { month: 'Dec', planned: 63, actual: 61 },
  { month: 'Jan', planned: 68, actual: 65 },
  { month: 'Feb', planned: 72, actual: 69 },
];

export const budgetBreakdown = [
  { category: 'Materials', budget: 35, spent: 28 },
  { category: 'Labor', budget: 25, spent: 22 },
  { category: 'Equipment', budget: 18, spent: 16 },
  { category: 'Subcontractors', budget: 15, spent: 12 },
  { category: 'Overhead', budget: 7, spent: 5 },
];

export const resourceAllocation = [
  { role: 'Engineers', allocated: 45, utilized: 38 },
  { role: 'Supervisors', allocated: 28, utilized: 26 },
  { role: 'Skilled Workers', allocated: 120, utilized: 105 },
  { role: 'Equipment Operators', allocated: 35, utilized: 30 },
  { role: 'Safety Officers', allocated: 12, utilized: 12 },
];

export const recentActivity = [
  { time: '09:45', action: 'Progress update submitted', user: 'Sarah Chen', project: 'Metro Line Extension' },
  { time: '09:32', action: 'Purchase order approved', user: 'System', project: 'Commercial Tower' },
  { time: '09:15', action: 'Safety inspection completed', user: 'Tom Brown', project: 'Airport Terminal' },
  { time: '08:58', action: 'RFI #234 submitted', user: 'John Smith', project: 'Highway Bridge' },
  { time: '08:40', action: 'Daily report generated', user: 'System', project: 'All Projects' },
  { time: '08:22', action: 'Material receipt logged', user: 'Mike Johnson', project: 'Commercial Tower' },
  { time: '08:05', action: 'Change order request created', user: 'Lisa Anderson', project: 'Water Treatment' },
];

export const evmData = [
  { month: 'Sep', pv: 45, ev: 43, ac: 44 },
  { month: 'Oct', pv: 52, ev: 50, ac: 51 },
  { month: 'Nov', pv: 58, ev: 55, ac: 57 },
  { month: 'Dec', pv: 63, ev: 61, ac: 63 },
  { month: 'Jan', pv: 68, ev: 65, ac: 68 },
  { month: 'Feb', pv: 72, ev: 69, ac: 73 },
];
