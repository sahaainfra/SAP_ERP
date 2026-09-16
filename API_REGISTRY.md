# API_REGISTRY.md — API Endpoint Registry

**Last Updated:** 2026-02-10  
**Part:** 1 — Foundation  
**Status:** Initialized

---

## API Conventions

- **Base Path:** `/api/dx/v1/`
- **Authentication:** JWT Bearer token (Authorization header)
- **Response Format:** Standard envelope
- **Permission:** Server-side filtering on every endpoint
- **Idempotency:** GET endpoints return ETag, honour If-None-Match

### Standard Response Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 0,
    "generatedAt": "2026-01-01T00:00:00Z",
    "scope": {
      "companyId": 1,
      "projectIds": [4, 7],
      "siteIds": []
    },
    "fromCache": false,
    "cacheAgeSeconds": 0
  },
  "errors": []
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "meta": {},
  "errors": [
    {
      "code": "PERMISSION_DENIED",
      "message": "You do not have access to this resource",
      "field": null,
      "severity": "error"
    }
  ]
}
```

---

## Endpoints

### Preferences

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/preferences` | ✅ | `preferences.read` | Get all preferences for current user |
| PUT | `/api/dx/v1/preferences/{key}` | ✅ | `preferences.write` | Upsert one preference |
| DELETE | `/api/dx/v1/preferences/{key}` | ✅ | `preferences.write` | Reset preference to default |

#### GET /api/dx/v1/preferences

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "morning-horizon",
    "density": "cozy",
    "locale": "en-IN",
    "timezone": "Asia/Kolkata",
    "numberFormat": "en-IN",
    "dateFormat": "DD-MMM-YYYY",
    "landingPage": "/dashboard"
  },
  "meta": {
    "generatedAt": "2026-02-10T10:00:00Z"
  },
  "errors": []
}
```

#### PUT /api/dx/v1/preferences/{key}

**Request Body:**
```json
{
  "value": "evening-horizon"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "theme",
    "value": "evening-horizon",
    "updatedAt": "2026-02-10T10:05:00Z"
  },
  "meta": {},
  "errors": []
}
```

#### DELETE /api/dx/v1/preferences/{key}

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "theme",
    "value": "morning-horizon",
    "message": "Reset to default"
  },
  "meta": {},
  "errors": []
}
```

### Navigation

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/navigation` | ✅ | authenticated | Server-driven menu filtered by user permissions |

### Context

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/context/available` | ✅ | authenticated | Available companies/projects/sites/FYs |
| PUT | `/api/dx/v1/context` | ✅ | authenticated | Persist and validate context selection |

### Global Search

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/search` | ✅ | authenticated | Permission-filtered global search |
| GET | `/api/dx/v1/search/recent` | ✅ | authenticated | Recent searches for current user |

### Shell Counts

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/shell/counts` | ✅ | authenticated | Badge counts (notifications, approvals, tasks, messages) |
| GET | `/api/dx/v1/shell/notifications` | ✅ | authenticated | Latest 10 notifications for popover |
| GET | `/api/dx/v1/shell/approvals` | ✅ | authenticated | Latest 10 pending approvals |
| GET | `/api/dx/v1/shell/tasks` | ✅ | authenticated | Latest 10 open tasks |

### Profile

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/profile` | ✅ | authenticated | User profile panel payload |

### Real-time Engine (Part 4)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| WS | `/api/dx/v1/ws` | ✅ | authenticated | WebSocket gateway for real-time updates |
| GET | `/api/dx/v1/realtime/token` | ✅ | authenticated | Short-lived WebSocket connection token |
| GET | `/api/dx/v1/kpi/{kpiKey}` | ✅ | KPI-specific | Single KPI value for active scope |
| POST | `/api/dx/v1/kpi/batch` | ✅ | multiple | Batch fetch multiple KPIs in one request |
| GET | `/api/dx/v1/kpi/{kpiKey}/history` | ✅ | KPI-specific | KPI historical trend data |
| GET | `/api/dx/v1/kpi/{kpiKey}/drill` | ✅ | KPI-specific | Drill-down to underlying records |
| GET | `/api/dx/v1/alerts` | ✅ | authenticated | Active alerts for user's scope |
| POST | `/api/dx/v1/alerts/{id}/acknowledge` | ✅ | authenticated | Acknowledge an alert |
| POST | `/api/dx/v1/alerts/{id}/resolve` | ✅ | authenticated | Resolve an alert with note |
| GET | `/api/dx/v1/sla/summary` | ✅ | authenticated | SLA compliance summary |
| GET | `/api/dx/v1/system/health` | ✅ | admin | System health and queue status |

### Component Library (Part 5)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/dashboards` | ✅ | authenticated | List user's dashboards |
| POST | `/api/dx/v1/dashboards` | ✅ | dashboard.create | Create new dashboard |
| GET | `/api/dx/v1/dashboards/{id}` | ✅ | dashboard.view | Get dashboard with widgets |
| PUT | `/api/dx/v1/dashboards/{id}` | ✅ | dashboard.edit | Update dashboard layout |
| DELETE | `/api/dx/v1/dashboards/{id}` | ✅ | dashboard.delete | Delete dashboard |
| POST | `/api/dx/v1/dashboards/{id}/widgets` | ✅ | dashboard.edit | Add widget to dashboard |
| PUT | `/api/dx/v1/dashboards/{id}/widgets/{widgetId}` | ✅ | dashboard.edit | Update widget configuration |
| DELETE | `/api/dx/v1/dashboards/{id}/widgets/{widgetId}` | ✅ | dashboard.edit | Remove widget from dashboard |
| GET | `/api/dx/v1/widgets/catalogue` | ✅ | authenticated | Available widget types |
| GET | `/api/dx/v1/views` | ✅ | authenticated | List saved table views |
| POST | `/api/dx/v1/views` | ✅ | view.create | Create saved view |
| PUT | `/api/dx/v1/views/{id}` | ✅ | view.edit | Update saved view |
| DELETE | `/api/dx/v1/views/{id}` | ✅ | view.delete | Delete saved view |
| POST | `/api/dx/v1/views/{id}/share` | ✅ | view.share | Share view with team |

