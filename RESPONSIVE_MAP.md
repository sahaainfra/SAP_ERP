# RESPONSIVE_MAP.md — Part 11

## Overview

This document maps every screen in the Construction ERP to its responsive behavior across all breakpoints and device types.

**Breakpoints (SAP Fiori Adaptive Model):**
- **xs**: 0-599px (Phone portrait)
- **s**: 600-899px (Phone landscape / small tablet)
- **m**: 900-1279px (Tablet)
- **l**: 1280-1679px (Desktop)
- **xl**: 1680px+ (Large desktop)

**Device Types:**
- **Phone**: xs + s (0-899px)
- **Tablet**: m (900-1279px)
- **Desktop**: l + xl (1280px+)

---

## Global Shell

### Shell Bar
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Logo + context chip + search icon + avatar. Compact height (48px). |
| m | Logo + product title + search bar + icons + avatar. Standard height (48px). |
| l-xl | Full shell bar with all elements. Standard height (48px). |

### Side Navigation
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Hidden. Bottom tab bar shown instead (5 tabs: Home, Work, Create, Search, More). |
| m | Icon rail (48px wide). Tap to expand as overlay. Auto-collapses on selection. |
| l-xl | Expanded sidebar (256px wide). Pinnable. Full labels visible. |

### Context Switcher
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Collapses to single button showing summary. Opens full-screen sheet. |
| m | Horizontal bar with dropdowns. Compact. |
| l-xl | Full horizontal bar with all dimensions visible. |

### Bottom Tab Bar (Phone Only)
| Tab | Icon | Badge | Action |
|-----|------|-------|--------|
| Home | 🏠 | — | Navigate to role dashboard |
| Work | ✅ | Total actionable items | Combined approvals + tasks + exceptions |
| Create | ➕ | — | Open create sheet with permitted documents |
| Search | 🔍 | — | Open global search |
| More | ⋯ | Notification count | Full module tree, notifications, profile, settings, offline queue |

---

## Dashboard (Part 6)

### Role Dashboard
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Single column stack. KPI cards 1-up. Charts full-width. Widget order from personalization record (linearized). |
| m | 2-column grid. KPI cards 2-up. Charts side-by-side where possible. |
| l-xl | 3-4 column grid. KPI cards 4-up. Full dashboard layout. |

### Universal Home
| Breakpoint | Behavior |
|------------|----------|
| xs-s | My Work tiles stack vertically. Attention alerts full-width. |
| m | My Work tiles 2-up. Attention alerts 2-column. |
| l-xl | My Work tiles 4-up. Attention alerts 3-column. |

### Project 360
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Section tabs become horizontally scrollable strip. Health score card pinned at top. Sections stack vertically. |
| m | Section tabs visible. Health score + sections in 2-column layout. |
| l-xl | Full layout with all sections visible. Health score prominent. |

---

## Smart Table (Part 5)

### Three-Mode Smart Table
| Mode | Breakpoint | Behavior |
|------|------------|----------|
| **Table** | m-xl | Full grid with server-side paging, sorting, filtering. Horizontal scroll within table container. Sticky header. Totals row pinned at bottom. |
| **Card** | xs-s (default) | Each row becomes a card. Card config declared per table (primary, secondary, metric, status, actions, expand). Totals shown in sticky summary bar at top. |
| **Compact List** | xs-s (for selection) | Single-line rows. Avatar/icon + primary text + trailing metric. Used for pickers (BOQ item, vendor, etc.). |

**Mode Switcher:**
- Available at all breakpoints
- User choice persists per table in `dx_user_preference`
- Icon in table toolbar

**Card Mode Configuration Example (Purchase Orders):**
```typescript
{
  primary: { field: 'poNumber', secondary: 'vendor' },
  secondary: [
    { label: 'Amount', field: 'amount', format: 'currency' },
    { label: 'Date', field: 'orderDate', format: 'date' },
    { label: 'Status', field: 'status', format: 'status' },
  ],
  metric: { field: 'amount', format: 'currency' },
  status: { field: 'status' },
  actions: ['view', 'edit'],
  expand: ['deliveryDate', 'paymentTerms', 'notes'],
}
```

**Totals in Card Mode:**
- Computed server-side across full filtered set (not just loaded page)
- Shown in sticky summary bar at top of list
- Same aggregate values as table mode totals row

---

## Forms

### Create/Edit Forms
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Single column. Full-width fields. Long forms split into steps. Sticky action footer (full-width primary button). Autosave draft every 10s. |
| m | 2 columns per row. Anchored sections. Sticky action footer. Autosave draft. |
| l-xl | Up to 3 columns per row. Anchored sections. Sticky action footer. Autosave draft. |

