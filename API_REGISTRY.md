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

**Document Status:** ✅ Complete (Part 14 Updated)  
**Next Step:** Part 15 — Inventory, Stores & Material Management

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

### Master Data & Enterprise Structure (Part 12)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/org/tree` | ✅ | master.org.view | Get organization hierarchy |
| GET | `/api/dx/v1/org/node/{id}` | ✅ | master.org.view | Get node details |
| GET | `/api/dx/v1/org/subtree/{id}` | ✅ | master.org.view | Get subtree |
| GET | `/api/dx/v1/projects/{id}/profile` | ✅ | master.project.view | Get project profile |
| PUT | `/api/dx/v1/projects/{id}/profile` | ✅ | master.project.update | Update project profile |
| GET | `/api/dx/v1/projects/{id}/config` | ✅ | master.project.view | Get project config |
| PUT | `/api/dx/v1/projects/{id}/config` | ✅ | master.project.config | Update project config |
| GET | `/api/dx/v1/projects/{id}/boq/versions` | ✅ | master.boq.view | List BOQ versions |
| POST | `/api/dx/v1/projects/{id}/boq/versions` | ✅ | master.boq.create | Create BOQ version |
| POST | `/api/dx/v1/boq/import` | ✅ | master.boq.import | Import BOQ from Excel/CSV |
| GET | `/api/dx/v1/boq/versions/{id}/items` | ✅ | master.boq.view | Get BOQ items |
| GET | `/api/dx/v1/rates` | ✅ | master.rate.view | List rates |
| POST | `/api/dx/v1/rates` | ✅ | master.rate.create | Create rate |
| POST | `/api/dx/v1/rates/resolve` | ✅ | authenticated | Resolve rate for transaction |
| GET | `/api/dx/v1/rates/history/{referenceId}` | ✅ | master.rate.view | Rate history |
| GET | `/api/dx/v1/master/governance` | ✅ | master.governance.view | List governance configs |
| PUT | `/api/dx/v1/master/governance/{masterType}` | ✅ | master.governance.configure | Update governance |
| GET | `/api/dx/v1/master/change-requests` | ✅ | master.changerequest.view | List change requests |
| POST | `/api/dx/v1/master/change-requests` | ✅ | master.changerequest.create | Create change request |
| POST | `/api/dx/v1/master/change-requests/{id}/approve` | ✅ | master.changerequest.approve | Approve request |
| POST | `/api/dx/v1/master/change-requests/{id}/reject` | ✅ | master.changerequest.approve | Reject request |
| GET | `/api/dx/v1/master/quality` | ✅ | master.quality.view | Get quality metrics |
| GET | `/api/dx/v1/master/duplicates` | ✅ | master.quality.view | List duplicate candidates |
| POST | `/api/dx/v1/master/duplicates/{id}/merge` | ✅ | master.merge.execute | Merge duplicates |
| POST | `/api/dx/v1/master/duplicates/{id}/dismiss` | ✅ | master.quality.view | Dismiss duplicate |

---

**Total API Endpoints:** 159 (134 from Parts 1-11 + 25 from Part 12)

---