### Role Dashboards & Object Pages (Part 6)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/dashboard/resolve` | ✅ | authenticated | Resolve dashboard layout for active context |
| POST | `/api/dx/v1/dashboard/data` | ✅ | authenticated | Batch fetch data for all dashboard widgets |
| GET | `/api/dx/v1/dashboard/role/{role}` | ✅ | role-specific | Get default dashboard for a role |
| POST | `/api/dx/v1/dashboard/role/{role}/default` | ✅ | admin | Set default dashboard for a role |
| GET | `/api/dx/v1/projects/{id}/360` | ✅ | project.view | Full Project 360 payload |
| GET | `/api/dx/v1/projects/{id}/health` | ✅ | project.view | Health score with component breakdown |
| GET | `/api/dx/v1/projects/{id}/health/history` | ✅ | project.view | Health score trend history |
| POST | `/api/dx/v1/projects/{id}/health/recalculate` | ✅ | project.edit | Recalculate health score |
| GET | `/api/dx/v1/objects/{type}/{id}` | ✅ | type-specific | Object page payload |
| GET | `/api/dx/v1/objects/{type}/{id}/chain` | ✅ | type-specific | Document chain graph |
| GET | `/api/dx/v1/objects/{type}/{id}/audit` | ✅ | type-specific | Audit trail |
| POST | `/api/dx/v1/objects/{type}/{id}/action` | ✅ | type-specific | Execute state-changing action |
| GET | `/api/dx/v1/drill/{kpiKey}` | ✅ | kpi-specific | Drill-down records for a KPI |
| GET | `/api/dx/v1/health/config` | ✅ | admin | Health score configuration |
| PUT | `/api/dx/v1/health/config` | ✅ | admin | Update health score weights |

### Approval Centre, Task Centre & Notifications (Part 7)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/approvals` | ✅ | authenticated | Approval queue for current user |
| GET | `/api/dx/v1/approvals/{entity}/{id}` | ✅ | authenticated | Full approval detail with risk flags |
| POST | `/api/dx/v1/approvals/{entity}/{id}/decide` | ✅ | authenticated | Make approval decision |
| POST | `/api/dx/v1/approvals/bulk-decide` | ✅ | authenticated | Bulk approve with safeguards |
| GET | `/api/dx/v1/approvals/history` | ✅ | authenticated | User's decision history |
| GET | `/api/dx/v1/approvals/bottlenecks` | ✅ | admin | Approval bottleneck analysis |
| POST | `/api/dx/v1/out-of-office` | ✅ | authenticated | Set out-of-office with substitute |
| GET | `/api/dx/v1/tasks` | ✅ | authenticated | Task list with filters |
| POST | `/api/dx/v1/tasks` | ✅ | authenticated | Create new task |
| PUT | `/api/dx/v1/tasks/{id}` | ✅ | authenticated | Update task |
| POST | `/api/dx/v1/tasks/{id}/complete` | ✅ | authenticated | Complete task with note |
| POST | `/api/dx/v1/tasks/{id}/reassign` | ✅ | authenticated | Reassign task |
| GET | `/api/dx/v1/exceptions` | ✅ | authenticated | Exception list for permitted scope |
| POST | `/api/dx/v1/exceptions/{id}/assign` | ✅ | authenticated | Assign exception owner |
| POST | `/api/dx/v1/exceptions/{id}/resolve` | ✅ | authenticated | Resolve exception |
| POST | `/api/dx/v1/exceptions/{id}/accept` | ✅ | authenticated | Accept as known exception |
| GET | `/api/dx/v1/notifications` | ✅ | authenticated | Paginated notifications |
| POST | `/api/dx/v1/notifications/read` | ✅ | authenticated | Mark notifications as read |
| GET | `/api/dx/v1/notifications/preferences` | ✅ | authenticated | Get notification preferences |
| PUT | `/api/dx/v1/notifications/preferences` | ✅ | authenticated | Update notification preferences |

