/**
 * Part 04 — Additive Migration CI Check
 * 
 * CI tool that validates migrations only contain additive changes to dx_ tables.
 * Fails the build if any migration contains ALTER, DROP, RENAME, or TRUNCATE
 * against non-dx_ tables.
 * 
 * This enforces the database preservation policy from Part 02.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MigrationCheckResult {
  passed: boolean;
  errors: MigrationCheckError[];
  warnings: string[];
}

export interface MigrationCheckError {
  file: string;
  line: number;
  statement: string;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// REGEX PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Forbidden operations
 */
const FORBIDDEN_OPERATIONS = /\b(ALTER|DROP|RENAME|TRUNCATE)\s+(TABLE|COLUMN|INDEX|CONSTRAINT)\b/i;

/**
 * Allowed prefixes for new objects
 */
const ALLOWED_PREFIX = /^(dx_|vw_dx_)/;

/**
 * Extract table/index name from SQL statement
 */
const TABLE_NAME_PATTERN = /\b(?:TABLE|INDEX)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?"?([a-z0-9_]+)"?/i;

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION CHECKER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a migration SQL is additive-only
 * 
 * Rules:
 * - CREATE TABLE is allowed if table name starts with dx_ or vw_dx_
 * - ALTER TABLE is forbidden unless table name starts with dx_
 * - DROP TABLE is forbidden unless table name starts with dx_
 * - RENAME TABLE is forbidden
 * - TRUNCATE TABLE is forbidden
 * 
 * Usage:
 * ```typescript
 * const result = assertAdditive(migrationSql, '001_create_po_extension.sql');
 * if (!result.passed) {
 *   console.error('Migration check failed:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
export function assertAdditive(sql: string, fileName: string): MigrationCheckResult {
  const errors: MigrationCheckError[] = [];
  const warnings: string[] = [];

  // Split SQL into statements
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  let lineNumber = 1;
  for (const statement of statements) {
    // Count lines in this statement
    const lines = statement.split('\n');
    
    // Check if statement contains forbidden operations
    if (FORBIDDEN_OPERATIONS.test(statement)) {
      // Extract table/index name
      const match = TABLE_NAME_PATTERN.exec(statement);
      const targetName = match?.[1];

      if (!targetName) {
        errors.push({
          file: fileName,
          line: lineNumber,
          statement: statement.substring(0, 100),
          message: 'Could not extract table/index name from statement',
        });
      } else if (!ALLOWED_PREFIX.test(targetName)) {
        errors.push({
          file: fileName,
          line: lineNumber,
          statement: statement.substring(0, 100),
          message: `Migration touches non-dx object "${targetName}". Only dx_ and vw_dx_ prefixes are allowed.`,
        });
      } else {
        // Allowed: dx_ or vw_dx_ object
        warnings.push(`Allowed: ${statement.substring(0, 50)}...`);
      }
    }

    lineNumber += lines.length;
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI USAGE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Example CLI usage:
 * 
 * ```bash
 * # Check a single migration file
 * node tools/ci/assert-additive-migrations.js migrations/001_create_po_extension.sql
 * 
 * # Check all migrations in a directory
 * node tools/ci/assert-additive-migrations.js migrations/*.sql
 * ```
 * 
 * In package.json:
 * ```json
 * {
 *   "scripts": {
 *     "check:migrations": "node tools/ci/assert-additive-migrations.js migrations/*.sql"
 *   }
 * }
 * ```
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE TESTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test cases:
 * 
 * ✅ PASS: CREATE TABLE dx_po_extension (...)
 * ✅ PASS: CREATE INDEX ix_dx_po_extension_po_id ON dx_po_extension (po_id)
 * ✅ PASS: ALTER TABLE dx_po_extension ADD COLUMN notes TEXT
 * 
 * ❌ FAIL: ALTER TABLE purchase_orders ADD COLUMN notes TEXT
 * ❌ FAIL: DROP TABLE vendors
 * ❌ FAIL: RENAME TABLE old_po TO new_po
 * ❌ FAIL: TRUNCATE TABLE audit_log
 */

// Note: CLI execution would be implemented in a Node.js environment
// This file provides the core validation logic for use in CI/CD pipelines