### Planning & Scheduling (Part 13)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/wbs/tree/{projectId}` | ✅ | plan.wbs.view | Get WBS tree structure |
| POST | `/api/dx/v1/wbs` | ✅ | plan.wbs.create | Create WBS node |
| PUT | `/api/dx/v1/wbs/{id}` | ✅ | plan.wbs.update | Update WBS node |
| DELETE | `/api/dx/v1/wbs/{id}` | ✅ | plan.wbs.delete | Delete WBS node |
| POST | `/api/dx/v1/wbs/validate-weightage` | ✅ | plan.wbs.update | Validate weightage totals |
| POST | `/api/dx/v1/wbs/boq-map` | ✅ | plan.wbs.update | Map BOQ items to WBS |
| GET | `/api/dx/v1/schedule/activities/{projectId}` | ✅ | plan.schedule.view | List schedule activities |
| POST | `/api/dx/v1/schedule/activities` | ✅ | plan.schedule.create | Create activity |
| PUT | `/api/dx/v1/schedule/activities/{id}` | ✅ | plan.schedule.update | Update activity |
| POST | `/api/dx/v1/schedule/relations` | ✅ | plan.schedule.update | Create activity relation |
| POST | `/api/dx/v1/schedule/calculate-cpm` | ✅ | plan.schedule.update | Calculate CPM |
| POST | `/api/dx/v1/schedule/import` | ✅ | plan.schedule.import | Import schedule (MS Project/Primavera/Excel) |
| GET | `/api/dx/v1/baselines/{projectId}` | ✅ | plan.baseline.view | List baselines |
| POST | `/api/dx/v1/baselines` | ✅ | plan.baseline.create | Create baseline |
| POST | `/api/dx/v1/baselines/{id}/approve` | ✅ | plan.baseline.approve | Approve baseline |
| POST | `/api/dx/v1/baselines/{id}/set-current` | ✅ | plan.baseline.set_current | Set as current baseline |
| GET | `/api/dx/v1/progress/entries/{projectId}` | ✅ | plan.progress.view | List progress entries |
| POST | `/api/dx/v1/progress/entries` | ✅ | plan.progress.enter | Enter progress |
| POST | `/api/dx/v1/progress/entries/{id}/approve` | ✅ | plan.progress.approve | Approve progress entry |
| POST | `/api/dx/v1/progress/rollup` | ✅ | plan.progress.view | Calculate progress rollup |
| GET | `/api/dx/v1/progress/snapshots/{projectId}` | ✅ | plan.progress.view | Get progress snapshots |
| GET | `/api/dx/v1/lookaheads/{projectId}` | ✅ | plan.lookahead.view | List look-ahead plans |
| POST | `/api/dx/v1/lookaheads` | ✅ | plan.lookahead.create | Create look-ahead |
| PUT | `/api/dx/v1/lookaheads/{id}` | ✅ | plan.lookahead.update | Update look-ahead |
| POST | `/api/dx/v1/lookaheads/{id}/close` | ✅ | plan.lookahead.close | Close look-ahead period |
| POST | `/api/dx/v1/lookaheads/{id}/calculate-ppc` | ✅ | plan.lookahead.close | Calculate PPC |
| GET | `/api/dx/v1/constraints/{projectId}` | ✅ | plan.constraint.view | List constraints |
| POST | `/api/dx/v1/constraints` | ✅ | plan.constraint.raise | Raise constraint |
| PUT | `/api/dx/v1/constraints/{id}` | ✅ | plan.constraint.update | Update constraint |
| POST | `/api/dx/v1/constraints/{id}/resolve` | ✅ | plan.constraint.resolve | Resolve constraint |
| POST | `/api/dx/v1/constraints/{id}/escalate` | ✅ | plan.constraint.escalate | Escalate constraint |
| GET | `/api/dx/v1/resources/plans/{projectId}` | ✅ | plan.resource.view | List resource plans |
| POST | `/api/dx/v1/resources/plans` | ✅ | plan.resource.plan | Create resource plan |
| GET | `/api/dx/v1/resources/norms` | ✅ | plan.norm.view | List resource norms |
| POST | `/api/dx/v1/resources/norms` | ✅ | plan.norm.create | Create resource norm |
| PUT | `/api/dx/v1/resources/norms/{id}` | ✅ | plan.norm.update | Update resource norm |
| POST | `/api/dx/v1/resources/generate-requirements` | ✅ | plan.resource.plan | Generate material requirements from norms |
| GET | `/api/dx/v1/dpr/{projectId}/{date}` | ✅ | plan.progress.view | Get daily progress report |
| POST | `/api/dx/v1/dpr` | ✅ | plan.progress.enter | Create/update DPR |
| POST | `/api/dx/v1/dpr/{id}/submit` | ✅ | plan.progress.enter | Submit DPR |

---

