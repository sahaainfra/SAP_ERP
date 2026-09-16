# Part 11 — Responsive & Multi-Device Framework

## Summary

Part 11 delivers a comprehensive responsive and multi-device framework that ensures the Construction ERP system works seamlessly across desktop, tablet, and mobile devices. This includes adaptive components, offline capture capabilities, PWA support, and device-specific optimizations.

## Deliverables

### 1. Breakpoint System ✅
- **File:** `src/config/breakpoints.ts`
- **Features:**
  - SAP Fiori adaptive model (xs, s, m, l, xl)
  - Single source of truth for breakpoints
  - Device type detection (phone, tablet, desktop)
  - Layout configuration per breakpoint
  - Touch target sizes per device
  - CSS custom properties generation

### 2. Responsive Hooks ✅
- **File:** `src/hooks/useResponsive.ts`
- **Hooks:**
  - `useBreakpoint()` — Current breakpoint and device info
  - `useContainerSize()` — Container-level responsive detection
  - `useOrientation()` — Portrait/landscape detection
  - `useTouchDevice()` — Touch capability detection
  - `useReducedMotion()` — Accessibility preference
  - `useHighContrast()` — High contrast preference
  - `useDarkMode()` — Dark mode preference
  - `useOnlineStatus()` — Online/offline detection
  - `useSafeAreaInsets()` — Notch detection
  - `useDebounce()` — Debounce utility
  - `usePageVisibility()` — Tab visibility
  - `useStandaloneMode()` — PWA detection
  - `useKeyboardVisibility()` — Mobile keyboard detection
  - `useScrollDirection()` — Scroll direction
  - `useInView()` — Viewport intersection
  - `useResponsiveValue()` — Responsive value selection
  - `useIdleTimeout()` — Idle detection

### 3. Responsive Component ✅
- **File:** `src/components/Responsive.tsx`
- **Components:**
  - `<Responsive>` — Conditional rendering based on breakpoint/device
  - `<ShowOnPhone>`, `<ShowOnTablet>`, `<ShowOnDesktop>` — Device-specific rendering
  - `<HideOnPhone>`, `<HideOnTablet>`, `<HideOnDesktop>` — Device-specific hiding
  - `<ShowOnTabletAndUp>`, `<ShowOnDesktopOnly>` — Range-based rendering
  - `<ResponsiveText>` — Text that changes per breakpoint
  - `<DeviceRestrictionMessage>` — Message for restricted features
  - `<ResponsiveContainer>` — Max-width container

### 4. Mobile Shell ✅
- **File:** `src/components/MobileShell.tsx`
- **Features:**
  - 5-tab bottom navigation (Home, Work, Create, Search, More)
  - Safe area support for notched devices
  - Badge counts for notifications
  - Create button with elevated styling
  - Touch-optimized (48px targets)
  - Keyboard accessible

### 5. Create Sheet ✅
- **File:** `src/components/CreateSheet.tsx`
- **Features:**
  - Bottom sheet with permitted create actions
  - Grouped by module
  - Sorted by usage frequency
  - Search functionality
  - QR/barcode scanner integration
  - Permission-filtered actions
  - Smooth slide-up animation

### 6. Responsive CSS ✅
- **File:** `src/styles/responsive.css`
- **Features:**
  - SAP Fiori breakpoint media queries
  - Device type CSS custom properties
  - Display utilities (hidden/visible per device)
  - Responsive grid system
  - Responsive container
  - Touch-friendly utilities
  - Mobile/tablet/desktop-specific utilities
  - High visibility mode
  - Density adjustments
  - Reduced motion support
  - Touch device optimizations
  - Landscape mode optimizations
  - Safe area insets
  - Responsive typography
  - Responsive spacing

### 7. PWA Support ✅
- **Files:**
  - `public/manifest.json` — PWA manifest
  - `public/sw.js` — Service worker
  - `index.html` — Updated with PWA meta tags
- **Features:**
  - Installable PWA
  - Offline support
  - Background sync
  - Push notifications
  - Cache management
  - Update detection

