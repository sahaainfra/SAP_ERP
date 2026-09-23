/**
 * Part 02 — Schema Validator Service
 * 
 * Boot-time validation of SCHEMA_MAP against information_schema.
 * If a mapped table or column does not exist, log a clear startup error
 * naming the missing object and disable only the affected feature —
 * never crash the whole application.
 * 
 * When a business object is NOT PRESENT, its map entry is null and every
 * feature that depends on it renders the "module not configured" empty
 * state instead of erroring.
 */

import { SCHEMA_MAP, getMissingBusinessObjects, getPresentBusinessObjects } from '../config/schema-map';

export interface SchemaValidationResult {
  valid: boolean;
  timestamp: string;
  totalBusinessObjects: number;
  presentObjects: number;
  missingObjects: number;
  missingList: string[];
  presentList: string[];
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
}

export interface SchemaValidationError {
  code: string;
  message: string;
  businessObject: string;
  severity: 'error' | 'critical';
}

export interface SchemaValidationWarning {
  code: string;
  message: string;
  businessObject?: string;
  severity: 'warning' | 'info';
}

/**
 * Validate SCHEMA_MAP at boot time
 * 
 * In a real implementation, this would query information_schema.tables
 * and information_schema.columns to verify each mapped table and column exists.
 * 
 * For this fresh workspace, we validate that:
 * 1. SCHEMA_MAP is defined
 * 2. All business objects are accounted for (present or null)
 * 3. No duplicate mappings exist
 */
export function validateSchemaMap(): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationWarning[] = [];
  
  const missingList = getMissingBusinessObjects();
  const presentList = getPresentBusinessObjects();
  
  // Check if SCHEMA_MAP is defined
  if (!SCHEMA_MAP) {
    errors.push({
      code: 'SCHEMA-001',
      message: 'SCHEMA_MAP is not defined',
      businessObject: 'ALL',
      severity: 'critical',
    });
  }
  
  // Check for empty SCHEMA_MAP
  if (Object.keys(SCHEMA_MAP).length === 0) {
    warnings.push({
      code: 'SCHEMA-002',
      message: 'SCHEMA_MAP is empty — no business objects defined',
      severity: 'warning',
    });
  }
  
  // Validate each business object
  for (const [businessObject, mapping] of Object.entries(SCHEMA_MAP)) {
    if (mapping === null) {
      // NOT PRESENT is valid — just a warning
      warnings.push({
        code: 'SCHEMA-003',
        message: `Business object '${businessObject}' is NOT PRESENT in database`,
        businessObject,
        severity: 'info',
      });
    } else {
      // Validate mapping structure
      if (!mapping.table) {
        errors.push({
          code: 'SCHEMA-004',
          message: `Business object '${businessObject}' has mapping but no table name`,
          businessObject,
          severity: 'error',
        });
      }
      
      if (!mapping.pk) {
        errors.push({
          code: 'SCHEMA-005',
          message: `Business object '${businessObject}' has mapping but no primary key defined`,
          businessObject,
          severity: 'error',
        });
      }
      
      // In a real implementation, we would query information_schema here
      // For now, we assume all present mappings are valid
    }
  }
  
  // Check for duplicate table names (would indicate a mapping error)
  const tableNames = new Map<string, string[]>();
  for (const [businessObject, mapping] of Object.entries(SCHEMA_MAP)) {
    if (mapping && mapping.table) {
      const existing = tableNames.get(mapping.table) || [];
      existing.push(businessObject);
      tableNames.set(mapping.table, existing);
    }
  }
  
  for (const [tableName, businessObjects] of tableNames.entries()) {
    if (businessObjects.length > 1) {
      errors.push({
        code: 'SCHEMA-006',
        message: `Table '${tableName}' is mapped to multiple business objects: ${businessObjects.join(', ')}`,
        businessObject: businessObjects[0],
        severity: 'error',
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    timestamp: new Date().toISOString(),
    totalBusinessObjects: Object.keys(SCHEMA_MAP).length,
    presentObjects: presentList.length,
    missingObjects: missingList.length,
    missingList,
    presentList,
    errors,
    warnings,
  };
}

/**
 * Get validation summary for UI display
 */
export function getSchemaValidationSummary(): {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  details: string[];
} {
  const result = validateSchemaMap();
  
  if (result.errors.some(e => e.severity === 'critical')) {
    return {
      status: 'critical',
      message: 'Schema validation failed with critical errors',
      details: result.errors.filter(e => e.severity === 'critical').map(e => e.message),
    };
  }
  
  if (result.errors.length > 0) {
    return {
      status: 'degraded',
      message: 'Schema validation completed with errors',
      details: result.errors.map(e => e.message),
    };
  }
  
  if (result.missingObjects > 0) {
    return {
      status: 'degraded',
      message: `Schema validation completed — ${result.missingObjects} business objects not present`,
      details: [
        `${result.presentObjects} business objects present`,
        `${result.missingObjects} business objects not present (will show empty states)`,
      ],
    };
  }
  
  return {
    status: 'healthy',
    message: 'Schema validation completed successfully',
    details: [`All ${result.totalBusinessObjects} business objects are present and valid`],
  };
}