**Field Behavior on Touch:**
- Numeric fields: `inputmode="decimal"` (not `type="number"`)
- Date fields: Native date picker on touch, calendar popover on desktop
- Lookup fields: Full-screen search sheet on phone (never plain `<select>` with 4000 options)
- Minimum touch target: 44×44px (48px recommended)
- Minimum spacing between targets: 8px

**Validation:**
- Inline messages beneath field
- Summary at top of form
- On phone: first invalid field scrolled into view with focus

**Autosave Draft:**
- Every 10 seconds
- On blur
- Local only until explicitly submitted
- Restored on return with clear banner
- Survives app kill / network drop

---

## Object Page (Part 6)

### Object Page
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Header collapses to sticky compact header on scroll. 9 sections become accordion. Each section expandable/collapsible. |
| m | Header remains visible. Sections in 2-column layout where appropriate. |
| l-xl | Full header with all key facts. Sections in standard layout. |

**Sticky Compact Header (Phone):**
- Shows: object number, status, primary action
- Hides: secondary key facts
- Remains visible on scroll

---

## Approval Centre (Part 7)

### Approval Centre
| Breakpoint | Behavior |
|------------|----------|
| xs-s | List of pending items. Tap opens full-screen detail with decision bar pinned to bottom. **Bulk approval disabled** (see §9 exceptions). |
| m | List + detail split view. Detail opens as right-side overlay. |
| l-xl | Full list + detail layout. Bulk approval available. |

**Decision Bar (Phone):**
- Pinned to bottom of screen
- Shows: Approve, Return, Reject, Forward
- Always visible when viewing approval detail
- Respects safe area insets

---

## Task Centre (Part 7)

### Task Centre
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Grouped list with swipe actions (complete / snooze). Tap opens full-screen detail. |
| m | Board view (Kanban) or list view. Detail in side panel. |
| l-xl | Full board view with all columns visible. Detail in side panel. |

**Swipe Actions (Phone):**
- Swipe right: Complete task
- Swipe left: Snooze task
- Visual feedback during swipe
- Confirmation not required for complete (reversible)

---

## Filter Bar (Part 5)

### Filter Bar
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Collapses to "Filters (3)" button. Opens full-screen filter sheet. Applied filters shown as removable chips below header. |
| m | Horizontal filter bar with dropdowns. "More filters" expands additional filters. |
| l-xl | Full filter bar with all filters visible. |

**Full-Screen Filter Sheet (Phone):**
- Slides up from bottom
- All filters in single column
- Large touch targets
- "Apply" and "Clear" buttons at bottom
- Drag to dismiss

---

## Charts (Part 5)

### Charts
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Reflow by container width. Max 4 categories + "Other" aggregate. Axis labels rotated or dropped in favour of direct labelling. Legends move below plot and become horizontally scrollable chips. Charts with >8 series default to "View as table" representation. |
| m | Standard chart layout. Legends visible. |
| l-xl | Full chart with all features. |

**Touch Interactions:**
- Tap: Show tooltip and pin it
- Tap elsewhere: Dismiss tooltip
- Pinch-zoom: Enabled only on timeline charts (S-curve, cash flow) and Gantt
- Minimum chart size: 200px in either dimension (show table instead if smaller)

---

## Exception Centre (Part 7)

### Exception Centre
| Breakpoint | Behavior |
|------------|----------|
| xs-s | List view with cards. Tap opens full-screen detail. |
| m | List + detail split view. |
| l-xl | Full list + detail layout with trend chart. |

---

## Analytics Dashboard (Part 8)

### Analytics Dashboard
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Tabs stack vertically. Charts full-width. KPI cards 1-up. |
| m | Tabs horizontal. Charts 2-up. KPI cards 2-up. |
| l-xl | Full layout with all charts and KPIs visible. |

---

## Backup Dashboard (Part 9)

### Backup Dashboard
| Breakpoint | Behavior |
|------------|----------|
| xs-s | View and monitor only. **Create/download/restore restricted** (see §9 exceptions). Message shown: "Restore operations must be performed from a desktop browser for safety." |
| m | View and monitor. Create allowed. Download/restore restricted. |
| l-xl | Full functionality. All actions available. |

---

## Super Admin Console (Part 3)

### Permission Console
| Breakpoint | Behavior |
|------------|----------|
| xs-s | Read-only view of permissions. **Assignment editing restricted** (see §9 exceptions). Message shown: "Permission assignment requires tablet or desktop for safety." |
| m | View + edit. Matrix view available. |
| l-xl | Full functionality. Matrix view optimized for wide screens. |

---

## Report Builder (Part 8)