### 8. Offline Capture ✅
- **File:** `src/hooks/useOfflineCapture.tsx`
- **Features:**
  - IndexedDB outbox for offline actions
  - Automatic sync when online
  - Retry logic with exponential backoff
  - Persistent storage
  - Status tracking
  - Manual sync capability
  - OfflineIndicator component
  - OfflineCaptureForm wrapper

## Database Changes

### New Table: dx_sync_log
```sql
CREATE TABLE dx_sync_log (
  id               BIGSERIAL PRIMARY KEY,
  local_id         UUID NOT NULL,
  device_id        VARCHAR(100) NOT NULL,
  user_id          BIGINT NOT NULL,
  project_id       BIGINT,
  entity_type      VARCHAR(80) NOT NULL,
  server_record_id BIGINT,
  status           VARCHAR(20) NOT NULL,
  captured_at      TIMESTAMPTZ NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL,
  clock_skew_sec   INTEGER,
  error_message    TEXT,
  payload_hash     CHAR(64) NOT NULL,
  CONSTRAINT uq_dx_sync_local UNIQUE (local_id)
);
```

**Purpose:** Track offline sync operations with idempotency keys to prevent duplicate records.

## API Endpoints

### New Endpoints (4)
1. `POST /api/dx/v1/sync` — Sync offline queue (idempotent)
2. `GET /api/dx/v1/sync/status` — Get sync status
3. `POST /api/dx/v1/sync/retry` — Retry failed syncs
4. `DELETE /api/dx/v1/sync/{localId}` — Discard sync item

## Breakpoint System

### SAP Fiori Adaptive Model
| Token | Range | Name | Layout |
|-------|-------|------|--------|
| xs | 0-599px | Phone | Single column, bottom nav |
| s | 600-899px | Small tablet | Single column, wider fields |
| m | 900-1279px | Tablet | Two column, collapsible nav |
| l | 1280-1679px | Desktop | Full shell, 3-column capable |
| xl | 1680px+ | Large desktop | Full shell, 4-column tiles |

## Device Support

### Phone (xs + s)
- Bottom tab navigation (5 tabs)
- Single column layouts
- Card mode for tables
- Stepped forms
- Full-screen dialogs
- Touch-optimized (48px targets)
- Offline capture
- Camera/GPS/scanner integration

### Tablet (m)
- Icon rail navigation
- Two column layouts
- Table mode with optional card mode
- Anchored form sections
- Modal dialogs
- Touch-optimized (44px targets)
- Offline capture

### Desktop (l + xl)
- Expanded sidebar navigation
- Multi-column layouts
- Full table mode
- Anchored form sections
- Modal dialogs and popovers
- Mouse-optimized
- Full feature set

## Key Features

### 1. Adaptive Layout
- Components automatically adjust to device
- No separate mobile/desktop codebases
- Consistent user experience across devices
- Progressive disclosure on smaller screens

### 2. Offline-First
- Capture data without internet
- Automatic sync when connection restored
- Conflict resolution with idempotency keys
- Visual sync status indicators
- Sync issues screen for failed items

### 3. PWA Capabilities
- Installable as native app
- Works offline
- Push notifications
- Background sync
- Fast loading with caching

### 4. Touch Optimization
- 44px minimum touch targets (WCAG 2.1 AA)
- Swipe gestures for common actions
- Pull-to-refresh
- Native pickers for date/number inputs
- Camera integration for photo capture
- GPS for location tagging
- QR/barcode scanning

### 5. Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion support
- Text zoom to 200%
- Focus indicators

### 6. Performance
- Route-level code splitting
- Lazy loading
- Virtual scrolling
- Optimized images
- Efficient caching
- Fast initial load

## Testing

### Automated Tests
- Visual regression at 375, 768, 1440px
- No horizontal overflow at 320px
- Axe accessibility scan
- Lighthouse performance audit
- Touch target size validation

### Manual Tests
- Real device testing (iOS, Android)
- Offline capture and sync
- Camera/GPS/scanner functionality
- Rotation and interruption handling
- Outdoor legibility

## Performance Budgets

| Metric | Desktop | Tablet | Phone |
|--------|---------|--------|-------|
| First Contentful Paint | ≤ 1.0s | ≤ 1.5s | ≤ 2.0s |
| Largest Contentful Paint | ≤ 2.0s | ≤ 2.5s | ≤ 3.0s |
| Time to Interactive | ≤ 2.5s | ≤ 3.5s | ≤ 4.5s |
| Initial JS (gzipped) | ≤ 350KB | ≤ 350KB | ≤ 250KB |

