/**
 * Part 21 — Project 360 Service
 * 
 * The single screen that answers "how is this project doing?"
 * Computes health score from weighted components, all admin-configurable.
 */

import {
  Project360Payload,
  Project360Header,
  HealthScore,
  HealthScoreComponent,
  HealthScoreWeights,
  DEFAULT_HEALTH_SCORE_WEIGHTS,
  Project360Section,
} from './role-dashboard-types';
import { Actor } from '../permission/actor';

export class Project360Service {
  private healthScoreWeights: Map<number, HealthScoreWeights> = new Map(); // projectId -> weights

  /**
   * Get full Project 360 payload
   */
  async getProject360(projectId: number, actor: Actor): Promise<Project360Payload> {
    // Check permission
    if (!actor.can('project.project.view', projectId)) {
      throw new Error('Permission denied: project.project.view');
    }

    // Fetch project header
    const header = await this.fetchProjectHeader(projectId);

    // Compute health score
    const healthScore = await this.computeHealthScore(projectId, actor);

    // Fetch all 10 sections
    const sections = await this.fetchAllSections(projectId, actor);

    return {
      projectId,
      header,
      healthScore,
      sections,
    };
  }

  /**
   * Compute health score from weighted components
   */
  async computeHealthScore(projectId: number, actor: Actor): Promise<HealthScore> {
    const weights = this.healthScoreWeights.get(projectId) || DEFAULT_HEALTH_SCORE_WEIGHTS;

    const components: HealthScoreComponent[] = [];

    // 1. Schedule Performance (20%)
    const scheduleScore = await this.computeScheduleScore(projectId);
    components.push({
      name: 'Schedule Performance',
      weight: weights.schedulePerformance,
      score: scheduleScore,
      basis: 'SPI (Earned Value / Planned Value)',
      drillDownRoute: `/projects/${projectId}/schedule`,
    });

    // 2. Cost Performance (20%)
    const costScore = await this.computeCostScore(projectId);
    components.push({
      name: 'Cost Performance',
      weight: weights.costPerformance,
      score: costScore,
      basis: 'CPI (Earned Value / Actual Cost)',
      drillDownRoute: `/projects/${projectId}/cost`,
    });

    // 3. Billing Performance (15%)
    const billingScore = await this.computeBillingScore(projectId);
    components.push({
      name: 'Billing Performance',
      weight: weights.billingPerformance,
      score: billingScore,
      basis: 'Billed / Billable value',
      drillDownRoute: `/projects/${projectId}/billing`,
    });

    // 4. Collection Performance (10%)
    const collectionScore = await this.computeCollectionScore(projectId);
    components.push({
      name: 'Collection Performance',
      weight: weights.collectionPerformance,
      score: collectionScore,
      basis: 'Collected / Billed value',
      drillDownRoute: `/projects/${projectId}/receivables`,
    });

    // 5. Quality (10%)
    const qualityScore = await this.computeQualityScore(projectId);
    components.push({
      name: 'Quality',
      weight: weights.quality,
      score: qualityScore,
      basis: 'NCR count, test pass rate',
      drillDownRoute: `/projects/${projectId}/quality`,
    });

    // 6. Safety (10%)
    const safetyScore = await this.computeSafetyScore(projectId);
    components.push({
      name: 'Safety',
      weight: weights.safety,
      score: safetyScore,
      basis: 'Incidents, overdue actions',
      drillDownRoute: `/projects/${projectId}/safety`,
    });

    // 7. Material Efficiency (5%)
    const materialScore = await this.computeMaterialScore(projectId);
    components.push({
      name: 'Material Efficiency',
      weight: weights.materialEfficiency,
      score: materialScore,
      basis: 'Wastage %, reconciliation variance',
      drillDownRoute: `/projects/${projectId}/material`,
    });

    // 8. Manpower Productivity (5%)
    const manpowerScore = await this.computeManpowerScore(projectId);
    components.push({
      name: 'Manpower Productivity',
      weight: weights.manpowerProductivity,
      score: manpowerScore,
      basis: 'Output per manday vs norm',
      drillDownRoute: `/projects/${projectId}/manpower`,
    });

    // 9. Approval Efficiency (5%)
    const approvalScore = await this.computeApprovalScore(projectId);
    components.push({
      name: 'Approval Efficiency',
      weight: weights.approvalEfficiency,
      score: approvalScore,
      basis: 'SLA compliance %',
      drillDownRoute: `/projects/${projectId}/approvals`,
    });

    // Compute composite score
    const compositeScore = components.reduce((sum, c) => sum + (c.score * c.weight / 100), 0);

    // Determine band
    let band: HealthScore['band'];
    if (compositeScore >= 80) band = 'HEALTHY';
    else if (compositeScore >= 60) band = 'WATCH';
    else if (compositeScore >= 40) band = 'AT_RISK';
    else band = 'CRITICAL';

    // Fetch trend (last 6 periods)
    const trend = await this.fetchHealthTrend(projectId);

    return {
      compositeScore: Math.round(compositeScore),
      band,
      components,
      trend,
    };
  }

