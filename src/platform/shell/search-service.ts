/**
 * Part 16 — Search Service
 * 
 * Manages global search with:
 * - Permission-filtered results
 * - Multi-type search across all object types
 * - Query syntax (type:, status:, project:, etc.)
 * - Recent searches
 * - Type-ahead suggestions
 */

import {
  SearchResult,
  SearchResponse,
  SearchQuery,
  RecentSearch,
  SearchableObjectType,
} from './types';

export class SearchService {
  private recentSearches: RecentSearch[] = [];
  private readonly MAX_RECENT = 10;

  /**
   * Execute a global search
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();

    // Parse query syntax
    const parsed = this.parseQuery(query.term);

    // In production, would call:
    // GET /api/dx/v1/search?q=...&type=...&project=...&status=...
    // For demo, return mock results
    const results = await this.mockSearch({
      ...query,
      ...parsed,
    });

    // Group results by object type
    const groups = this.groupByType(results);

    const response: SearchResponse = {
      results,
      totalCount: results.length,
      groups,
      queryTime: Date.now() - startTime,
    };

    return response;
  }

  /**
   * Get recent searches for current user
   */
  async getRecentSearches(): Promise<RecentSearch[]> {
    // In production, would call:
    // GET /api/dx/v1/search/recent
    // For demo, return cached recent searches
    return this.recentSearches;
  }

  /**
   * Record a search in recent history
   */
  async recordSearch(term: string, resultType?: SearchableObjectType, resultId?: number): Promise<void> {
    // In production, would call:
    // POST /api/dx/v1/search/recent
    const recent: RecentSearch = {
      id: Date.now(),
      searchTerm: term,
      resultType,
      resultId,
      searchedAt: new Date().toISOString(),
    };

    this.recentSearches.unshift(recent);
    this.recentSearches = this.recentSearches.slice(0, this.MAX_RECENT);
  }

  /**
   * Clear recent searches
   */
  async clearRecentSearches(): Promise<void> {
    // In production, would call:
    // DELETE /api/dx/v1/search/recent
    this.recentSearches = [];
  }

  /**
   * Parse query syntax
   * Supports: type:po status:pending project:"Metro" amount:>500000 date:last-30-days
   */
  private parseQuery(term: string): Partial<SearchQuery> {
    const parsed: Partial<SearchQuery> = {};
    const parts = term.match(/(\w+):("[^"]+"|\S+)/g);

    if (!parts) {
      parsed.term = term;
      return parsed;
    }

    let remaining = term;

    for (const part of parts) {
      const [key, value] = part.split(':');
      const cleanValue = value.replace(/"/g, '');

      switch (key) {
        case 'type':
          parsed.objectType = cleanValue.toUpperCase() as SearchableObjectType;
          break;
        case 'status':
          parsed.status = cleanValue;
          break;
        case 'project':
          // In production, would resolve project name to ID
          break;
        case 'amount':
          // Parse amount operators like >500000
          break;
        case 'date':
          // Parse date ranges like last-30-days
          break;
      }

      remaining = remaining.replace(part, '').trim();
    }

    parsed.term = remaining;
    return parsed;
  }

  /**
   * Group results by object type
   */
  private groupByType(results: SearchResult[]): SearchResponse['groups'] {
    const groups = new Map<SearchableObjectType, SearchResult[]>();

    for (const result of results) {
      if (!groups.has(result.objectType)) {
        groups.set(result.objectType, []);
      }
      groups.get(result.objectType)!.push(result);
    }

    return Array.from(groups.entries()).map(([objectType, results]) => ({
      objectType,
      results: results.slice(0, 5), // Max 5 per group
      totalCount: results.length,
    }));
  }

  /**
   * Mock search (in production, would call API with search index)
   */
  private async mockSearch(query: SearchQuery): Promise<SearchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 150));

    const term = query.term.toLowerCase();
    const results: SearchResult[] = [];