## Documentation

### New Files
- `src/config/breakpoints.ts` — Breakpoint configuration
- `src/hooks/useResponsive.ts` — Responsive hooks
- `src/components/Responsive.tsx` — Responsive components
- `src/components/CreateSheet.tsx` — Mobile create sheet
- `src/hooks/useOfflineCapture.tsx` — Offline capture system
- `RESPONSIVE_MAP.md` — Screen-by-screen responsive behavior
- `PART_11_STEP_ZERO_INSPECTION.md` — Initial inspection report
- `PART_11_COMPLETION.md` — This file

### Updated Files
- `src/styles/responsive.css` — SAP Fiori breakpoints
- `src/components/MobileShell.tsx` — 5-tab navigation
- `index.html` — PWA meta tags
- `DB_CHANGELOG.md` — Added dx_sync_log
- `API_REGISTRY.md` — Added sync endpoints

## Acceptance Checklist

### Breakpoint System
- [x] SAP Fiori breakpoints defined
- [x] Single source of truth (CSS + JS)
- [x] Device type detection
- [x] Layout configuration per breakpoint

### Responsive Components
- [x] useBreakpoint hook
- [x] useContainerSize hook
- [x] Responsive render helper
- [x] Device-specific components

### Mobile Shell
- [x] 5-tab bottom navigation
- [x] Safe area support
- [x] Badge counts
- [x] Create button
- [x] Touch-optimized

### Create Sheet
- [x] Permitted actions only
- [x] Grouped by module
- [x] Sorted by frequency
- [x] Search functionality
- [x] Scanner integration

### Offline Capture
- [x] IndexedDB outbox
- [x] Automatic sync
- [x] Retry logic
- [x] Status tracking
- [x] Visual indicators

### PWA Support
- [x] Manifest configured
- [x] Service worker registered
- [x] Offline support
- [x] Installable
- [x] Update detection

### Responsive CSS
- [x] SAP Fiori breakpoints
- [x] Device utilities
- [x] Grid system
- [x] Touch targets
- [x] Safe areas

### Documentation
- [x] RESPONSIVE_MAP.md
- [x] Step Zero inspection
- [x] Completion summary
- [x] DB_CHANGELOG updated
- [x] API_REGISTRY updated

### Testing
- [x] Build passes
- [x] TypeScript strict mode
- [x] No lint errors
- [x] Responsive utilities tested
- [x] Mobile shell tested

## Integration with Previous Parts

### Part 1 (Design System)
- ✅ Uses all design tokens
- ✅ Respects theme switching
- ✅ Supports density modes
- ✅ Extends spacing scale

### Part 2 (Shell)
- ✅ Mobile shell complements desktop shell
- ✅ Shared navigation structure
- ✅ Consistent branding

### Part 3 (Permissions)
- ✅ Create sheet filters by permissions
- ✅ Offline actions respect permissions
- ✅ Sync validates permissions

### Part 5 (Components)
- ✅ Responsive components wrap existing
- ✅ Smart table extended with card mode
- ✅ Forms adapted for mobile

### Part 7 (Workflow)
- ✅ Offline capture for approvals
- ✅ Offline capture for tasks
- ✅ Offline capture for exceptions

## What's Next — Part 12 Preview

### Part 12: Master Data & Enterprise Structure
- Enterprise hierarchy (Company → Branch → Department → Project → Site)
- BOQ (Bill of Quantities) management
- Item master with classification
- Vendor master with approval workflow
- Material master with UOM
- Cost codes and allocation
- Approval-controlled master data

### Dependencies
- ✅ Part 1-11 complete
- 🔄 Part 12 next

## Sign-Off

**Part 11 Status:** ✅ COMPLETE  
**Ready for Part 12:** ✅ YES  
**Blockers:** None  
**Risks:** None  

**Next Action:** Begin Part 12 — Master Data & Enterprise Structure

---

**Document prepared by:** AI Assistant  
**Date:** 2026-02-10  
**Version:** 11.0
