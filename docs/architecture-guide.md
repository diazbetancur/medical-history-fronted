# Project Architecture Guide

## Folder Structure (Post-Refactoring)

```
src/app/
├── core/                    # Singletons & App-level services
│   ├── auth/                # Authentication, guards, roles
│   │   ├── access-control.ts
│   │   ├── auth.guard.ts
│   │   ├── auth.service.ts
│   │   ├── role.guard.ts
│   │   ├── roles.ts
│   │   ├── token-storage.service.ts
│   │   └── index.ts
│   ├── http/                # Interceptors
│   │   ├── jwt.interceptor.ts
│   │   └── index.ts
│   ├── platform/            # SSR helpers
│   │   ├── platform.service.ts
│   │   └── index.ts
│   ├── config/              # Environment config
│   │   └── index.ts
│   └── index.ts
├── shared/                  # Reusable components/pipes/directives
│   ├── ui/                  # UI Components
│   │   ├── contact-dialog/
│   │   └── index.ts
│   ├── services/            # Shared services (analytics, seo)
│   │   ├── analytics.service.ts
│   │   ├── seo.service.ts
│   │   └── index.ts
│   ├── utils/               # Utilities
│   │   ├── error-handling.ts
│   │   └── index.ts
│   └── index.ts
├── data/                    # Data access layer
│   ├── api/                 # API clients
│   │   ├── api-client.ts
│   │   ├── api-models.ts
│   │   ├── auth.api.ts
│   │   ├── public.api.ts
│   │   ├── professional.api.ts
│   │   ├── admin.api.ts
│   │   └── index.ts
│   ├── stores/              # Signal stores
│   │   ├── home.store.ts
│   │   ├── search.store.ts
│   │   ├── profile.store.ts
│   │   └── index.ts
│   ├── models/              # Data models
│   │   ├── models.ts
│   │   ├── public-page.models.ts
│   │   └── index.ts
│   └── index.ts
├── features/                # Feature modules
│   ├── public/              # Public pages (SSR)
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── public.routes.ts
│   ├── app/                 # Dashboard (Professional)
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── app.routes.ts
│   └── admin/               # Admin panel
│       ├── layouts/
│       ├── pages/
│       └── admin.routes.ts
├── app.component.ts
├── app.config.ts
├── app.config.server.ts
└── app.routes.ts
```

---

## Path Aliases

| Alias | Path | Usage |
|-------|------|-------|
| `@core/*` | `src/app/core/*` | Authentication, guards, interceptors, platform |
| `@shared/*` | `src/app/shared/*` | Reusable UI, services, utils |
| `@data/*` | `src/app/data/*` | API clients, stores, models |
| `@features/*` | `src/app/features/*` | Feature modules |
| `@env` | `src/environments/environment` | Environment config |

### Examples

```typescript
// Before (relative imports)
import { AuthService } from '../../../shared/services/auth.service';
import { HomeStore } from '../../../data-access/stores/home.store';

// After (alias imports)
import { AuthService } from '@core/auth';
import { HomeStore } from '@data/stores';
import { environment } from '@env';
```

---

## Environment Configuration

| File | Environment | API Base URL |
|------|-------------|--------------|
| `environment.ts` | Development | `http://localhost:5254/api` |
| `environment.qa.ts` | QA/Staging | `https://api-qa.prodirectory.com/api` |
| `environment.prod.ts` | Production | `https://api.prodirectory.com/api` |

### Build Commands

```bash
# Development (default)
ng serve
ng build

# QA/Staging
ng serve --configuration qa
ng build --configuration qa

# Production
ng build --configuration production
```

---

## Access Control System

### Role Definitions (`@core/auth/roles.ts`)
- `ADMIN_ROLES`: Admin, SuperAdmin (extensible)
- `PROFESSIONAL_ROLES`: Professional, SuperAdmin
- `CLIENT_ROLES`: Client
- `SUPER_ROLES`: SuperAdmin

### Guards (`@core/auth`)
- `authGuard`: Requires authentication
- `roleGuard`: Flexible role-based access with 'any'/'all' modes
- `adminGuard`: Convenience guard for admin areas
- `professionalGuard`: Convenience guard for professional dashboard

### Route Configuration
```typescript
import { adminGuard, authGuard, routeData } from '@core/auth';

{
  path: 'admin',
  canActivate: [authGuard, adminGuard],
  data: routeData('admin'),
  ...
}
```

---

## Build Validation Checklist

- [x] `ng serve` - Development server
- [x] `ng build` - Production build
- [x] `ng build --configuration qa` - QA build
- [x] SSR prerender works (10 static routes)
- [x] PWA manifest/service worker configured
- [x] All imports use aliases (no `../../../`)
- [x] No SSR-unsafe code (platform checks in place)
