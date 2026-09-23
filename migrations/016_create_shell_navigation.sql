-- Part 16 — Global ERP Application Shell Tables
-- 
-- Creates the infrastructure for navigation, search, and user context:
-- 1. dx_menu_item - Server-driven navigation menu registry
-- 2. dx_search_history - Recent searches per user
-- 3. dx_user_context - Saved navigation state and context preferences
--
-- All tables follow additive-only policy with dx_ prefix.

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEM (Navigation Registry)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_menu_item (
  id              BIGSERIAL PRIMARY KEY,
  item_key        VARCHAR(100) NOT NULL UNIQUE,
  parent_key      VARCHAR(100),
  label           VARCHAR(150) NOT NULL,
  icon            VARCHAR(100),
  route           VARCHAR(255),
  permission_key  VARCHAR(150),
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  module_group    VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_menu_parent ON dx_menu_item (parent_key, sort_order);
CREATE INDEX IF NOT EXISTS ix_dx_menu_active ON dx_menu_item (is_active, sort_order);

COMMENT ON TABLE dx_menu_item IS
  'Server-driven navigation menu registry - menu items are configurable, not hard-coded';

COMMENT ON COLUMN dx_menu_item.item_key IS
  'Unique identifier for the menu item (e.g., project-list, procurement-po)';

COMMENT ON COLUMN dx_menu_item.parent_key IS
  'Parent menu item key for hierarchical navigation (NULL for top-level groups)';

COMMENT ON COLUMN dx_menu_item.permission_key IS
  'Permission required to see this menu item - server filters based on user permissions';

-- ═══════════════════════════════════════════════════════════════════════════
-- SEARCH HISTORY (Recent Searches)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_search_history (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  search_term   VARCHAR(255) NOT NULL,
  result_type   VARCHAR(50),
  result_id     BIGINT,
  searched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_dx_search_hist_user ON dx_search_history (user_id, searched_at DESC);

COMMENT ON TABLE dx_search_history IS
  'Recent searches per user - pruned to keep last 100 per user';

COMMENT ON COLUMN dx_search_history.result_type IS
  'Object type of the result that was clicked (e.g., PO, GRN, PROJECT)';

COMMENT ON COLUMN dx_search_history.result_id IS
  'ID of the result that was clicked (for quick re-navigation)';

-- ═══════════════════════════════════════════════════════════════════════════
-- USER CONTEXT (Saved Navigation State)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dx_user_context (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL,
  company_id         BIGINT,
  branch_id          BIGINT,
  project_ids        TEXT,             -- JSON array of selected project ids
  site_ids           TEXT,             -- JSON array of selected site ids
  financial_year     VARCHAR(20),
  last_used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dx_user_context UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS ix_dx_user_context_user ON dx_user_context (user_id);

COMMENT ON TABLE dx_user_context IS
  'Saved navigation state per user - persists across sessions and devices';

COMMENT ON COLUMN dx_user_context.project_ids IS
  'JSON array of selected project IDs - empty array or NULL means all assigned projects';

COMMENT ON COLUMN dx_user_context.site_ids IS
  'JSON array of selected site IDs - filtered to selected projects';

COMMENT ON COLUMN dx_user_context.financial_year IS
  'Selected financial year (e.g., 2026-27) - defaults to current FY';

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Navigation Menu Structure)
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert top-level groups and menu items
-- In production, this would be managed by administrators via UI
-- For now, we seed the standard ERP navigation structure

INSERT INTO dx_menu_item (item_key, parent_key, label, icon, route, permission_key, sort_order, module_group) VALUES
-- Personal
('personal', NULL, 'Personal', 'person', NULL, NULL, 10, 'PERSONAL'),
('home', 'personal', 'Home', 'home', '/home', NULL, 1, 'PERSONAL'),
('my-workspace', 'personal', 'My Workspace', 'dashboard', '/workspace', NULL, 2, 'PERSONAL'),
('my-tasks', 'personal', 'My Tasks', 'task', '/tasks', 'workflow.task.view', 3, 'PERSONAL'),
('my-approvals', 'personal', 'My Approvals', 'approval', '/approvals', 'workflow.approval.view', 4, 'PERSONAL'),

-- Projects
('projects', NULL, 'Projects', 'domain', NULL, NULL, 20, 'PROJECTS'),
('project-list', 'projects', 'Project List', 'list', '/projects', 'project.view', 1, 'PROJECTS'),
('project-360', 'projects', 'Project 360', 'view_in_ar', '/project-360', 'project.view', 2, 'PROJECTS'),
('sites', 'projects', 'Sites', 'location_on', '/sites', 'project.site.view', 3, 'PROJECTS'),
('packages', 'projects', 'Packages', 'inventory_2', '/packages', 'project.package.view', 4, 'PROJECTS'),

-- Procurement
('procurement', NULL, 'Procurement', 'shopping_cart', NULL, NULL, 30, 'PROCUREMENT'),
('material-requisition', 'procurement', 'Material Requisition', 'request_quote', '/procurement/mr', 'procure.mr.view', 1, 'PROCUREMENT'),
('purchase-requisition', 'procurement', 'Purchase Requisition', 'description', '/procurement/pr', 'procure.pr.view', 2, 'PROCUREMENT'),
('rfq', 'procurement', 'RFQ', 'send', '/procurement/rfq', 'procure.rfq.view', 3, 'PROCUREMENT'),
('purchase-orders', 'procurement', 'Purchase Orders', 'receipt', '/procurement/po', 'procure.po.view', 4, 'PROCUREMENT'),
('vendors', 'procurement', 'Vendors', 'business', '/procurement/vendors', 'master.vendor.view', 5, 'PROCUREMENT'),

-- Materials & Store
('materials-store', NULL, 'Materials & Store', 'inventory', NULL, NULL, 40, 'MATERIALS'),
('stores', 'materials-store', 'Stores', 'store', '/store/stores', 'store.store.view', 1, 'MATERIALS'),
('stock', 'materials-store', 'Stock', 'inventory_2', '/store/stock', 'store.stock.view', 2, 'MATERIALS'),
('grn', 'materials-store', 'GRN', 'move_to_inbox', '/store/grn', 'store.grn.view', 3, 'MATERIALS'),
('issues', 'materials-store', 'Issues', 'output', '/store/issues', 'store.issue.view', 4, 'MATERIALS'),

-- Finance
('finance', NULL, 'Finance', 'account_balance', NULL, NULL, 50, 'FINANCE'),
('vouchers', 'finance', 'Vouchers', 'receipt_long', '/finance/vouchers', 'finance.voucher.view', 1, 'FINANCE'),
('payments', 'finance', 'Payments', 'payment', '/finance/payments', 'finance.payment.view', 2, 'FINANCE'),
('receipts', 'finance', 'Receipts', 'attach_money', '/finance/receipts', 'finance.receipt.view', 3, 'FINANCE'),
('budget', 'finance', 'Budget', 'savings', '/finance/budget', 'finance.budget.view', 4, 'FINANCE'),

-- HR & Manpower
('hr', NULL, 'HR & Manpower', 'people', NULL, NULL, 60, 'HR'),
('employees', 'hr', 'Employees', 'badge', '/hr/employees', 'hr.employee.view', 1, 'HR'),
('attendance', 'hr', 'Attendance', 'event_available', '/hr/attendance', 'hr.attendance.view', 2, 'HR'),
('payroll', 'hr', 'Payroll', 'payments', '/hr/payroll', 'hr.payroll.view', 3, 'HR'),

-- Quality & Safety
('quality-safety', NULL, 'Quality & Safety', 'verified', NULL, NULL, 70, 'QUALITY'),
('wir', 'quality-safety', 'WIR', 'checklist', '/quality/wir', 'qa.wir.view', 1, 'QUALITY'),
('ncr', 'quality-safety', 'NCR', 'warning', '/quality/ncr', 'qa.ncr.view', 2, 'QUALITY'),
('incidents', 'quality-safety', 'Incidents', 'error', '/safety/incidents', 'hse.incident.view', 3, 'QUALITY'),
('permits', 'quality-safety', 'Permits', 'security', '/safety/permits', 'hse.permit.view', 4, 'QUALITY'),

-- Administration
('administration', NULL, 'Administration', 'admin_panel_settings', NULL, NULL, 100, 'ADMIN'),
('users', 'administration', 'Users', 'person', '/admin/users', 'admin.user.view', 1, 'ADMIN'),
('roles', 'administration', 'Roles', 'security', '/admin/roles', 'admin.role.view', 2, 'ADMIN'),
('project-responsibilities', 'administration', 'Project Responsibilities', 'assignment_ind', '/admin/responsibilities', 'admin.responsibility.view', 3, 'ADMIN'),
('audit-log', 'administration', 'Audit Log', 'history', '/admin/audit', 'admin.audit.view', 4, 'ADMIN');