### Report Builder
| Breakpoint | Behavior |
|------------|----------|
| xs-s | **Run and view only. Build/design restricted** (see §9 exceptions). Message shown: "Report building requires tablet or desktop." |
| m | Run, view, and build. Column configuration available. |
| l-xl | Full functionality. All features available. |

---

## The Three Documented Exceptions

Only these three functions may be restricted by device:

### 1. Backup Download and Restore Execution
- **Restriction**: Desktop only (l + xl)
- **Rationale**: Requires controlled environment, two-person approval, large file handling
- **Message**: "Restore operations must be performed from a desktop browser for safety. You can monitor backup status here."
- **Allowed on phone/tablet**: View backup history, monitor status, view backup details

### 2. Bulk Approval (>5 items)
- **Restriction**: Desktop only (l + xl)
- **Rationale**: Bulk financial approval on small screen is documented source of error
- **Message**: "Bulk approval of more than 5 items requires desktop for safety. Single approvals work on all devices."
- **Allowed on phone/tablet**: Single approval, view approval queue, view approval details

### 3. Permission Assignment Editing and Matrix View
- **Restriction**: Tablet and desktop only (m + l + xl)
- **Rationale**: Matrix is inherently wide, impact preview must be readable
- **Message**: "Permission assignment requires tablet or desktop for safety. You can view permissions on any device."
- **Allowed on phone**: View user's effective permissions, view assignment history

**No other function may be device-restricted.** If a fourth exception is needed, it must be raised and approved, not implemented.

---

## Responsive Testing Matrix

### Viewports to Test
| Width | Height | Device | Breakpoint |
|-------|--------|--------|------------|
| 320px | 568px | iPhone SE | xs |
| 375px | 812px | iPhone X/11/12 | xs |
| 390px | 844px | iPhone 12 Pro | xs |
| 414px | 896px | iPhone XR/11 | s |
| 768px | 1024px | iPad (portrait) | m |
| 1024px | 768px | iPad (landscape) | m |
| 1280px | 800px | MacBook Air | l |
| 1440px | 900px | MacBook Pro | l |
| 1920px | 1080px | Full HD desktop | l |
| 2560px | 1440px | QHD desktop | xl |

### Automated Tests
- [ ] Visual regression snapshots at 375, 768, 1440 for every route, in light and dark theme
- [ ] CI test: load every route at 320px, fail on any horizontal overflow
- [ ] Axe accessibility scan on every route (zero critical/serious violations)
- [ ] Lighthouse run against performance budgets
- [ ] Touch target audit: fail any interactive element below 44×44 on touch breakpoint

### Manual Tests (Real Hardware)
- [ ] Low-end Android phone (Moto G-class)
- [ ] iPhone (latest)
- [ ] Android tablet
- [ ] iPad
- [ ] Airplane mode test: capture 10 offline records, restore connectivity, verify all 10 sync exactly once
- [ ] Duplicate submission test: force same `local_id` twice, verify server rejects duplicate
- [ ] Outdoor legibility test: tablet in direct sunlight with high-visibility toggle
- [ ] One-thumb operability test: 5 most common site tasks
- [ ] Rotation test: rotate mid-form, confirm no data loss
- [ ] Interruption test: receive call mid-form, return, confirm draft restoration

---

## Performance Budgets by Device

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

**Tested on:** Mid-range Android device (Moto G-class) on throttled 3G in CI.

---

## Accessibility Requirements

### WCAG 2.1 AA
- [ ] Text contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text and UI components)
- [ ] Status never conveyed by colour alone (icon + text label always present)
- [ ] Full keyboard operability on desktop (arrow navigation, Enter to open, Space to select, Ctrl+A within page)
- [ ] Visible focus ring on every interactive element (using Part 1 focus token)
- [ ] All form fields have programmatically associated labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Live regions announce real-time KPI updates politely (not assertively)
- [ ] Respect `prefers-reduced-motion`: disable KPI count-up animation, slide transitions, skeleton shimmer
- [ ] Support browser text zoom to 200% without loss of content or function
- [ ] High-contrast theme from Part 1 is first-class supported theme (not fallback)

### Site-Condition Hardening (Tablet/Phone)
- [ ] "High visibility" toggle raises contrast and increases font size by one step
- [ ] All primary site actions operable with one thumb in lower half of screen
- [ ] Never require long-press as only way to reach action
- [ ] Confirmations for destructive actions require deliberate two-step (no accidental swipe deletes)

---

## Summary

**Total Screens Audited:** 15
**Fully Responsive:** 12
**Partially Responsive:** 3 (with documented exceptions)
**Device-Restricted Functions:** 3 (as per §9)

**Status:** ✅ All screens mapped and responsive behavior defined.

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-10  
**Next Review:** After Part 12 implementation
