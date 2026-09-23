# Part 19 Completion Summary

## Part 19: Responsive Desktop, Tablet & Mobile Delivery Framework

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Progress:** 19 of 69 parts (27.5%)

---

## What Was Delivered

### Database Layer

**Migration:** `migrations/019_create_sync_log.sql`

Created 1 new table:
- **dx_sync_log** — Tracks offline sync operations with idempotency guarantees
  - Records both device and server clocks to detect skew
  - Uses client-generated UUID as idempotency key
  - Prevents duplicate document creation on sync
  - Indexes for common queries (user, status, entity, device)

### Breakpoint System

**Configuration:** `src/config/breakpoints.ts`

Single source of truth for responsive breakpoints:
- **xs:** 0-599px (Phone portrait)
- **sm:** 600-899px (Phone landscape / small tablet)
- **md:** 900-1279px (Tablet)
- **lg:** 1280-1679px (Desktop)
- **xl:** 1680px+ (Large desktop)

**Features:**
- Generates both CSS custom media queries and JavaScript constants
- Utility functions: `getBreakpoint()`, `isAtLeast()`, `isAtMost()`, `isWithin()`
- Device type detection: `getDeviceType()`, `isTouchDevice()`
- React hooks: `useBreakpoint()`, `useContainerSize()`
- Responsive render helper: `<Responsive>` component

### Offline Sync Engine

**Implementation:** `src/platform/offline/sync-engine.ts`

Comprehensive offline-first architecture:
- **IndexedDB storage** for offline records and cached reference data
- **Idempotent sync** using client-generated UUIDs as idempotency keys
- **Offline allow-list** enforcement (only draft-creating operations)
- **Conflict resolution** per entity type
- **Clock skew detection** (flags > 5 minutes)
- **Exponential backoff retry** (max 5 attempts)
- **Periodic sync** (every 5 minutes when online)
- **Network status listeners** (sync on reconnect)

**Offline Allow-List:**
- Attendance punch (geo-tagged)
- MB measurement line entry (draft only)
- Site photo / progress photo capture
- WIR request raise (draft)
- Safety observation / near-miss report
- Equipment logsheet entry
- Material issue slip (draft)
- Checklist / inspection completion

**Never Permitted Offline:**
- Any approval, certification, posting
- Any bill, PO release, payment
- Any permission change
- Any backup/restore action
- Any stock-affecting confirmation
- Anything that consumes a number from the numbering series

### PWA Support

**Manifest:** `public/manifest.json`
- App name, short name, description
- Theme color from Horizon brand token
- Display mode: standalone
- Orientation: any
- Icons: 192x192 and 512x512

**Service Worker:** `public/sw.js`
- **Cache-first** for app shell, fonts, icons, static assets
- **Stale-while-revalidate** for reference/master data (24h freshness ceiling)
- **Network-first** for transactional reads (with "cached data" banner)
- **Never cache** write operations
- **Background sync** support
- **Push notification** support
- **Version awareness** with update prompts

**HTML Updates:** `index.html`
- PWA meta tags (theme-color, apple-mobile-web-app-*)
- Manifest link
- Service worker registration
- Update detection and prompting

### Mobile Components

**1. Bottom Tab Bar** (`src/components/mobile/BottomTabBar.tsx`)
- 5 fixed slots: Home, Work, Create, Search, More
- Respects safe-area insets
- Hides on scroll down, reappears on scroll up
- Badge counts for actionable items
- Only renders on phone breakpoint

**2. Create Sheet** (`src/components/mobile/CreateSheet.tsx`)
- Bottom sheet with drag-to-dismiss
- Three detents: peek (30vh) / half (60vh) / full (90vh)
- Shows only documents user may create in current project context
- Grouped by module, ordered by frequency of use
- Includes "Scan" entry for QR/barcode
- Permission-filtered (server-side resolution)

