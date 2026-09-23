/**
 * Part 11 — Dimension Validator Service
 * 
 * Validates financial dimension combinations at posting time.
 * Ensures accounts have required dimensions and forbidden dimensions are not used.
 */

import { DimensionSet, FinancialDimensionRow, DimensionError } from './types';

export interface AccountConfig {
  id: number;
  code: string;
  requiresProject: boolean;
  requiresCostCode: boolean;
  isControlAccount: boolean;
  forbidsCostCode: boolean;
}

export interface CostCodeConfig {
  id: number;
  code: string;
  projectId: number;
  isPostingAllowed: boolean;
}

export class DimensionValidator {
  private accounts: Map<number, AccountConfig> = new Map();
  private costCodes: Map<number, CostCodeConfig> = new Map();
  private validCombinations: Set<string> = new Set();

  /**
   * Validate a dimension combination for an account
   * Called before inserting GL voucher lines
   */
  async validateCombination(
    accountId: number,
    dims: DimensionSet
  ): Promise<void> {
    const account = await this.getAccount(accountId);

    // 1. Required dimensions per account type
    if (account.requiresProject && !dims.projectId) {
      throw new DimensionError('DIMENSION_REQUIRED', {
        account: account.code,
        dimension: 'project',
      });
    }

    if (account.requiresCostCode && !dims.costCodeId) {
      throw new DimensionError('DIMENSION_REQUIRED', {
        account: account.code,
        dimension: 'costCode',
      });
    }

    if (account.isControlAccount && !dims.partyId) {
      throw new DimensionError('DIMENSION_REQUIRED', {
        account: account.code,
        dimension: 'party',
      });
    }

    // 2. Forbidden dimensions
    if (account.forbidsCostCode && dims.costCodeId) {
      throw new DimensionError('DIMENSION_NOT_ALLOWED', {
        account: account.code,
        dimension: 'costCode',
      });
    }

    // 3. Referential validity and belonging
    if (dims.costCodeId && dims.projectId) {
      const costCode = await this.getCostCode(dims.costCodeId);
      
      if (costCode.projectId !== dims.projectId) {
        throw new DimensionError('DIMENSION_COMBINATION_INVALID', {
          costCode: costCode.code,
          expectedProject: costCode.projectId,
          givenProject: dims.projectId,
        });
      }

      if (!costCode.isPostingAllowed) {
        throw new DimensionError('COST_CODE_NOT_POSTABLE', {
          costCode: costCode.code,
        });
      }
    }

    if (dims.wbsId && dims.projectId) {
      // Similar validation for WBS belonging to project
      // In production, would check WBS.projectId === dims.projectId
    }

    // 4. Check if combination is in valid combinations table
    const comboKey = this.getCombinationKey(accountId, dims);
    if (!this.validCombinations.has(comboKey)) {
      // Auto-register valid combination (in production, would be explicit)
      this.validCombinations.add(comboKey);
    }
  }

  /**
   * Register a valid dimension combination
   */
  async registerCombination(
    accountId: number,
    dims: DimensionSet
  ): Promise<FinancialDimensionRow> {
    const comboKey = this.getCombinationKey(accountId, dims);
    
    // Check if already registered
    if (this.validCombinations.has(comboKey)) {
      throw new Error('COMBINATION_ALREADY_EXISTS');
    }

    this.validCombinations.add(comboKey);

    return {
      id: 0, // Would be set by database
      accountId,
      ...dims,
      isValid: true,
    };
  }

  /**
   * Check if a dimension combination is valid
   */
  async isCombinationValid(
    accountId: number,
    dims: DimensionSet
  ): Promise<boolean> {
    const comboKey = this.getCombinationKey(accountId, dims);
    return this.validCombinations.has(comboKey);
  }

  /**
   * Register an account configuration
   */
  registerAccount(config: AccountConfig): void {
    this.accounts.set(config.id, config);
  }

  /**
   * Register a cost code configuration
   */
  registerCostCode(config: CostCodeConfig): void {
    this.costCodes.set(config.id, config);
  }

  /**
   * Get account configuration
   */
  private async getAccount(accountId: number): Promise<AccountConfig> {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`ACCOUNT_NOT_FOUND: ${accountId}`);
    }
    return account;
  }

  /**
   * Get cost code configuration
   */
  private async getCostCode(costCodeId: number): Promise<CostCodeConfig> {
    const costCode = this.costCodes.get(costCodeId);
    if (!costCode) {
      throw new Error(`COST_CODE_NOT_FOUND: ${costCodeId}`);
    }
    return costCode;
  }

  /**
   * Generate unique key for dimension combination
   */
  private getCombinationKey(accountId: number, dims: DimensionSet): string {
    const parts = [
      accountId,
      dims.projectId || 'null',
      dims.costCodeId || 'null',
      dims.wbsId || 'null',
      dims.costCentreId || 'null',
      dims.equipmentId || 'null',
      dims.partyType || 'null',
      dims.partyId || 'null',
    ];
    return parts.join(':');
  }
}

export const dimensionValidator = new DimensionValidator();
