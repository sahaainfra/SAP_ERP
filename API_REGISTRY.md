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

### Part 5 — Component Library
- `GET /api/dx/v1/dashboard/layouts` — Dashboard layouts
- `PUT /api/dx/v1/dashboard/layouts/{id}` — Update layout

### Part 6 — Role Dashboards
- `GET /api/dx/v1/dashboards/{role}` — Role-specific dashboard
- `GET /api/dx/v1/projects/{id}/360` — Project 360 view

### Part 7 — Approval Centre
- `GET /api/dx/v1/approvals` — Pending approvals
- `POST /api/dx/v1/approvals/{id}/approve` — Approve
- `POST /api/dx/v1/approvals/{id}/reject` — Reject

### Part 8 — Analytics
- `GET /api/dx/v1/analytics/evm` — EVM data
- `GET /api/dx/v1/analytics/forecast` — Forecast data
- `GET /api/dx/v1/reports/{id}/export` — Export report

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

**Document Status:** ✅ Complete  
**Next Step:** Part 2 — Global Shell and Navigation (will add navigation and search endpoints)