    // Mock data for different object types
    const mockData: Partial<Record<SearchableObjectType, Array<{ id: number; number: string; name: string; project: string; status: string }>>> = {
      PROJECT: [
        { id: 1, number: 'PRJ-001', name: 'Metro Corridor IV', project: '', status: 'ACTIVE' },
        { id: 2, number: 'PRJ-002', name: 'NH-48 Flyover', project: '', status: 'ACTIVE' },
      ],
      PO: [
        { id: 101, number: 'PO-2026-0001', name: 'Steel Reinforcement', project: 'Metro Corridor IV', status: 'APPROVED' },
        { id: 102, number: 'PO-2026-0002', name: 'Cement OPC 53', project: 'NH-48 Flyover', status: 'PENDING' },
        { id: 103, number: 'PO-2026-0003', name: 'Aggregate 20mm', project: 'Metro Corridor IV', status: 'RELEASED' },
      ],
      GRN: [
        { id: 201, number: 'GRN-2026-0001', name: 'Steel Receipt', project: 'Metro Corridor IV', status: 'POSTED' },
        { id: 202, number: 'GRN-2026-0002', name: 'Cement Receipt', project: 'NH-48 Flyover', status: 'PENDING' },
      ],
      VENDOR: [
        { id: 301, number: 'V-001', name: 'Shree Cement Ltd', project: '', status: 'ACTIVE' },
        { id: 302, number: 'V-002', name: 'Tata Steel', project: '', status: 'ACTIVE' },
      ],
      VOUCHER: [
        { id: 401, number: 'JV-2026-0001', name: 'Payment to Vendor', project: 'Metro Corridor IV', status: 'POSTED' },
      ],
      EMPLOYEE: [
        { id: 501, number: 'EMP-001', name: 'Rajesh Kumar', project: '', status: 'ACTIVE' },
        { id: 502, number: 'EMP-002', name: 'Priya Sharma', project: '', status: 'ACTIVE' },
      ],
      WIR: [
        { id: 601, number: 'WIR-2026-0001', name: 'Column Reinforcement', project: 'Metro Corridor IV', status: 'APPROVED' },
      ],
      NCR: [
        { id: 701, number: 'NCR-2026-0001', name: 'Concrete Quality', project: 'NH-48 Flyover', status: 'OPEN' },
      ],
    };

    // Search across all types (or filtered by query.objectType)
    const typesToSearch = query.objectType 
      ? [query.objectType]
      : Object.keys(mockData) as SearchableObjectType[];

    for (const type of typesToSearch) {
      const items = mockData[type] || [];
      
      for (const item of items) {
        // Match against term
        const matches = 
          item.number.toLowerCase().includes(term) ||
          item.name.toLowerCase().includes(term);

        if (matches) {
          // Apply filters
          if (query.status && item.status !== query.status) continue;

          results.push({
            objectType: type,
            objectId: item.id,
            primaryLine: `${item.number} — ${item.name}`,
            secondaryLine: item.project ? `${item.project} · ${item.status}` : item.status,
            status: item.status,
            route: this.getRouteForType(type, item.id),
            permissionKey: this.getPermissionForType(type),
          });
        }
      }
    }

    // Sort by relevance (exact match first, then prefix, then fuzzy)
    results.sort((a, b) => {
      const aPrimary = a.primaryLine.toLowerCase();
      const bPrimary = b.primaryLine.toLowerCase();

      // Exact match
      if (aPrimary === term) return -1;
      if (bPrimary === term) return 1;

      // Prefix match
      if (aPrimary.startsWith(term)) return -1;
      if (bPrimary.startsWith(term)) return 1;

      // Contains match
      if (aPrimary.includes(term)) return -1;
      if (bPrimary.includes(term)) return 1;

      return 0;
    });