### Procurement (Part 14)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/indents` | ✅ | procure.indent.view | List indents with filters |
| POST | `/api/dx/v1/indents` | ✅ | procure.indent.create | Create indent |
| PUT | `/api/dx/v1/indents/{id}` | ✅ | procure.indent.update | Update indent |
| POST | `/api/dx/v1/indents/{id}/validate` | ✅ | procure.indent.create | Validate indent (5 checks) |
| POST | `/api/dx/v1/indents/{id}/submit` | ✅ | procure.indent.submit | Submit for approval |
| POST | `/api/dx/v1/indents/{id}/approve` | ✅ | procure.indent.approve | Approve indent |
| POST | `/api/dx/v1/indents/{id}/reject` | ✅ | procure.indent.approve | Reject indent |
| POST | `/api/dx/v1/indents/consolidate` | ✅ | procure.indent.create | Consolidate multiple indents |
| GET | `/api/dx/v1/rfqs` | ✅ | procure.rfq.view | List RFQs |
| POST | `/api/dx/v1/rfqs` | ✅ | procure.rfq.create | Create RFQ |
| PUT | `/api/dx/v1/rfqs/{id}` | ✅ | procure.rfq.create | Update RFQ |
| POST | `/api/dx/v1/rfqs/{id}/issue` | ✅ | procure.rfq.issue | Issue RFQ to vendors |
| POST | `/api/dx/v1/rfqs/{id}/invite-vendors` | ✅ | procure.vendor.invite | Invite vendors |
| POST | `/api/dx/v1/rfqs/{id}/close` | ✅ | procure.rfq.create | Close RFQ |
| POST | `/api/dx/v1/rfqs/{id}/open-sealed` | ✅ | procure.rfq.open_sealed | Open sealed RFQ (2 users) |
| GET | `/api/dx/v1/rfqs/{id}/quotations` | ✅ | procure.quotation.view | Get quotations for RFQ |
| POST | `/api/dx/v1/rfqs/vendor-portal/{token}` | ✅ | token-based | Vendor portal access |
| POST | `/api/dx/v1/rfqs/{id}/remind-vendors` | ✅ | procure.rfq.create | Send reminders |
| POST | `/api/dx/v1/quotations` | ✅ | procure.quotation.enter | Submit quotation |
| PUT | `/api/dx/v1/quotations/{id}` | ✅ | procure.quotation.update | Update quotation |
| POST | `/api/dx/v1/quotations/{id}/compute-landed-rate` | ✅ | procure.quotation.enter | Compute landed rate |
| POST | `/api/dx/v1/quotations/{id}/technical-evaluation` | ✅ | procure.quotation.enter | Technical evaluation |
| POST | `/api/dx/v1/quotations/ocr-extract` | ✅ | procure.quotation.enter | OCR extraction |
| POST | `/api/dx/v1/comparatives/generate` | ✅ | procure.comparative.prepare | Generate comparative |
| GET | `/api/dx/v1/comparatives/{id}` | ✅ | procure.comparative.view | Get comparative details |
| PUT | `/api/dx/v1/comparatives/{id}` | ✅ | procure.comparative.prepare | Update comparative |
| POST | `/api/dx/v1/comparatives/{id}/recommend` | ✅ | procure.comparative.prepare | Set recommendations |
| POST | `/api/dx/v1/comparatives/{id}/negotiate` | ✅ | procure.comparative.negotiate | Record negotiation round |
| POST | `/api/dx/v1/comparatives/{id}/approve` | ✅ | procure.comparative.approve | Approve comparative |
| GET | `/api/dx/v1/comparatives/{id}/print` | ✅ | procure.report.export | Print comparative |
| POST | `/api/dx/v1/po/create-from-comparative` | ✅ | procure.po.create | Create PO from CS |
| POST | `/api/dx/v1/po/create-from-rate-contract` | ✅ | procure.po.create | Create PO from RC |
| PUT | `/api/dx/v1/po/{id}` | ✅ | procure.po.update | Update PO |
| POST | `/api/dx/v1/po/{id}/validate-release` | ✅ | procure.po.release | Validate release gates (7) |
| POST | `/api/dx/v1/po/{id}/release` | ✅ | procure.po.release | Release PO to vendor |
| POST | `/api/dx/v1/po/{id}/amend` | ✅ | procure.po.amend | Create amendment |
| POST | `/api/dx/v1/po/{id}/short-close` | ✅ | procure.po.short_close | Short close PO |
| POST | `/api/dx/v1/po/{id}/cancel` | ✅ | procure.po.cancel | Cancel PO |
| GET | `/api/dx/v1/po/{id}/delivery-schedule` | ✅ | procure.po.view | Get delivery schedule |
| PUT | `/api/dx/v1/po/delivery-schedule/{id}` | ✅ | procure.po.update | Update delivery schedule |
| GET | `/api/dx/v1/rate-contracts` | ✅ | procure.ratecontract.view | List rate contracts |
| POST | `/api/dx/v1/rate-contracts` | ✅ | procure.ratecontract.create | Create rate contract |
| PUT | `/api/dx/v1/rate-contracts/{id}` | ✅ | procure.ratecontract.create | Update rate contract |
| POST | `/api/dx/v1/rate-contracts/{id}/release` | ✅ | procure.ratecontract.release | Create release against RC |
| GET | `/api/dx/v1/rate-contracts/{id}/consumption` | ✅ | procure.ratecontract.view | Get consumption details |