### Analytics, EVM, Forecasting & AI Copilot (Part 8)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/evm/{projectId}` | ✅ | project.view | EVM metrics with WBS breakdown |
| GET | `/api/dx/v1/evm/{projectId}/timeseries` | ✅ | project.view | EVM time series for S-curve |
| POST | `/api/dx/v1/evm/{projectId}/baseline` | ✅ | project.edit | Set EVM baseline |
| GET | `/api/dx/v1/forecast/{type}/{scopeId}` | ✅ | authenticated | Forecast with method and confidence |
| GET | `/api/dx/v1/forecast/accuracy` | ✅ | admin | Forecast backtesting results |
| GET | `/api/dx/v1/insights` | ✅ | authenticated | Cross-module insight cards |
| GET | `/api/dx/v1/anomalies` | ✅ | authenticated | Detected anomalies |
| POST | `/api/dx/v1/anomalies/{id}/dismiss` | ✅ | authenticated | Dismiss anomaly with reason |
| POST | `/api/dx/v1/copilot/query` | ✅ | authenticated | AI copilot question |
| GET | `/api/dx/v1/copilot/history` | ✅ | authenticated | Copilot conversation history |
| POST | `/api/dx/v1/ocr/extract` | ✅ | authenticated | Extract data from document |
| GET | `/api/dx/v1/reports` | ✅ | authenticated | List available reports |
| POST | `/api/dx/v1/reports` | ✅ | report.create | Create report definition |
| PUT | `/api/dx/v1/reports/{id}` | ✅ | report.edit | Update report definition |
| DELETE | `/api/dx/v1/reports/{id}` | ✅ | report.delete | Delete report |
| POST | `/api/dx/v1/reports/{id}/run` | ✅ | report.run | Run report with parameters |
| POST | `/api/dx/v1/reports/{id}/schedule` | ✅ | report.schedule | Schedule report delivery |
| POST | `/api/dx/v1/print/{entity}/{id}` | ✅ | authenticated | Generate PDF from template |
| GET | `/api/dx/v1/print/templates` | ✅ | authenticated | List print templates |
| POST | `/api/dx/v1/print/templates` | ✅ | print.configure | Create print template |
| POST | `/api/dx/v1/export` | ✅ | authenticated | Export data to file |
| GET | `/api/dx/v1/export/jobs` | ✅ | authenticated | List export jobs |

---

## Planned Endpoints (Future Parts)

### Part 2 — Global Shell
- `GET /api/dx/v1/navigation` — Navigation structure
- `GET /api/dx/v1/search` — Global search

### Part 3 — Permissions
- `GET /api/dx/v1/permissions` — User permissions
- `GET /api/dx/v1/roles` — Role definitions
- `PUT /api/dx/v1/delegations` — Delegation rules

### Part 4 — Real-time Engine
- `WS /api/dx/v1/ws` — WebSocket gateway
- `GET /api/dx/v1/kpis/{code}` — KPI values
- `GET /api/dx/v1/alerts` — Active alerts

### Part 9 — Backup & Restore
- `POST /api/dx/v1/backup` — Create backup
- `GET /api/dx/v1/backup/history` — Backup history
- `POST /api/dx/v1/restore` — Restore from backup

---

## Permission Keys

| Permission Key | Description | Module |
|---|---|---|
| `preferences.read` | Read user preferences | System |
| `preferences.write` | Write user preferences | System |
| `dashboard.view` | View dashboards | Dashboard |
| `projects.view` | View projects | Projects |
| `projects.create` | Create projects | Projects |
| `projects.edit` | Edit projects | Projects |
| `approvals.view` | View approvals | Approvals |
| `approvals.approve` | Approve requests | Approvals |
| `approvals.reject` | Reject requests | Approvals |
| `tasks.view` | View tasks | Tasks |
| `tasks.create` | Create tasks | Tasks |
| `tasks.edit` | Edit tasks | Tasks |
| `analytics.view` | View analytics | Analytics |
| `reports.view` | View reports | Reports |
| `reports.export` | Export reports | Reports |
| `admin.users` | Manage users | Admin |
| `admin.roles` | Manage roles | Admin |
| `admin.permissions` | Manage permissions | Admin |
| `admin.backup` | Backup & restore | Admin |

---

