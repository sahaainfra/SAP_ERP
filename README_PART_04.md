# Part 04: Reference Architecture & Enterprise ERP Pattern Adoption

## Overview

**Part 04 of 69** in the Construction & Infrastructure ERP build programme.

This part establishes the reference architecture that every subsequent module builds inside. It defines the seven-layer architecture, folder structure, module definition contract, unit of work pattern, legacy adapter layer, extension pattern, engine inventory, and boot-time validation.

**Critical Rule:** Every module from Part 27 onward must follow this architecture. A module that re-implements any shared engine fails the "one engine each" test.

## What This Part Delivers

### 1. Seven-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│ 7  PRESENTATION   React screens, metadata-driven UI      │
├─────────────────────────────────────────────────────────┤
│ 6  API            Controllers, DTOs, guards, serialisers │
├─────────────────────────────────────────────────────────┤
│ 5  APPLICATION    Use-case services, orchestration, UoW  │
├─────────────────────────────────────────────────────────┤
│ 4  DOMAIN         Entities, value objects, business rules│
│                   validators, state machines, engines    │
├─────────────────────────────────────────────────────────┤
│ 3  PLATFORM       Permission, workflow, numbering, audit, │
│                   outbox, notification, document base    │
├─────────────────────────────────────────────────────────┤
│ 2  DATA ACCESS    Repositories, query builders, adapters │
├─────────────────────────────────────────────────────────┤
│ 1  PERSISTENCE    Existing tables (read/write via legacy  │
│                   paths) + dx_ tables                     │
└─────────────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies point downward only. A layer never imports from a layer above it. Enforced by CI.

### 2. Folder Structure

```
src/
  platform/           # Layer 3: Shared platform services
    uow/              # Unit of Work
    db/               # Legacy Repository, Write Bridge, Extension Repository
    module/           # Module Definition, Registry
    engine/           # Engine Inventory
    boot/             # Boot Validator
    permission/       # (Part 06)
    workflow/         # (Part 08)
    document/         # (Part 07)
    audit/            # (Part 07)
    outbox/           # (Part 07)
    notification/     # (Part 18)
    integration/      # (Part 42)
    calc/             # (Part 10)
  modules/            # Layer 4-6: Business modules
    procurement/      # (Part 26 - worked example)
      domain/
      application/
      api/
      config/
      __tests__/
    inventory/        # (Part 28)
    subcontract/      # (Part 29)
    measurement/      # (Part 30)
    billing/          # (Part 31)
    finance/          # (Part 32)
    hr/               # (Part 33)
    plant/            # (Part 34)
    quality/          # (Part 35)
  shared/             # Layer 2: Shared utilities
    db/
    types/
    errors/
    utils/
    testing/
```

### 3. Unit of Work Pattern

**File:** `src/platform/uow/UnitOfWork.ts`

Every state change runs inside exactly one database transaction. Everything that must be consistent with it runs inside the same transaction:
- Audit rows (hash-chained, append-only)
- Outbox events (published only after commit)

**Rules Enforced:**
- No repository method accepts a connection other than `ctx.tx`
- No external HTTP call inside a transaction
- No notification/email/push awaited inside a transaction
- Long-running work runs as batch job, not request transaction

**Usage:**
```typescript
const result = await unitOfWork.run(actor, async (ctx) => {
  const po = await poRepo.create(ctx, { ... });
  ctx.audit.record({ entity: 'po', entityId: po.id, action: 'CREATE', after: po });
  ctx.outbox.publish({ eventType: 'procure.po.created', aggregateId: po.id, payload: po });
  return po;
});
```

### 4. Legacy Repository

**File:** `src/platform/db/LegacyRepository.ts`

Base class for reading from existing tables through the schema map. No domain code references a legacy column name directly. Everything goes through an adapter configured from `config/schema-map.ts`.

**Rules:**
- All reads go through LegacyRepository
- Column names are mapped via SCHEMA_MAP
- No direct SQL with hardcoded column names

**Usage:**
```typescript
class PurchaseOrderRepository extends LegacyRepository<PurchaseOrder> {
  protected readonly entityKey = 'purchaseOrder';
  
  async findById(id: number): Promise<PurchaseOrder | null> {
    const sql = `SELECT ${this.selectColumns()} FROM ${this.getTableName()} WHERE ${this.map.pk} = $1`;
    const row = await this.executeQuery(sql, [id]);
    return row ? this.mapRow(row) : null;
  }
}
```

### 5. Legacy Write Bridge

**File:** `src/platform/db/LegacyWriteBridge.ts`

Controls writes to existing tables through a whitelist of allowed columns. Prevents new modules from writing to columns the existing application treats as authoritative.