---

**Total API Endpoints:** 244 (199 from Parts 1-13 + 45 from Part 14)

---

### Inventory & Material Management (Part 15)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/stock/ledger` | ✅ | store.stock.view | List ledger entries with filters |
| GET | `/api/dx/v1/stock/position` | ✅ | store.stock.view | Get current stock position |
| POST | `/api/dx/v1/stock/movement` | ✅ | store.stock.adjust | Post stock movement (only way to move stock) |
| GET | `/api/dx/v1/stock/ledger/{itemId}` | ✅ | store.stock.view | Item-wise ledger (audit view) |
| GET | `/api/dx/v1/stock/reconciliation` | ✅ | store.stock.view | Reconcile ledger vs balance field |
| POST | `/api/dx/v1/stock/baseline` | ✅ | store.stock.adjust | Capture stock baseline |
| GET | `/api/dx/v1/grn` | ✅ | store.grn.view | List GRNs |
| POST | `/api/dx/v1/grn` | ✅ | store.grn.create | Create GRN |
| PUT | `/api/dx/v1/grn/{id}` | ✅ | store.grn.update | Update GRN |
| POST | `/api/dx/v1/grn/{id}/three-way-match` | ✅ | store.grn.create | Perform three-way match |
| POST | `/api/dx/v1/grn/{id}/approve` | ✅ | store.grn.approve | Approve GRN |
| POST | `/api/dx/v1/grn/{id}/reverse` | ✅ | store.grn.reverse | Reverse GRN |
| POST | `/api/dx/v1/grn/{id}/qc-pass` | ✅ | store.grn.approve | QC pass (release from hold) |
| POST | `/api/dx/v1/grn/{id}/qc-fail` | ✅ | store.grn.approve | QC fail (move to rejection store) |
| GET | `/api/dx/v1/issue` | ✅ | store.issue.view | List issues |
| POST | `/api/dx/v1/issue` | ✅ | store.issue.create | Create issue |
| PUT | `/api/dx/v1/issue/{id}` | ✅ | store.issue.update | Update issue |
| POST | `/api/dx/v1/issue/{id}/approve` | ✅ | store.issue.approve | Approve issue |
| POST | `/api/dx/v1/issue/{id}/reverse` | ✅ | store.issue.reverse | Reverse issue |
| POST | `/api/dx/v1/issue/compute-theoretical` | ✅ | store.issue.create | Compute theoretical quantity |
| GET | `/api/dx/v1/consumption` | ✅ | store.consumption.view | List consumption entries |
| POST | `/api/dx/v1/consumption/compute` | ✅ | store.consumption.view | Compute consumption variance |
| POST | `/api/dx/v1/consumption/{id}/explain` | ✅ | store.consumption.explain | Submit explanation |
| POST | `/api/dx/v1/consumption/{id}/review` | ✅ | store.consumption.review | Review consumption |
| GET | `/api/dx/v1/transfer` | ✅ | store.transfer.view | List transfers |
| POST | `/api/dx/v1/transfer` | ✅ | store.transfer.create | Create transfer (dispatch) |
| POST | `/api/dx/v1/transfer/{id}/receive` | ✅ | store.transfer.receive | Receive transfer |
| GET | `/api/dx/v1/transfer/in-transit` | ✅ | store.transfer.view | List in-transit transfers |
| GET | `/api/dx/v1/transfer/{id}/ageing` | ✅ | store.transfer.view | Get in-transit ageing |
| GET | `/api/dx/v1/return` | ✅ | store.return.view | List returns |
| POST | `/api/dx/v1/return` | ✅ | store.return.create | Create return to store |
| POST | `/api/dx/v1/return-to-vendor` | ✅ | store.return.create | Create return to vendor |
| POST | `/api/dx/v1/return/{id}/approve` | ✅ | store.return.approve | Approve return |
| GET | `/api/dx/v1/adjustment` | ✅ | store.stock.view | List adjustments |
| POST | `/api/dx/v1/adjustment` | ✅ | store.stock.adjust | Create adjustment |
| POST | `/api/dx/v1/adjustment/{id}/approve` | ✅ | store.stock.approve_adjustment | Approve adjustment |
| POST | `/api/dx/v1/scrap` | ✅ | store.scrap.create | Create scrap/damage |
| POST | `/api/dx/v1/scrap/{id}/approve` | ✅ | store.scrap.approve | Approve scrap/damage |
| GET | `/api/dx/v1/stocktake` | ✅ | store.stocktake.view | List stock takes |
| POST | `/api/dx/v1/stocktake` | ✅ | store.stocktake.create | Create stock take |
| PUT | `/api/dx/v1/stocktake/{id}` | ✅ | store.stocktake.create | Update stock take |
| POST | `/api/dx/v1/stocktake/{id}/count` | ✅ | store.stocktake.count | Submit count |
| POST | `/api/dx/v1/stocktake/{id}/recount` | ✅ | store.stocktake.recount | Submit recount |
| POST | `/api/dx/v1/stocktake/{id}/approve` | ✅ | store.stocktake.approve | Approve stock take |
| GET | `/api/dx/v1/valuation/config` | ✅ | store.stock.view | Get valuation configs |
| PUT | `/api/dx/v1/valuation/config/{id}` | ✅ | store.stock.adjust | Update valuation config |
| GET | `/api/dx/v1/reorder/suggestions` | ✅ | store.reorder.view | Get reorder suggestions |
| PUT | `/api/dx/v1/reorder/config/{id}` | ✅ | store.reorder.configure | Update reorder config |
| GET | `/api/dx/v1/stock/ageing` | ✅ | store.stock.view | Get stock ageing analysis |
| GET | `/api/dx/v1/stock/expiry` | ✅ | store.stock.view | Get expiry alerts |
| GET | `/api/dx/v1/reports/stock-ledger` | ✅ | store.report.export | Stock ledger report |
| GET | `/api/dx/v1/reports/consumption-statement` | ✅ | store.report.export | Consumption statement |

