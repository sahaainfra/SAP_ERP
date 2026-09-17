# Part 17 — Step Zero Inspection Report

## Existing Measurement Book Tables

Based on `src/config/schema-map.ts`, the following MB-related tables exist:

### Measurement Book
| Business Object | Table | PK | Status Field | Numbering | Notes |
|---|---|---|---|---|---|
| Measurement Book | `measurement_books` | id | status | mb_number | FK: project_id, measured_by, checked_by |

### MB Lines
| Business Object | Table | PK | Status Field | Notes |
|---|---|---|---|---|
| MB Line | NOT PRESENT | — | — | No separate MB line table exists |
| MB Dimension | NOT PRESENT | — | — | No dimension tracking |

---

## Critical Questions

### 1. How is quantity currently calculated?

**Current State:**
- ❌ No dimension calculation engine exists
- ❌ No formula catalogue
- ❌ No deduction rules
- ❌ No previous/current/cumulative tracking
- ❌ No rounding rules per BOQ item

**Required for Part 17:**
- 16+ formula types (LINEAR, AREA_LB, VOLUME_LBH, STEEL_WEIGHT, etc.)
- Server-authoritative calculation engine
- Configurable deduction rules
- Automatic previous/cumulative computation
- Item-specific rounding rules

### 2. What is the existing MB structure?

**Current State:**
- Basic MB header table exists
- No line item detail
- No dimension tracking
- No evidence linkage
- No joint measurement support
- No certification chain

**Required for Part 17:**
- MB header with context (CLIENT/SUBCONTRACT/INTERNAL)
- MB lines with BOQ item linkage
- MB dimensions with formula-based calculation
- Evidence tracking (photos, sketches, WIR, test reports)
- Joint measurement with signature capture
- 3-stage certification (measured → checked → certified)
- Immutable locking with hash chain

### 3. Existing deduction handling?

**Current State:**
- ❌ No deduction tracking
- ❌ No deduction rules
- ❌ No rule reference for audit

**Required for Part 17:**
- Deductions as first-class dimension rows (DEDUCT type)
- Configurable deduction rules per BOQ item type
- Rule reference recording for audit
- Manual deduction with description and highlighting

### 4. Existing previous/cumulative logic?

**Current State:**
- ❌ No previous quantity tracking
- ❌ No cumulative computation
- ❌ No ceiling enforcement

**Required for Part 17:**
- Automatic previous quantity computation from certified MBs
- Cumulative = previous + current
- Ceiling enforcement (BOQ qty × (1 + ceiling %))
- Out-of-order certification handling
- Revised MB supersession with downstream recomputation

### 5. Existing MB print format?

**Current State:**
- ❌ No MB print format exists
- ❌ No byte-identical reproduction requirement

**Required for Part 17:**
- Page-numbered, continuous print format
- Dimension detail with formula shown
- Deduction detail
- Signatures (measured, checked, certified, client)
- QR code linking to verification page
- PDF hash stored with lock_hash

---

## GAP LIST

### Critical Gaps for Part 17

1. **MB Structure**
   - ❌ No MB line table
   - ❌ No MB dimension table
   - ❌ No measurement context (CLIENT/SUBCONTRACT/INTERNAL)
   - ❌ No BOQ version linkage
   - ❌ No MB type (RUNNING/FINAL/SUPPLEMENTARY/REVISED/ADVANCE)
   - ❌ No page continuity tracking
   - ❌ No revision tracking
   - **Need:** `dx_mb`, `dx_mb_line`, `dx_mb_dimension`

2. **Dimension Calculation Engine**
   - ❌ No formula catalogue
   - ❌ No calculation engine
   - ❌ No unit conversion
   - ❌ No rounding rules
   - ❌ No calc_hash for tamper evidence
   - **Need:** Calculation engine with 16+ formulas

3. **Deduction Engine**
   - ❌ No deduction rules
   - ❌ No rule reference tracking
   - ❌ No automatic deduction application
   - **Need:** Deduction rule system

4. **Previous/Cumulative Tracking**
   - ❌ No previous quantity computation
   - ❌ No cumulative tracking
   - ❌ No ceiling enforcement
   - ❌ No out-of-order certification handling
   - **Need:** Automatic computation logic

5. **Evidence & Joint Measurement**
   - ❌ No evidence linkage (photos, sketches, WIR, test reports)
   - ❌ No joint measurement support
   - ❌ No signature capture
   - ❌ No client representative tracking
   - **Need:** Evidence and joint measurement system

6. **Certification & Locking**
   - ❌ No 3-stage certification chain
   - ❌ No immutable locking
   - ❌ No lock_hash chain
   - ❌ No revision mechanism
   - **Need:** Certification and locking system

7. **Dispute Handling**
   - ❌ No disputed quantity tracking
   - ❌ No dispute resolution workflow
   - **Need:** Dispute management

