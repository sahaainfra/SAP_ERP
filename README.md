# Construction & Infrastructure ERP — SAP Fiori Horizon Aligned Dashboard

A comprehensive, real-time dashboard for construction and infrastructure project management, built with SAP Fiori Horizon design principles.

## 🎯 Project Overview

This is a **Part 1 of 10** implementation that establishes the foundation for a complete Construction ERP system. It includes:

- ✅ Complete SAP Fiori Horizon design system (4 themes)
- ✅ Theme engine with instant switching
- ✅ Comprehensive formatting utilities (Indian currency, dates, etc.)
- ✅ State components (loading, empty, error states)
- ✅ Schema map configuration
- ✅ Design system showcase
- ✅ Full documentation (SYSTEM_MAP, DB_CHANGELOG, API_REGISTRY, ACCESSIBILITY_REPORT)

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 🎨 Design System

### Themes
The application supports 4 themes:
- **Morning Horizon** (Light) — Default
- **Evening Horizon** (Dark)
- **High Contrast Black** (Accessibility)
- **High Contrast White** (Accessibility)

### Density Modes
3 density modes available:
- **Cozy** — Touch-friendly (default)
- **Compact** — Desktop data entry
- **Condensed** — Dense tables

### Access Design System Showcase
Navigate to the "Design System" item in the side navigation to see:
- All design tokens
- State components
- Theme switcher
- Density mode switcher

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── ProjectsPage.tsx
│   ├── ApprovalCentre.tsx
│   ├── TaskCentre.tsx
│   ├── AnalyticsPage.tsx
│   ├── ExceptionCentre.tsx
│   ├── DesignSystemShowcase.tsx
│   ├── StateComponents.tsx
│   ├── ShellBar.tsx
│   ├── SideNav.tsx
│   └── KPICard.tsx
├── config/
│   └── schema-map.ts   # Database schema mapping
├── data/
│   └── mockData.ts     # Mock data for demo
├── hooks/
│   └── useThemeEngine.ts  # Theme management
├── styles/
│   ├── tokens.css      # SAP Fiori Horizon tokens (4 themes)
│   └── tokens-erp.css  # ERP semantic layer
├── utils/
│   └── formatting.ts   # Currency, date, number formatting
├── App.tsx
├── main.tsx
└── index.css           # Base styles + backward compatibility
```

## 📚 Documentation

- **SYSTEM_MAP.md** — Complete system inventory and gap analysis
- **DB_CHANGELOG.md** — Database migration log
- **API_REGISTRY.md** — API endpoint registry
- **ACCESSIBILITY_REPORT.md** — WCAG 2.2 AA compliance report
- **PART_1_COMPLETION.md** — Part 1 completion summary

## 🎯 Key Features

### Dashboard
- Executive overview with KPI cards
- Planned vs Actual progress charts
- Budget breakdown visualization
- Earned Value Management (EVM) analysis
- Project status overview
- Recent activity feed
- Active alerts
- Pending approvals
- Resource utilization

### Projects
- Table and grid views
- Search and filter
- Project details with progress tracking
- Risk assessment
- Safety scores

### Approval Centre
- Pending approvals list
- Approval/rejection workflow
- Priority indicators
- Amount tracking

### Task Centre
- Task list with status tracking
- Priority management
- Assignee tracking
- Due date management

### Analytics & EVM
- Earned Value Management charts
- Performance radar
- Completion forecasting
- Project-wise comparison

### Exception Centre
- Critical alerts
- Safety incidents
- Budget overruns
- Schedule delays
- Quality issues

## 🔧 Technical Stack

- **Framework:** React 18.2.0
- **Build Tool:** Vite 6.4.3
- **Styling:** Tailwind CSS 4.1.7 + CSS Custom Properties
- **Charts:** Recharts 2.10.0
- **Animations:** Framer Motion 11.16.1
- **Icons:** Lucide React 0.294.0
- **Routing:** React Router DOM 6.8.0

## ♿ Accessibility

- ✅ WCAG 2.2 AA compliant
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast themes
- ✅ Focus indicators
- ✅ Color independence
- ✅ Reduced motion support

## 🌍 Internationalization

- Indian currency formatting (₹1,23,45,678.90)
- Compact display (₹1.23 Cr, ₹12.35 L)
- Date format: DD-MMM-YYYY
- Timezone support
- Locale-aware number formatting

## 📊 Design Tokens

200+ design tokens organized into:
- Brand & Base Colors
- Semantic Colors
- Typography
- Spacing (4px scale)
- Elevation (shadows)
- Shell & Navigation
- Tiles & Cards
- Lists & Tables
- Buttons & Fields
- Progress Indicators
- Accent Colors
- Indication Colors
- Chart Colors

## 🔄 Theme Switching

Theme switching is instant with no page reload:
1. Click the moon/sun icon in the shell bar
2. Or use the Design System showcase
3. Preference is saved and persists across sessions

## 📱 Responsive Design

- **Mobile** (< 600px) — 1 column, collapsed navigation
- **Tablet** (600-1023px) — 2 columns, icon rail navigation
- **Desktop** (1024-1439px) — 3 columns, expanded navigation
- **Wide** (1440-1919px) — 4 columns
- **Ultra-wide** (≥ 1920px) — 4 columns, max-width centered

## 🚧 Current Status

**Part 1:** ✅ COMPLETE — Foundation & Design System  
**Part 2:** 🔜 NEXT — Global Shell and Navigation  
**Parts 3-10:** 📋 PLANNED

## 📝 Development Notes

### Adding New Components
1. Use design tokens only (no hard-coded colors)
2. Follow SAP Fiori Horizon patterns
3. Use state components for loading/empty/error states
4. Format all values using the formatting utilities
5. Ensure keyboard accessibility

### Adding New Themes
1. Add theme to `tokens.css`
2. Update `useThemeEngine.ts`
3. Add to `THEMES` constant
4. Test all components

### Adding New Tokens
1. Add to appropriate section in `tokens.css`
2. Add to all 4 themes
3. Add semantic alias in `tokens-erp.css` if needed
4. Update design system showcase

## 🔐 Security Notes

- No hard-coded credentials
- All API calls require authentication (planned)
- Permission filtering on all endpoints (planned)
- Audit logging for all actions (planned)

## 📈 Performance

- Build size: 75KB CSS + 722KB JS (gzipped: 13KB + 190KB)
- Build time: ~10 seconds
- No runtime errors
- Optimized for production

## 🐛 Known Issues

- Chunk size warning (can be addressed with code splitting in Part 2)
- No backend implementation (frontend-only demo)
- Mock data (no real database connection)

## 📞 Support

For questions or issues:
1. Check the documentation files
2. Review the Design System showcase
3. Consult the ACCESSIBILITY_REPORT.md
4. Review SYSTEM_MAP.md for business object mappings

## 📄 License

This is a demonstration project for educational purposes.

## 🎉 Next Steps

**Part 2 — Global Shell and Navigation** will add:
- Enhanced shell bar with global search
- Improved side navigation with responsive behavior
- Context switcher (company, branch, project, site)
- Page templates (list, detail, form, dashboard)
- Responsive layout system
- Breadcrumb navigation
- Skip links for accessibility

---

**Built with:** React, TypeScript, Tailwind CSS, SAP Fiori Horizon Design Principles  
**Part:** 1 of 10  
**Status:** ✅ COMPLETE