---

**Total API Endpoints:** 296 (244 from Parts 1-14 + 52 from Part 15)

---

### Subcontractor & Work Order Management (Part 16)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/work-orders` | ✅ | sc.wo.view | List work orders |
| POST | `/api/dx/v1/work-orders` | ✅ | sc.wo.create | Create work order |
| GET | `/api/dx/v1/work-orders/{id}` | ✅ | sc.wo.view | Get WO details |
| PUT | `/api/dx/v1/work-orders/{id}` | ✅ | sc.wo.update | Update work order |
| POST | `/api/dx/v1/work-orders/{id}/validate-release` | ✅ | sc.wo.release | Validate release gates |
| POST | `/api/dx/v1/work-orders/{id}/release` | ✅ | sc.wo.release | Release WO to SC |
| POST | `/api/dx/v1/work-orders/{id}/amend` | ✅ | sc.wo.amend | Create WO amendment |
| POST | `/api/dx/v1/work-orders/{id}/close` | ✅ | sc.wo.close | Close work order |
| POST | `/api/dx/v1/work-orders/{id}/terminate` | ✅ | sc.wo.terminate | Terminate work order |
| GET | `/api/dx/v1/free-issue/accounts` | ✅ | sc.freeissue.view | List free-issue accounts |
| GET | `/api/dx/v1/free-issue/accounts/{woId}/{itemId}` | ✅ | sc.freeissue.view | Get account details |
| POST | `/api/dx/v1/free-issue/reconcile` | ✅ | sc.freeissue.reconcile | Reconcile free-issue |
| POST | `/api/dx/v1/free-issue/set-recovery-rate` | ✅ | sc.freeissue.set_recovery_rate | Set recovery rate |
| GET | `/api/dx/v1/sc-bills` | ✅ | sc.bill.view | List SC bills |
| POST | `/api/dx/v1/sc-bills` | ✅ | sc.bill.create | Create SC bill |
| GET | `/api/dx/v1/sc-bills/{id}` | ✅ | sc.bill.view | Get bill details |
| PUT | `/api/dx/v1/sc-bills/{id}` | ✅ | sc.bill.create | Update SC bill |
| POST | `/api/dx/v1/sc-bills/{id}/check` | ✅ | sc.bill.check | Check bill |
| POST | `/api/dx/v1/sc-bills/{id}/certify` | ✅ | sc.bill.certify | Certify bill |
| POST | `/api/dx/v1/sc-bills/{id}/approve-payment` | ✅ | sc.bill.approve_payment | Approve for payment |
| POST | `/api/dx/v1/sc-bills/{id}/reopen` | ✅ | sc.bill.reopen | Reopen bill |
| GET | `/api/dx/v1/sc-deductions/{billId}` | ✅ | sc.deduction.view | List deductions |
| POST | `/api/dx/v1/sc-deductions/override` | ✅ | sc.deduction.override | Override deduction |
| GET | `/api/dx/v1/backcharges` | ✅ | sc.backcharge.view | List backcharges |
| POST | `/api/dx/v1/backcharges` | ✅ | sc.backcharge.create | Create backcharge |
| POST | `/api/dx/v1/backcharges/{id}/approve` | ✅ | sc.backcharge.approve | Approve backcharge |
| GET | `/api/dx/v1/compliance/periods` | ✅ | sc.compliance.view | List compliance periods |
| POST | `/api/dx/v1/compliance/periods` | ✅ | sc.compliance.view | Create compliance period |
| POST | `/api/dx/v1/compliance/periods/{id}/verify` | ✅ | sc.compliance.verify | Verify compliance |
| POST | `/api/dx/v1/compliance/periods/{id}/release-withholding` | ✅ | sc.compliance.release_withholding | Release withholding |
| GET | `/api/dx/v1/retention/ledger/{woId}` | ✅ | sc.retention.view | Get retention ledger |
| POST | `/api/dx/v1/retention/release` | ✅ | sc.retention.release | Release retention |
| GET | `/api/dx/v1/advance/ledger/{woId}` | ✅ | sc.retention.view | Get advance ledger |
| GET | `/api/dx/v1/sc-performance` | ✅ | sc.performance.view | Get SC performance scores |
| GET | `/api/dx/v1/sc-performance/{subcontractorId}` | ✅ | sc.performance.view | Get SC performance details |
| GET | `/api/dx/v1/dlp/tracker` | ✅ | sc.wo.view | List DLP trackers |
| POST | `/api/dx/v1/dlp/release` | ✅ | sc.wo.close | Release DLP retention |