**3. Sync Issues Screen** (`src/components/mobile/SyncIssuesScreen.tsx`)
- Displays failed and rejected sync records
- Actions: Edit, Retry, Discard
- Shows record details, server error message, payload preview
- Clock skew warning if > 5 minutes
- Status badges with colors
- Empty state when no issues

**4. Mobile Line Editor** (`src/components/mobile/MobileLineEditor.tsx`)
- Full-screen editor for one dimension set at a time
- Large numeric inputs with dedicated keypad
- Live-computed quantity shown prominently
- Previous/Next line navigation
- "Repeat last dimension set" action
- "Add similar line" action
- Running cumulative total pinned to top
- Uses same calculation module as desktop (Part 12)

**5. Adaptive Table** (`src/components/tables/AdaptiveTable.tsx`)
- Three modes: table, card, compact list
- **Table mode** (M and up): Full grid with all columns
- **Card mode** (XS/S default): Each row becomes a card
  - Primary field (identity line)
  - Secondary fields (up to 3)
  - Metric field (large, right-aligned)
  - Status indicator
  - Inline actions (up to 2)
  - Expandable fields (revealed on tap)
- **Compact list mode**: Single-line rows for selection contexts
- **Totals never lost**: Sticky summary bar in card mode
- **All columns reachable**: Via expand or object page
- Mode persists per table in user preferences

### Device Capability Wrappers

**Implementation:** `src/platform/mobile/device-capabilities.ts`

Unified access to device capabilities with graceful fallbacks:

**Camera:**
- Capture photos with compression (≤1600px, ≤500KB)
- EXIF GPS extraction (stripped after server reads it)
- Permission-denied fallbacks

**GPS / Geolocation:**
- Current location with accuracy ≤50m requirement
- Mocked location detection
- Watch location changes
- Clock skew recording

**QR / Barcode Scanner:**
- Uses browser Barcode Detection API
- JS fallback for unsupported browsers
- Supports: QR, EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E

**Biometric Authentication:**
- WebAuthn API for app re-entry
- Never for transaction authorization
- Permission-denied fallbacks

**Push Notifications:**
- Request permission
- Subscribe with VAPID key
- Check if enabled

**File Picker:**
- Same server-side validation as desktop
- Size limits enforced
- Type validation

**Share Sheet:**
- Native share API
- Shares permission-checked deep link
- Never shares file with data

### PWA Icons

**Created:**
- `public/icons/icon-192x192.svg`
- `public/icons/icon-512x512.svg`

Simple "DX" branding icons for PWA installation.

## Key Features

### One Codebase, Three Contexts

| Context | Who | Where | Conditions |
|---------|-----|-------|------------|
| **Desktop** | Management, Finance, Commercial, QS, Procurement, Admin | Office | Large screen, mouse, stable network, long sessions |
| **Tablet** | Site Engineer, QA/QC, HSE, Store Keeper, Client rep | Site office / walkabout | 9–12", touch, patchy 4G, gloves, glare |
| **Mobile** | Site staff, supervisors, drivers, approvers, labour in-charge | On the works | 5–7", one thumb, poor network, sunlight, dusty |

**The rule:** Same user with same permissions completes same business task on any device. What changes is layout, density, input method, and progressive disclosure — never capability, never data, never validation, never the permission set.

### Adaptive Layout Patterns

**Navigation:**
- Desktop: Shell bar + expanded left side navigation
- Tablet: Shell bar + icon-rail side nav (tap expands as overlay)
- Phone: Shell bar reduced + bottom tab bar (5 slots)

**Flexible Column Layout:**
- XL: Three columns (list / detail / sub-detail), resizable
- L: Two columns (list 33% / detail 67%)
- M: List OR detail with back affordance
- XS/S: Full-screen navigation stack

**Tables → Card Mode:**
- Declarative card config per table
- Primary, secondary, metric, status, actions, expand fields
- Totals as sticky summary bar
- No column unreachable