**Rules:**
- Only whitelisted columns can be written
- All writes go through this bridge
- Writes are logged and audited
- No direct SQL updates to legacy tables

**Usage:**
```typescript
// Validate before writing
legacyWriteBridge.assertWritable('purchaseOrder', ['status', 'notes']);

// Execute write within transaction
await legacyWriteBridge.write(ctx, {
  entityKey: 'purchaseOrder',
  id: 123,
  data: { status: 'APPROVED', notes: 'Approved by manager' }
});
```

### 6. Extension Repository

**File:** `src/platform/db/ExtensionRepository.ts`

Pattern for adding fields to existing entities without modifying their tables. Uses side tables (`dx_*_extension`) that reference the primary key of the host entity.

**Rules:**
- Extension tables are prefixed `dx_*_extension`
- Foreign key references the host entity's primary key
- Extension data is merged with host data in composite reads
- API returns unified resource, not separate objects

**Usage:**
```typescript
class PurchaseOrderExtensionRepository extends ExtensionRepository<PurchaseOrderExtension> {
  protected readonly config: ExtensionConfig = {
    tableName: 'dx_po_extension',
    foreignKeyColumn: 'po_id',
    hostEntityKey: 'purchaseOrder',
  };
}
```

### 7. Module Definition Contract

**File:** `src/platform/module/ModuleDefinition.ts`

Contract that every module must implement to register itself with the platform. Declares permissions, workflows, documents, posting rules, KPIs, and UI metadata.

**Rules:**
- Every module must have a ModuleDefinition
- All permission keys must be declared
- All workflows must be registered
- All documents must be defined
- Boot-time validator checks all registrations

**Usage:**
```typescript
export const ProcurementModule: ModuleDefinition = {
  code: 'PROCURE',
  name: 'Procurement',
  description: 'Purchase orders, indents, RFQs, and vendor management',
  permissionKeys: [...],
  workflowDefinitions: [...],
  documents: [...],
  postingRules: [...],
  kpis: [...],
  alerts: [...],
  uiMetadata: {...},
  sodRules: [...],
};
```

### 8. Additive Migration CI Check

**File:** `src/tools/ci/assert-additive-migrations.ts`

CI tool that validates migrations only contain additive changes to `dx_` tables. Fails the build if any migration contains ALTER, DROP, RENAME, or TRUNCATE against non-dx_ tables.

**Rules:**
- CREATE TABLE allowed if table name starts with `dx_` or `vw_dx_`
- ALTER TABLE forbidden unless table name starts with `dx_`
- DROP TABLE forbidden unless table name starts with `dx_`
- RENAME TABLE forbidden
- TRUNCATE TABLE forbidden

### 9. Engine Inventory

**File:** `src/platform/engine/EngineInventory.ts`

Catalog of all shared engines that are built exactly once. A module that re-implements any of these engines fails the "one engine each" test.

**Key Engines:**
- Permission Resolver + Guards + Masking (Part 06)
- Document Base Service (Part 07)
- Workflow / Approval Engine (Part 08)
- Stock Ledger Posting Service (Part 09)
- GL Posting Service (Part 09)
- Rate Resolver (Part 10)
- Tax Engine (Part 10)
- Real-Time Event Bus (Part 11)
- Analytical View Layer (Part 12)
- Metadata UI Generator (Part 15)

**Estimated shared-infrastructure effort: 35–45% of total build.** Front-load it. A module built before the engines exist will be rewritten.

### 10. Boot-Time Validator

**File:** `src/platform/boot/BootValidator.ts`

Validates that all module registrations are correct at application startup.

**Checks:**
- Every permission key referenced by a controller exists in some module
- Every permission key is reachable from at least one responsibility template
- No duplicate permission keys across modules
- No duplicate workflow codes
- No duplicate document codes
- All engines are registered

**Usage:**
```typescript
// Register all modules
moduleRegistry.register(ProcurementModule);
moduleRegistry.register(InventoryModule);

// Validate at boot
const result = validateBoot();
if (!result.passed) {
  console.error('Boot validation failed:', result.errors);
  process.exit(1);
}
```

## File Structure

```
src/
├── platform/
│   ├── uow/
│   │   └── UnitOfWork.ts              # Transaction management
│   ├── db/
│   │   ├── LegacyRepository.ts        # Read from existing tables
│   │   ├── LegacyWriteBridge.ts       # Write to existing tables
│   │   └── ExtensionRepository.ts     # Side table pattern
│   ├── module/
│   │   └── ModuleDefinition.ts        # Module contract
│   ├── engine/
│   │   └── EngineInventory.ts         # Engine catalog
│   └── boot/
│       └── BootValidator.ts           # Boot-time validation
├── tools/
│   └── ci/
│       └── assert-additive-migrations.ts  # CI check
└── config/
    └── schema-map.ts                  # (from Part 02)

Documentation:
├── README_PART_04.md                  # This file
├── SYSTEM_MAP.md                      # (updated)
├── DB_CHANGELOG.md                    # (updated)
└── API_REGISTRY.md                    # (updated)
```

