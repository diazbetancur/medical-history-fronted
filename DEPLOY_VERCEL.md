# Guía de ambientes (Dev / QA / Prod) y despliegue en Vercel

## 1) Ambientes configurados

Este proyecto ya quedó preparado con tres ambientes:

- `development` → usa `src/environments/environment.ts`
- `qa` → usa `src/environments/environment.qa.ts`
- `production` → usa `src/environments/environment.prod.ts`

En `angular.json` ya están definidos los `fileReplacements` para `qa` y `production`.

---

## 2) Scripts disponibles

En `package.json` ahora tienes:

- `npm run start:dev`
- `npm run start:qa`
- `npm run start:prod`
- `npm run build:dev`
- `npm run build:qa`
- `npm run build:prod`
- `npm run build:vercel`

`build:vercel` ejecuta `scripts/vercel-build.mjs`, que selecciona automáticamente:

- `VERCEL_ENV=preview` → build `qa`
- `VERCEL_ENV=production` → build `production`
- `VERCEL_ENV=development` → build `development`

---

## 3) Variables y URLs por ambiente

Revisa y ajusta antes de desplegar:

- `src/environments/environment.qa.ts`
- `src/environments/environment.prod.ts`

### Recomendación

- QA debe apuntar al backend de QA.
- Production debe apuntar al backend productivo.
- `analytics.measurementId` debe ser distinto para QA y PROD si necesitas separar métricas.

---

## 4) Configuración Vercel incluida

Se agregó `vercel.json` con:

- `buildCommand`: `npm run build:vercel`
- `outputDirectory`: `dist/pro-directory/browser`
- `rewrites` para SPA (`/(.*) -> /index.html`)

Esto permite navegación por rutas de Angular sin 404 en refresh.

---

## 5) Estrategia recomendada de ramas

- Rama `main` → Producción
- Rama `develop` (o `qa`) → QA (Preview)

Con esta estrategia, Vercel desplegará:

- **Production Deployment** al hacer merge en `main`
- **Preview Deployment** para PRs y ramas (usando ambiente `qa`)

---

## 6) Pasos para desplegar en Vercel

### Opción A: Desde Dashboard (rápido)

1. Entra a Vercel y selecciona **Add New Project**.
2. Importa el repositorio.
3. En **Build and Output Settings**, confirma:
   - Build Command: `npm run build:vercel`
   - Output Directory: `dist/pro-directory/browser`
4. Guarda y despliega.

### Opción B: Con Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

---

## 7) Variables de entorno en Vercel (si aplican)

Si necesitas secretos o valores por entorno, configúralos en:

- Project Settings → Environment Variables

Define valores para:

- Development
- Preview (QA)
- Production

> Nota: en Angular, variables en `environment*.ts` son de build-time. Si quieres configuración 100% runtime, se debe implementar un `config.json` cargado al iniciar la app.

---

## 8) Verificación rápida post-deploy

1. Abrir la URL desplegada.
2. Navegar por rutas internas (`/search`, `/patient/profile`, etc.).
3. Refrescar una ruta interna para validar rewrite SPA.
4. Verificar que el frontend consume el backend correcto (QA o PROD).
5. Revisar consola/red para confirmar que no hay 404/500 críticos.

---

## 9) Comandos útiles locales

```bash
npm run build:qa
npm run build:prod
npm run start:qa
npm run start:prod
```