    // Limit results
    return results.slice(0, query.limit || 50);
  }

  /**
   * Get route for an object type and ID
   */
  private getRouteForType(type: SearchableObjectType, id: number): string {
    const routes: Record<SearchableObjectType, string> = {
      PROJECT: `/projects/${id}`,
      SITE: `/sites/${id}`,
      PACKAGE: `/packages/${id}`,
      WBS: `/wbs/${id}`,
      CONTRACT: `/contracts/${id}`,
      TENDER: `/tenders/${id}`,
      BOQ_ITEM: `/boq/${id}`,
      MATERIAL: `/materials/${id}`,
      VENDOR: `/procurement/vendors/${id}`,
      CLIENT: `/clients/${id}`,
      EMPLOYEE: `/hr/employees/${id}`,
      LABOUR: `/hr/labour/${id}`,
      MR: `/procurement/mr/${id}`,
      PR: `/procurement/pr/${id}`,
      RFQ: `/procurement/rfq/${id}`,
      PO: `/procurement/po/${id}`,
      GRN: `/store/grn/${id}`,
      STOCK_ITEM: `/store/stock/${id}`,
      ISSUE: `/store/issues/${id}`,
      DPR: `/execution/dpr/${id}`,
      MB: `/execution/mb/${id}`,
      RA_BILL: `/billing/ra-bills/${id}`,
      INVOICE: `/billing/invoices/${id}`,
      PAYMENT: `/finance/payments/${id}`,
      RECEIPT: `/finance/receipts/${id}`,
      VOUCHER: `/finance/vouchers/${id}`,
      PLANT: `/plant/${id}`,
      RMC_BATCH: `/rmc/batches/${id}`,
      ITP: `/quality/itp/${id}`,
      WIR: `/quality/wir/${id}`,
      NCR: `/quality/ncr/${id}`,
      PERMIT: `/safety/permits/${id}`,
      INCIDENT: `/safety/incidents/${id}`,
      DOCUMENT: `/documents/${id}`,
      DRAWING: `/drawings/${id}`,
      RFI: `/rfi/${id}`,
      TASK: `/tasks/${id}`,
      APPROVAL: `/approvals/${id}`,
      USER: `/admin/users/${id}`,
    };

    return routes[type] || '/';
  }

  /**
   * Get permission key for an object type
   */
  private getPermissionForType(type: SearchableObjectType): string {
    const permissions: Record<SearchableObjectType, string> = {
      PROJECT: 'project.view',
      SITE: 'project.site.view',
      PACKAGE: 'project.package.view',
      WBS: 'project.wbs.view',
      CONTRACT: 'contract.view',
      TENDER: 'tender.view',
      BOQ_ITEM: 'boq.view',
      MATERIAL: 'master.material.view',
      VENDOR: 'master.vendor.view',
      CLIENT: 'master.client.view',
      EMPLOYEE: 'hr.employee.view',
      LABOUR: 'hr.labour.view',
      MR: 'procure.mr.view',
      PR: 'procure.pr.view',
      RFQ: 'procure.rfq.view',
      PO: 'procure.po.view',
      GRN: 'store.grn.view',
      STOCK_ITEM: 'store.stock.view',
      ISSUE: 'store.issue.view',
      DPR: 'project.dpr.view',
      MB: 'mb.entry.view',
      RA_BILL: 'bill.client.view',
      INVOICE: 'bill.invoice.view',
      PAYMENT: 'finance.payment.view',
      RECEIPT: 'finance.receipt.view',
      VOUCHER: 'finance.voucher.view',
      PLANT: 'asset.plant.view',
      RMC_BATCH: 'rmc.batch.view',
      ITP: 'qa.itp.view',
      WIR: 'qa.wir.view',
      NCR: 'qa.ncr.view',
      PERMIT: 'hse.permit.view',
      INCIDENT: 'hse.incident.view',
      DOCUMENT: 'dms.document.view',
      DRAWING: 'dms.drawing.view',
      RFI: 'dms.rfi.view',
      TASK: 'workflow.task.view',
      APPROVAL: 'workflow.approval.view',
      USER: 'admin.user.view',
    };

    return permissions[type] || 'unknown';
  }
}

export const searchService = new SearchService();