## Business Rules Enforced

| Rule | Description |
|------|-------------|
| ARCH-01 | A layer may not import from a layer above it |
| ARCH-02 | No repository method accepts a connection other than ctx.tx |
| ARCH-03 | No external HTTP call inside a transaction |
| ARCH-04 | No notification/email/push awaited inside a transaction |
| ARCH-05 | A migration touching a non-dx_ object fails the build |
| ARCH-06 | Locks are taken in fixed global order |
| ARCH-07 | Long-running work runs as batch job, not request transaction |

## Naming Standards

- **Permission keys:** `module.entity.action` (lower snake within segments)
- **Event types:** `module.entity.pastTenseVerb` (e.g., `procure.po.released`)
- **Table names:** `dx_<domain>_<noun>` singular
- **API routes:** `/api/dx/v1/<module>/<plural-resource>`
- **Service methods:** verb-first use-case names (e.g., `releasePurchaseOrder`)
- **Money:** never `number`, always `Money` value object
- **Quantity:** `Quantity` value object carrying a UoM
- **Dates:** `DATE` for business dates, `TIMESTAMPTZ` for event times
- **Nulls:** `0` and `NULL` are never interchangeable

## Definition of Done

A pull request is not mergeable unless all of these hold:

- [ ] Migration contains only `dx_`/`vw_dx_` objects; additive-migration CI check passes
- [ ] Every new endpoint declares a permission key; endpoint-coverage test passes
- [ ] Every write path goes through UnitOfWork and produces audit rows
- [ ] Every state change emits the declared outbox event
- [ ] Every validation is in the domain layer, has a stable error code, and has a unit test
- [ ] Any figure rendered in the UI has a documented source query
- [ ] Screens use Part 15 metadata or Part 14 components; no ad-hoc styling
- [ ] Responsive behaviour verified at 320 / 768 / 1440
- [ ] Unit tests for domain logic, integration tests for the use case, contract test for the API shape, and a permission test
- [ ] SYSTEM_MAP.md, API_REGISTRY.md, DB_CHANGELOG.md updated in the same PR

## Acceptance Criteria (All Met)

- [x] Seven-layer architecture defined with dependency rules
- [x] Folder structure established
- [x] Unit of Work pattern implemented with audit and outbox
- [x] Legacy Repository base class implemented
- [x] Legacy Write Bridge with whitelist enforcement implemented
- [x] Extension Repository pattern implemented
- [x] Module Definition contract defined
- [x] Module Registry with validation implemented
- [x] Additive migration CI check implemented
- [x] Engine inventory cataloged (24 engines)
- [x] Boot-time validator implemented
- [x] Naming and coding standards documented
- [x] Definition of done documented

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- Vite bundles successfully
- Output: 663KB JS, 56KB CSS
- All platform services compile correctly

## What Part 04 Does NOT Create

- ❌ No actual business modules (Part 26 is the worked example)
- ❌ No actual permission engine (Part 06)
- ❌ No actual workflow engine (Part 08)
- ❌ No actual posting engines (Part 09)
- ❌ No actual calculation engines (Part 10)
- ❌ No actual UI generator (Part 15)

**Part 04 establishes the architecture that all subsequent parts build inside.**

## Next Steps

### Part 05: API Contract, Validation & Error Framework

Part 05 will:
1. Define API envelope structure
2. Create validation framework (3 tiers)
3. Establish error handling (8 classes)
4. Define permission key format

**Database Impact:** None — defines contracts

### Part 06: User, Role, Responsibility & Permission Model

Part 06 will:
1. Create first database tables (dx_user, dx_role, dx_permission)
2. Implement permission resolver
3. Implement guards and masking
4. Implement SoD evaluator

**Database Impact:** First tables created

## Key Takeaways

1. **Seven-layer architecture** — strict dependency rules enforced by CI
2. **Unit of Work** — single transaction scope with audit and outbox
3. **Legacy adapter** — reads from existing tables via schema map
4. **Write bridge** — controlled writes to existing tables via whitelist
5. **Extension pattern** — side tables for adding fields without modifying existing tables
6. **Module definition** — declarative registration of permissions, workflows, documents, KPIs
7. **Engine inventory** — 24 shared engines built once, consumed by many
8. **Boot validation** — validates all registrations at startup
9. **Additive-only migrations** — CI check prevents destructive changes
10. **Definition of done** — comprehensive checklist for every PR

---

**Part 04 of 69 — Complete**

Ready for Part 05: API Contract, Validation & Error Framework.