---

**Total API Endpoints:** 333 (296 from Parts 1-15 + 37 from Part 16)

---

### Measurement Book (Part 17)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/mb` | ✅ | mb.view | List measurement books |
| POST | `/api/dx/v1/mb` | ✅ | mb.create | Create measurement book |
| GET | `/api/dx/v1/mb/{id}` | ✅ | mb.view | Get MB details |
| PUT | `/api/dx/v1/mb/{id}` | ✅ | mb.update | Update MB (draft only) |
| POST | `/api/dx/v1/mb/{id}/check` | ✅ | mb.check | Check MB (QS) |
| POST | `/api/dx/v1/mb/{id}/certify` | ✅ | mb.certify | Certify MB (PM/Client) |
| POST | `/api/dx/v1/mb/{id}/revise` | ✅ | mb.revise | Create revised MB |
| POST | `/api/dx/v1/mb/{id}/supersede` | ✅ | mb.supersede | Supersede MB |
| DELETE | `/api/dx/v1/mb/{id}` | ✅ | mb.delete | Delete draft MB |
| POST | `/api/dx/v1/mb/{id}/reopen` | ✅ | mb.reopen | Reopen certified MB (Super Admin) |
| POST | `/api/dx/v1/mb/compute-quantity` | ✅ | mb.create | Compute quantity from dimensions |
| POST | `/api/dx/v1/mb/verify-calc-hash` | ✅ | mb.view | Verify calculation hash |
| GET | `/api/dx/v1/mb/formula-catalogue` | ✅ | mb.view | Get formula catalogue |
| POST | `/api/dx/v1/mb/apply-deductions` | ✅ | mb.create | Apply deduction rules |
| GET | `/api/dx/v1/mb/rounding-rules` | ✅ | mb.view | Get rounding rules |
| GET | `/api/dx/v1/mb/previous-quantity` | ✅ | mb.view | Get previous quantity for BOQ item |
| GET | `/api/dx/v1/mb/cumulative-quantity` | ✅ | mb.view | Get cumulative quantity |
| POST | `/api/dx/v1/mb/verify-chain` | ✅ | mb.view | Verify MB chain integrity |
| POST | `/api/dx/v1/mb/dispute` | ✅ | mb.dispute.raise | Raise dispute |
| PUT | `/api/dx/v1/mb/dispute/{id}` | ✅ | mb.dispute.resolve | Update dispute |
| POST | `/api/dx/v1/mb/dispute/{id}/resolve` | ✅ | mb.dispute.resolve | Resolve dispute |
| GET | `/api/dx/v1/mb/disputes` | ✅ | mb.view | List disputes |
| POST | `/api/dx/v1/mb/evidence` | ✅ | mb.create | Upload evidence |
| GET | `/api/dx/v1/mb/evidence/{lineId}` | ✅ | mb.view | Get evidence for line |
| POST | `/api/dx/v1/mb/joint-measurement` | ✅ | mb.joint.record | Record joint measurement |
| POST | `/api/dx/v1/mb/joint-measurement/sign` | ✅ | mb.joint.sign | Capture signature |
| GET | `/api/dx/v1/mb/reports/abstract` | ✅ | mb.report.view | Abstract of quantities |
| GET | `/api/dx/v1/mb/reports/register` | ✅ | mb.report.view | Measurement register |
| GET | `/api/dx/v1/mb/reports/reconciliation` | ✅ | mb.report.view | Quantity reconciliation |
| GET | `/api/dx/v1/mb/reports/balance` | ✅ | mb.report.view | Balance quantity statement |