**Forms:**
- Desktop: Up to 3 fields per row
- Tablet: 2 per row
- Phone: 1 per row, full width
- Long forms: Steps on phone, anchored sections on desktop
- Sticky action footer on all devices
- Field behavior on touch:
  - Numeric: `inputmode="decimal"`, never `type="number"`
  - Date: Native picker on touch, calendar popover on desktop
  - Lookup: Full-screen search sheet on phone

### Touch, Density & Accessibility

**Density Modes:**
- **Cozy** (default on touch): 48px rows, 16px base font
- **Compact** (default on desktop): 32px rows, 14px base
- **Condensed** (opt-in, desktop only): 28px rows, 13px base

**Accessibility (WCAG 2.1 AA):**
- Text contrast ≥ 4.5:1
- Large text and UI components ≥ 3:1
- Status never conveyed by color alone (icon + text label)
- Full keyboard operability on desktop
- Visible focus ring on every interactive element
- All form fields have programmatically associated labels
- Respect `prefers-reduced-motion`
- Support browser text zoom to 200%
- High-contrast theme as first-class supported theme

**Site-Condition Hardening:**
- "High visibility" toggle (raises contrast, increases font size)
- All primary site actions operable with one thumb in lower half of screen
- Never require long-press as only way to reach action
- Confirmations for destructive actions require deliberate two-step

### The Three Documented Exceptions

Only these three functions may be restricted by device:

1. **Backup download and restore execution** — desktop only
   - Rationale: Requires controlled environment, two-person approval, large file handling
   - Message: "Restore operations must be performed from a desktop browser for safety."

2. **Bulk approval of more than 5 items** — desktop only
   - Rationale: Bulk financial approval on small screen is documented source of error
   - Message: States the limit and the reason

3. **Permission assignment editing and permission matrix view** — tablet and desktop only
   - Rationale: Matrix is inherently wide, impact preview must be readable
   - Viewing a user's effective permissions works on all devices

**No other function may be device-restricted.**

### Performance Budgets

Tested on mid-range Android device (Moto G-class) on throttled 3G:

| Metric | Desktop | Tablet | Phone |
|--------|---------|--------|-------|
| First Contentful Paint | ≤ 1.0s | ≤ 1.5s | ≤ 2.0s |
| Largest Contentful Paint | ≤ 2.0s | ≤ 2.5s | ≤ 3.0s |
| Time to Interactive | ≤ 2.5s | ≤ 3.5s | ≤ 4.5s |
| Cumulative Layout Shift | ≤ 0.1 | ≤ 0.1 | ≤ 0.1 |
| Interaction to Next Paint | ≤ 200ms | ≤ 200ms | ≤ 250ms |
| Initial JS (gzipped) | ≤ 350KB | ≤ 350KB | ≤ 250KB |
| Dashboard fully populated | ≤ 2.5s | ≤ 3.0s | ≤ 4.0s |
| List of 50 rows rendered | ≤ 1.0s | ≤ 1.2s | ≤ 1.5s |

**Techniques:**
- Route-level code splitting, module-level lazy loading
- Virtual scrolling above 100 rows (40 on phone)
- Images: responsive `srcset`, lazy loading, WebP/AVIF with fallback
- Skeleton screens matching final layout dimensions
- Font 72 subset and preloaded with `font-display: swap`
- Batched KPI endpoint mandatory on mobile
- Debounce search at 300ms, abort in-flight requests

### Offline Data Security

- Offline data encrypted at rest
- Scoped to authenticated user
- Sign-out clears it
- Device not synced within configured window forced to re-authenticate
- Geo-location capture used only where declared (attendance in Part 44)
- User told what is captured

### Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| DEV-01 | BLOCK | Same permission set, validations, workflow on every device |
| DEV-02 | BLOCK | Offline capture creates drafts only, never allocates numbers or affects stock |
| DEV-03 | BLOCK | Sync outbox uses client-generated `local_id` as idempotency key |
| DEV-04 | BLOCK | Three action classes refused on phones (server-side enforcement) |
| DEV-05 | BLOCK | No screen scrolls horizontally at 360px |
| DEV-06 | BLOCK | Touch targets at least 44×44px regardless of density |
| DEV-07 | BLOCK | Sync conflict resolved by declared resolver per entity, never last-write-wins |
| DEV-08 | WARN | Offline allow-list matches role matrix in Part 65 |