  /**
   * Set custom health score weights for a project
   */
  setHealthScoreWeights(projectId: number, weights: HealthScoreWeights): void {
    // Validate weights sum to 100
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Health score weights must sum to 100%, got ${total}%`);
    }

    this.healthScoreWeights.set(projectId, weights);
  }

  /**
   * Get health score weights for a project
   */
  getHealthScoreWeights(projectId: number): HealthScoreWeights {
    return this.healthScoreWeights.get(projectId) || DEFAULT_HEALTH_SCORE_WEIGHTS;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS — Component Score Computation
  // ═══════════════════════════════════════════════════════════════════════════

  private async fetchProjectHeader(projectId: number): Promise<Project360Header> {
    // In production, would query project table
    // For demo, return mock data
    return {
      code: `PRJ-${projectId}`,
      name: `Project ${projectId}`,
      client: 'Client Name',
      location: 'Site Location',
      projectType: 'Construction',
      startDate: '2024-01-01',
      endDate: '2026-12-31',
      contractValue: 500000000,
      revisedValue: 520000000,
      projectManager: 'John Doe',
      overallStatus: 'IN_PROGRESS',
      daysElapsed: 365,
      daysRemaining: 365,
    };
  }

  private async fetchAllSections(projectId: number, actor: Actor): Promise<Project360Section[]> {
    const sections: Project360Section[] = [];

    // 1. Contract
    if (actor.can('project.contract.view', projectId)) {
      sections.push(await this.fetchContractSection(projectId));
    }

    // 2. Execution
    if (actor.can('project.execution.view', projectId)) {
      sections.push(await this.fetchExecutionSection(projectId));
    }

    // 3. Procurement
    if (actor.can('procure.po.view', projectId)) {
      sections.push(await this.fetchProcurementSection(projectId));
    }

    // 4. Material
    if (actor.can('store.stock.view', projectId)) {
      sections.push(await this.fetchMaterialSection(projectId));
    }

    // 5. Manpower
    if (actor.can('hr.manpower.view', projectId)) {
      sections.push(await this.fetchManpowerSection(projectId));
    }

    // 6. Plant
    if (actor.can('asset.equipment.view', projectId)) {
      sections.push(await this.fetchPlantSection(projectId));
    }

    // 7. Quality
    if (actor.can('qa.ncr.view', projectId)) {
      sections.push(await this.fetchQualitySection(projectId));
    }

    // 8. HSE
    if (actor.can('hse.incident.view', projectId)) {
      sections.push(await this.fetchHSESection(projectId));
    }

    // 9. Commercial
    if (actor.can('bill.client.view', projectId)) {
      sections.push(await this.fetchCommercialSection(projectId));
    }

    // 10. Finance
    if (actor.can('finance.voucher.view', projectId)) {
      sections.push(await this.fetchFinanceSection(projectId));
    }

    return sections;
  }

  private async fetchContractSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'contract',
      label: 'Contract',
      collapsible: true,
      kpis: [
        { code: 'contract.original_value', label: 'Original Value', value: 500000000 },
        { code: 'contract.variations_approved', label: 'Variations Approved', value: 20000000 },
        { code: 'contract.variations_pending', label: 'Variations Pending', value: 5000000 },
        { code: 'contract.revised_value', label: 'Revised Value', value: 520000000 },
        { code: 'contract.executed_value', label: 'Executed Value', value: 260000000 },
        { code: 'contract.balance_to_execute', label: 'Balance to Execute', value: 260000000 },
      ],
    };
  }

  private async fetchExecutionSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'execution',
      label: 'Execution',
      collapsible: true,
      kpis: [
        { code: 'execution.planned_progress', label: 'Planned Progress', value: 50, unit: '%' },
        { code: 'execution.actual_progress', label: 'Actual Progress', value: 48, unit: '%', trend: 'down', status: 'warning' },
        { code: 'execution.schedule_variance', label: 'Schedule Variance', value: -15, unit: 'days', status: 'critical' },
        { code: 'execution.critical_activities_delayed', label: 'Critical Activities Delayed', value: 3, status: 'critical' },
      ],
      charts: [
        { type: 's_curve', title: 'Planned vs Actual', kpiCode: 'execution.progress_s_curve' },
      ],
    };
  }

  private async fetchProcurementSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'procurement',
      label: 'Procurement',
      collapsible: true,
      kpis: [
        { code: 'procurement.mr_count', label: 'MRs', value: 45 },
        { code: 'procurement.pr_count', label: 'PRs', value: 38 },
        { code: 'procurement.rfq_count', label: 'RFQs', value: 25 },
        { code: 'procurement.po_count', label: 'POs', value: 20 },
        { code: 'procurement.grn_count', label: 'GRNs', value: 150 },
        { code: 'procurement.committed_value', label: 'Committed Value', value: 180000000 },
        { code: 'procurement.pos_overdue', label: 'POs Overdue', value: 5, status: 'warning' },
      ],
      charts: [
        { type: 'funnel', title: 'Procurement Funnel', kpiCode: 'procurement.funnel' },
      ],
    };
  }

  private async fetchMaterialSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'material',
      label: 'Material',
      collapsible: true,
      kpis: [
        { code: 'material.stock_value', label: 'Stock Value', value: 25000000 },
        { code: 'material.items_below_reorder', label: 'Items Below Reorder', value: 8, status: 'warning' },
        { code: 'material.negative_stock', label: 'Negative Stock', value: 0, status: 'good' },
        { code: 'material.consumption_vs_boq', label: 'Consumption vs BOQ', value: 98, unit: '%' },
        { code: 'material.wastage_percent', label: 'Wastage %', value: 2.5, unit: '%' },
      ],
    };
  }

  private async fetchManpowerSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'manpower',
      label: 'Manpower',
      collapsible: true,
      kpis: [
        { code: 'manpower.deployed_today', label: 'Deployed Today', value: 245 },
        { code: 'manpower.planned_today', label: 'Planned Today', value: 250 },
        { code: 'manpower.attendance_percent', label: 'Attendance %', value: 98, unit: '%' },
        { code: 'manpower.overtime_hours', label: 'Overtime Hours', value: 120 },
        { code: 'manpower.labour_cost_mtd', label: 'Labour Cost MTD', value: 8500000 },
      ],
      charts: [
        { type: 'bar', title: 'Manpower by Trade', kpiCode: 'manpower.by_trade' },
      ],
    };
  }

  private async fetchPlantSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'plant',
      label: 'Plant & Equipment',
      collapsible: true,
      kpis: [
        { code: 'plant.equipment_deployed', label: 'Equipment Deployed', value: 35 },
        { code: 'plant.utilisation_percent', label: 'Utilisation %', value: 78, unit: '%' },
        { code: 'plant.idle_hours', label: 'Idle Hours', value: 120 },
        { code: 'plant.breakdown_hours', label: 'Breakdown Hours', value: 45, status: 'warning' },
        { code: 'plant.maintenance_due', label: 'Maintenance Due', value: 8 },
      ],
    };
  }

  private async fetchQualitySection(projectId: number): Promise<Project360Section> {
    return {
      type: 'quality',
      label: 'Quality',
      collapsible: true,
      kpis: [
        { code: 'quality.wir_pass_rate', label: 'WIR Pass Rate', value: 95, unit: '%' },
        { code: 'quality.ncrs_open', label: 'NCRs Open', value: 12, status: 'warning' },
        { code: 'quality.ncrs_overdue', label: 'NCRs Overdue', value: 3, status: 'critical' },
        { code: 'quality.test_failure_rate', label: 'Test Failure Rate', value: 2.5, unit: '%' },
        { code: 'quality.calibration_overdue', label: 'Calibration Overdue', value: 2, status: 'warning' },
      ],
    };
  }

  private async fetchHSESection(projectId: number): Promise<Project360Section> {
    return {
      type: 'hse',
      label: 'Health, Safety & Environment',
      collapsible: true,
      kpis: [
        { code: 'hse.days_without_lti', label: 'Days Without LTI', value: 180, status: 'good' },
        { code: 'hse.incidents_mtd', label: 'Incidents MTD', value: 0, status: 'good' },
        { code: 'hse.near_misses_mtd', label: 'Near Misses MTD', value: 5 },
        { code: 'hse.observations_closed_percent', label: 'Observations Closed %', value: 92, unit: '%' },
        { code: 'hse.permits_active', label: 'Permits Active', value: 15 },
        { code: 'hse.training_compliance', label: 'Training Compliance %', value: 88, unit: '%' },
      ],
    };
  }

  private async fetchCommercialSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'commercial',
      label: 'Commercial',
      collapsible: true,
      kpis: [
        { code: 'commercial.bills_raised', label: 'Bills Raised', value: 125000000 },
        { code: 'commercial.bills_certified', label: 'Bills Certified', value: 120000000 },
        { code: 'commercial.bills_paid', label: 'Bills Paid', value: 95000000 },
        { code: 'commercial.unbilled_work', label: 'Unbilled Work', value: 15000000 },
        { code: 'commercial.receivables', label: 'Receivables', value: 25000000, status: 'warning' },
        { code: 'commercial.retention_held', label: 'Retention Held', value: 6000000 },
      ],
    };
  }

  private async fetchFinanceSection(projectId: number): Promise<Project360Section> {
    return {
      type: 'finance',
      label: 'Finance',
      collapsible: true,
      kpis: [
        { code: 'finance.budget', label: 'Budget', value: 520000000 },
        { code: 'finance.committed', label: 'Committed', value: 350000000 },
        { code: 'finance.actual', label: 'Actual', value: 260000000 },
        { code: 'finance.forecast_at_completion', label: 'Forecast at Completion', value: 540000000, status: 'warning' },
        { code: 'finance.cost_variance', label: 'Cost Variance', value: -20000000, status: 'critical' },
        { code: 'finance.margin_percent', label: 'Margin %', value: 8.5, unit: '%' },
      ],
      charts: [
        { type: 'bar', title: 'Budget vs Actual by Cost Head', kpiCode: 'finance.budget_vs_actual' },
      ],
    };
  }

  // Health score component computations (simplified for demo)
  private async computeScheduleScore(projectId: number): Promise<number> {
    // In production, would compute SPI from earned value data
    return 85; // 0-100 score
  }

  private async computeCostScore(projectId: number): Promise<number> {
    return 78;
  }

  private async computeBillingScore(projectId: number): Promise<number> {
    return 92;
  }

  private async computeCollectionScore(projectId: number): Promise<number> {
    return 70;
  }

  private async computeQualityScore(projectId: number): Promise<number> {
    return 88;
  }

  private async computeSafetyScore(projectId: number): Promise<number> {
    return 95;
  }

  private async computeMaterialScore(projectId: number): Promise<number> {
    return 82;
  }

  private async computeManpowerScore(projectId: number): Promise<number> {
    return 80;
  }

  private async computeApprovalScore(projectId: number): Promise<number> {
    return 75;
  }

  private async fetchHealthTrend(projectId: number): Promise<Array<{ period: string; score: number }>> {
    // In production, would fetch from historical snapshots
    return [
      { period: '2024-01', score: 78 },
      { period: '2024-02', score: 80 },
      { period: '2024-03', score: 79 },
      { period: '2024-04', score: 82 },
      { period: '2024-05', score: 81 },
      { period: '2024-06', score: 83 },
    ];
  }
}

// Singleton instance
export const project360Service = new Project360Service();