**Document Status:** ✅ Complete (Part 8 Updated)  
**Next Step:** Part 9 — Data Backup & Restore Tool

---

### Data Backup & Restore (Part 9)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/backups` | ✅ | admin.backup.view | List all backups with pagination |
| GET | `/api/dx/v1/backups/{id}` | ✅ | admin.backup.view | Get backup details and manifest |
| POST | `/api/dx/v1/backups` | ✅ | admin.backup.create | Create new backup |
| POST | `/api/dx/v1/backups/{id}/cancel` | ✅ | admin.backup.create | Cancel running backup |
| POST | `/api/dx/v1/backups/{id}/validate` | ✅ | admin.backup.create | Re-validate backup |
| POST | `/api/dx/v1/backups/{id}/lock` | ✅ | admin.backup.delete | Lock backup (legal hold) |
| POST | `/api/dx/v1/backups/{id}/unlock` | ✅ | admin.backup.delete | Unlock backup |
| DELETE | `/api/dx/v1/backups/{id}` | ✅ | admin.backup.delete | Delete backup (with reason) |
| POST | `/api/dx/v1/backups/{id}/download-request` | ✅ | admin.backup.download | Request download with reason |
| POST | `/api/dx/v1/download-requests/{id}/approve` | ✅ | admin.backup.download | Approve download request |
| POST | `/api/dx/v1/download-requests/{id}/deny` | ✅ | admin.backup.download | Deny download request |
| GET | `/api/dx/v1/backups/download/{token}` | ✅ | token-based | Download backup (single-use) |
| GET | `/api/dx/v1/backup-schedules` | ✅ | admin.backup.view | List backup schedules |
| POST | `/api/dx/v1/backup-schedules` | ✅ | admin.backup.create | Create backup schedule |
| PUT | `/api/dx/v1/backup-schedules/{id}` | ✅ | admin.backup.create | Update schedule |
| DELETE | `/api/dx/v1/backup-schedules/{id}` | ✅ | admin.backup.create | Delete schedule |
| POST | `/api/dx/v1/backup-schedules/{id}/toggle` | ✅ | admin.backup.create | Enable/disable schedule |
| GET | `/api/dx/v1/restores` | ✅ | admin.backup.view | List restore operations |
| POST | `/api/dx/v1/restores` | ✅ | admin.backup.restore | Request restore |
| POST | `/api/dx/v1/restores/{id}/approve` | ✅ | admin.backup.restore | Approve restore (2nd admin) |
| POST | `/api/dx/v1/restores/{id}/reject` | ✅ | admin.backup.restore | Reject restore |
| POST | `/api/dx/v1/restores/{id}/execute` | ✅ | admin.backup.restore | Execute approved restore |
| POST | `/api/dx/v1/restores/{id}/rollback` | ✅ | admin.backup.restore | Rollback restore |
| GET | `/api/dx/v1/restores/{id}/progress` | ✅ | admin.backup.view | Get restore progress |
| GET | `/api/dx/v1/backup-audit` | ✅ | admin.audit.view | Get backup audit trail |
| GET | `/api/dx/v1/storage-targets` | ✅ | admin.backup.view | List storage targets |
| POST | `/api/dx/v1/storage-targets` | ✅ | admin.backup.create | Create storage target |
| PUT | `/api/dx/v1/storage-targets/{id}` | ✅ | admin.backup.create | Update storage target |
| DELETE | `/api/dx/v1/storage-targets/{id}` | ✅ | admin.backup.create | Delete storage target |
| POST | `/api/dx/v1/storage-targets/{id}/test` | ✅ | admin.backup.create | Test storage connection |

---

**Document Status:** ✅ Complete (Part 11 Updated)  
**Next Step:** Part 12 — Master Data & Enterprise Structure

---

### Responsive & Multi-Device (Part 11)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| POST | `/api/dx/v1/sync` | ✅ | authenticated | Sync offline queue with server (idempotent via local_id) |
| GET | `/api/dx/v1/sync/status` | ✅ | authenticated | Get sync status and pending items |
| POST | `/api/dx/v1/sync/retry` | ✅ | authenticated | Retry failed sync items |
| DELETE | `/api/dx/v1/sync/{localId}` | ✅ | authenticated | Discard sync item |

---

**Total API Endpoints:** 134+ (130 from Parts 1-10 + 4 from Part 11)

---

## Part 10 — No New Endpoints

Part 10 focuses on security hardening, performance optimization, testing, and deployment. No new API endpoints are required as this part works with the existing 130+ endpoints from Parts 1-9.

**Focus Areas:**
- Security hardening of existing endpoints
- Performance optimization
- Comprehensive testing (permission matrix, security, performance)
- Deployment automation
- Monitoring and alerting

**Total API Endpoints:** 130+ (unchanged from Part 9)