8. **Automation**
   - ❌ No auto-pull of previous quantities
   - ❌ No auto-suggest dimensions
   - ❌ No auto-compute on dimension change
   - ❌ No auto-link WIR/test reports
   - ❌ No auto-update Part 13 progress
   - ❌ No auto-compute Part 15 consumption
   - ❌ No abnormal measurement detection
   - **Need:** Automation logic

9. **Mobile Support**
   - ❌ No phone-optimized MB entry
   - ❌ No offline draft support
   - ❌ No photo capture integration
   - **Need:** Mobile MB entry

10. **Print & Reports**
    - ❌ No MB print format
    - ❌ No byte-identical reproduction
    - ❌ No PDF hash storage
    - ❌ No abstract of quantities
    - ❌ No measurement register
    - ❌ No quantity reconciliation
    - **Need:** Print and report system

---

## Formula Baseline

### Existing Formulas
**Status:** None exist — this is a new system

### Required Formula Catalogue (16 formulas)

1. **LINEAR** — nos × L
   - Use: Skirting, kerb, pipe
   - Inputs: nos, length

2. **AREA_LB** — nos × L × B
   - Use: Plaster, flooring, shuttering
   - Inputs: nos, length, breadth

3. **VOLUME_LBH** — nos × L × B × H
   - Use: Concrete, excavation, masonry
   - Inputs: nos, length, breadth, height

4. **AREA_CIRCLE** — nos × π × r²
   - Use: Circular slab
   - Inputs: nos, radius

5. **VOLUME_CYL** — nos × π × r² × H
   - Use: Pile, circular column
   - Inputs: nos, radius, height

6. **VOLUME_CONE** — nos × ⅓ × π × r² × H
   - Use: Pile bulb
   - Inputs: nos, radius, height

7. **TRAPEZOID_AREA** — nos × ½ × (a+b) × h
   - Use: Irregular section
   - Inputs: nos, side_a, side_b, height

8. **PRISMOIDAL** — nos × L/6 × (A₁ + 4Aₘ + A₂)
   - Use: Earthwork between cross-sections
   - Inputs: nos, length, area_1, area_mid, area_2

9. **MEAN_AREA** — nos × L × (A₁+A₂)/2
   - Use: Earthwork, simple method
   - Inputs: nos, length, area_1, area_2

10. **STEEL_WEIGHT** — nos × count × length × (d²/162.0)
    - Use: Reinforcement in kg
    - Inputs: nos, bar_count, bar_length, bar_diameter_mm
    - **Critical:** Must use 162.0 divisor (Indian standard)

11. **STEEL_TABLE** — nos × count × length × unit_weight
    - Use: Structural steel sections
    - Inputs: nos, bar_count, bar_length, unit_weight (from master)

12. **SIMPSON** — h/3 × (y₀ + 4Σodd + 2Σeven + yₙ)
    - Use: Irregular area from offsets
    - Inputs: interval_h, offsets[]

13. **TRAPEZOIDAL_RULE** — h × (½y₀ + Σy + ½yₙ)
    - Use: Irregular area from offsets
    - Inputs: interval_h, offsets[]

14. **WEIGHT_DENSITY** — volume × density
    - Use: Bituminous, RCC by weight
    - Inputs: volume, density

15. **COUNT** — nos
    - Use: Fixtures, fittings
    - Inputs: nos

16. **DIRECT** — entered value
    - Use: Where a drawing gives the quantity
    - Inputs: direct_quantity

---

## Summary

### What Exists
✅ Basic MB header table
✅ MB numbering

### What's Missing (Critical for Part 17)
❌ MB line and dimension tables
❌ Dimension calculation engine (16 formulas)
❌ Deduction engine with rules
❌ Previous/cumulative tracking
❌ Evidence and joint measurement
❌ Certification and locking
❌ Dispute handling
❌ Automation features
❌ Mobile support
❌ Print and reports

### What Must Be Preserved
✅ All existing MBs
✅ Existing MB numbers
✅ Existing MB status
✅ Existing print output (if any)

---

## Next Steps

1. Create MB structure tables (dx_mb, dx_mb_line, dx_mb_dimension)
2. Build dimension calculation engine with 16 formulas
3. Build deduction engine with configurable rules
4. Implement previous/cumulative tracking
5. Build evidence and joint measurement system
6. Implement certification and locking with hash chains
7. Build dispute handling
8. Implement automation features
9. Build MB workbench UI (desktop, tablet, phone)
10. Build MB print format
11. Build reports (abstract, register, reconciliation)
12. Test formula accuracy against hand calculations
13. Verify historical MB recomputation (zero variance)
14. Test immutability of certified MBs
15. Test hash chain integrity

**Ready to proceed with implementation.**