---

**Total API Endpoints:** 363 (333 from Parts 1-16 + 30 from Part 17)

---

### Client Billing & Revenue (Part 18)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/api/dx/v1/bills` | ✅ | bill.client.view | List client bills |
| POST | `/api/dx/v1/bills` | ✅ | bill.client.create | Create client bill |
| GET | `/api/dx/v1/bills/{id}` | ✅ | bill.client.view | Get bill details |
| PUT | `/api/dx/v1/bills/{id}` | ✅ | bill.client.update | Update bill (draft only) |
| POST | `/api/dx/v1/bills/generate` | ✅ | bill.client.create | Generate bill from certified MBs |
| POST | `/api/dx/v1/bills/{id}/validate` | ✅ | bill.client.create | Validate bill before submission |
| POST | `/api/dx/v1/bills/{id}/check` | ✅ | bill.client.check | Check bill (QS) |
| POST | `/api/dx/v1/bills/{id}/approve` | ✅ | bill.client.approve | Approve bill |
| POST | `/api/dx/v1/bills/{id}/submit` | ✅ | bill.client.submit | Submit bill to client |
| POST | `/api/dx/v1/bills/{id}/record-certification` | ✅ | bill.certification.record | Record client certification |
| POST | `/api/dx/v1/bills/{id}/cancel` | ✅ | bill.client.cancel | Cancel bill |
| POST | `/api/dx/v1/bills/{id}/reopen` | ✅ | bill.client.reopen | Reopen bill (Super Admin) |
| GET | `/api/dx/v1/bills/{id}/backup-pack` | ✅ | bill.report.export | Generate bill backup pack |
| GET | `/api/dx/v1/bills/{id}/print` | ✅ | bill.report.export | Print bill |
| GET | `/api/dx/v1/variations` | ✅ | bill.variation.view | List variations |
| POST | `/api/dx/v1/variations` | ✅ | bill.variation.create | Create variation |
| GET | `/api/dx/v1/variations/{id}` | ✅ | bill.variation.view | Get variation details |
| PUT | `/api/dx/v1/variations/{id}` | ✅ | bill.variation.update | Update variation |
| POST | `/api/dx/v1/variations/{id}/submit` | ✅ | bill.variation.submit | Submit for client approval |
| POST | `/api/dx/v1/variations/{id}/approve` | ✅ | bill.variation.approve | Record client approval |
| POST | `/api/dx/v1/variations/{id}/incorporate` | ✅ | bill.variation.approve | Incorporate into BOQ |
| GET | `/api/dx/v1/escalation/formulas` | ✅ | bill.escalation.view | List escalation formulas |
| POST | `/api/dx/v1/escalation/formulas` | ✅ | bill.escalation.compute | Create escalation formula |
| POST | `/api/dx/v1/escalation/compute` | ✅ | bill.escalation.compute | Compute escalation for bill |
| GET | `/api/dx/v1/escalation/indices` | ✅ | bill.index.enter | List price indices |
| POST | `/api/dx/v1/escalation/indices` | ✅ | bill.index.enter | Enter price index |
| POST | `/api/dx/v1/escalation/indices/{id}/verify` | ✅ | bill.index.verify | Verify price index |
| GET | `/api/dx/v1/claims` | ✅ | bill.claim.view | List claims |
| POST | `/api/dx/v1/claims` | ✅ | bill.claim.create | Create claim |
| GET | `/api/dx/v1/claims/{id}` | ✅ | bill.claim.view | Get claim details |
| PUT | `/api/dx/v1/claims/{id}` | ✅ | bill.claim.update | Update claim |
| POST | `/api/dx/v1/claims/{id}/issue-notice` | ✅ | bill.claim.submit | Issue claim notice |
| POST | `/api/dx/v1/claims/{id}/submit` | ✅ | bill.claim.submit | Submit claim |
| POST | `/api/dx/v1/claims/{id}/settle` | ✅ | bill.claim.settle | Record settlement |
| GET | `/api/dx/v1/retention/ledger/{projectId}` | ✅ | bill.retention.view | Get retention ledger |
| POST | `/api/dx/v1/retention/release` | ✅ | bill.retention.release | Release retention |
| GET | `/api/dx/v1/dlp/tracker/{projectId}` | ✅ | bill.retention.view | Get DLP tracker |
| POST | `/api/dx/v1/dlp/release-bill` | ✅ | bill.retention.release | Create DLP release bill |
| GET | `/api/dx/v1/mos/tracking` | ✅ | bill.client.view | List MOS tracking |
| POST | `/api/dx/v1/mos/claim` | ✅ | bill.client.create | Claim material on site |
| POST | `/api/dx/v1/mos/reverse` | ✅ | bill.client.create | Reverse MOS (auto on consumption) |
| GET | `/api/dx/v1/certification/tracking` | ✅ | bill.certification.record | Get certification tracking |
| POST | `/api/dx/v1/certification/shortfall` | ✅ | bill.certification.record | Record certification shortfall |
| GET | `/api/dx/v1/client-deductions/reconciliation/{billId}` | ✅ | bill.deduction.view | Get deduction reconciliation |
| POST | `/api/dx/v1/client-deductions/reconcile` | ✅ | bill.deduction.override | Reconcile client deductions |
| GET | `/api/dx/v1/billing/kpis` | ✅ | bill.report.view | Get billing KPIs |
| GET | `/api/dx/v1/billing/reports/register` | ✅ | bill.report.view | Bill register report |
| GET | `/api/dx/v1/billing/reports/certification-status` | ✅ | bill.report.view | Certification status report |
| GET | `/api/dx/v1/billing/reports/under-certification` | ✅ | bill.report.view | Under-certification analysis |
| GET | `/api/dx/v1/billing/reports/wip-statement` | ✅ | bill.report.view | WIP statement |
| GET | `/api/dx/v1/billing/reports/retention-statement` | ✅ | bill.report.view | Retention statement |
| GET | `/api/dx/v1/billing/reports/variation-register` | ✅ | bill.report.view | Variation register report |
| GET | `/api/dx/v1/billing/reports/claims-register` | ✅ | bill.report.view | Claims register report |
| GET | `/api/dx/v1/billing/reports/contract-position` | ✅ | bill.report.view | Contract position summary |

---

**Total API Endpoints:** 415 (363 from Parts 1-17 + 52 from Part 18)

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