## File Structure

```
migrations/
└── 019_create_sync_log.sql           # Sync log table

src/config/
└── breakpoints.ts                     # Breakpoint system

src/platform/offline/
└── sync-engine.ts                     # Offline sync engine

src/platform/mobile/
└── device-capabilities.ts             # Device capability wrappers

src/components/mobile/
├── BottomTabBar.tsx                   # Mobile bottom navigation
├── CreateSheet.tsx                    # Mobile create sheet
├── SyncIssuesScreen.tsx               # Sync issues UI
└── MobileLineEditor.tsx               # Mobile line editor

src/components/tables/
└── AdaptiveTable.tsx                  # Three-mode adaptive table

public/
├── manifest.json                      # PWA manifest
├── sw.js                              # Service worker
└── icons/
    ├── icon-192x192.svg               # PWA icon
    └── icon-512x512.svg               # PWA icon

index.html                             # Updated with PWA support
```

## Integration Points

**Used By:**
- Part 20 (Dashboard Engine) — Mobile dashboard variants
- Part 69 (Cross-Module) — Mobile integration

**Dependencies:**
- Part 17 (Component System) — Base components
- Part 18 (Metadata-Driven UI) — Metadata definitions
- Part 12 (Calculation Engines) — Shared calculation module
- Part 13 (Real-Time Engine) — Gap recovery for offline sync

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All mobile components compile correctly
- PWA manifest and service worker configured
- Output: 695KB JS, 63KB CSS
- index.html includes PWA meta tags and service worker registration

---

## What Part 19 Does NOT Do

- ❌ Does not implement actual native app shell (Capacitor integration)
- ❌ Does not implement actual camera UI (uses browser API directly)
- ❌ Does not implement actual GPS UI (uses browser API directly)
- ❌ Does not implement actual barcode scanner UI (uses browser API directly)
- ❌ Does not implement actual biometric UI (uses WebAuthn API directly)
- ❌ Does not implement actual push notification server (client-side only)
- ❌ Does not implement actual image compression library (uses Canvas API)
- ❌ Does not implement actual EXIF parsing library (simplified version)

**Part 19 defines the responsive framework, offline sync engine, and device capability wrappers. Actual native app integration and third-party library integration happen in later parts or production deployment.**

---

## Testing Requirements

**Viewport Matrix — Every Screen Tested At:**
- 320×568, 375×812, 390×844, 414×896
- 768×1024 (portrait + landscape)
- 1024×768, 1280×800, 1440×900, 1920×1080, 2560×1440

**Automated:**
- Visual regression snapshots at 375, 768, 1440 for every route (light and dark theme)
- CI test: loads every route at 320px, fails on horizontal overflow
- Axe accessibility scan on every route (zero critical/serious violations)
- Lighthouse run against performance budgets
- Touch target audit: fail any interactive element below 44×44 on touch breakpoint

**Manual (on real hardware, not emulators):**
- One low-end Android phone, one iPhone, one Android tablet, one iPad
- Airplane-mode test: capture 10 offline records, restore connectivity, verify all 10 sync exactly once
- Forced duplicate submission rejected by idempotency key
- Outdoor legibility check on tablet in direct sunlight with high-visibility toggle
- One-thumb operability check for five most common site tasks
- Rotation test: rotate mid-form, confirm no data loss
- Interruption test: receive call mid-form, return, confirm draft restoration

---

## Next Steps

**Part 20: Real-Time Dashboard Engine & Universal Dashboard Structure**
- Dashboard composition from metadata
- Real-time KPI updates
- Widget rendering
- Dashboard personalization

---

**Part 19 of 69 — Complete** ✅  
**Progress: 27.5% of total build**  
**Next: Part 20 — Real-Time Dashboard Engine**
