# Despliegue PWA Angular en cualquier hosting

Esta guía deja el proyecto portable para Vercel, Netlify y hosts genéricos, manteniendo Angular + Service Worker sin cambios de arquitectura.

## 1) Build de producción

```bash
npm run build:prod
```

Salida principal:

- `dist/pro-directory/browser`

Archivos críticos que deben quedar públicos:

- `index.html`
- `manifest.webmanifest`
- `ngsw-worker.js`
- `ngsw.json`
- `icons/*`

## 2) Reglas obligatorias para cualquier hosting

1. **SPA fallback**: cualquier ruta no estática debe resolver a `index.html`.
2. **No cache agresivo** para `index.html`, `manifest.webmanifest`, `ngsw-worker.js`, `ngsw.json`.
3. **Cache largo** para assets versionados (`*.js`, `*.css`, `icons/*`).
4. **HTTPS obligatorio**.
5. Evitar bloquear Service Worker por CSP o headers restrictivos.

## 3) Vercel

Ya configurado en [vercel.json](vercel.json):

- `buildCommand`
- `outputDirectory`
- `rewrites` SPA
- `headers` para manifest y SW

## 4) Netlify

Ya preparado con:

- [public/\_redirects](public/_redirects) (fallback SPA)
- [public/\_headers](public/_headers) (cache PWA)

Si usas Netlify, publica `dist/pro-directory/browser`.

## 5) Nginx (referencia)

```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location = /manifest.webmanifest { add_header Cache-Control "public, max-age=0, must-revalidate"; }
location = /ngsw-worker.js { add_header Cache-Control "public, max-age=0, must-revalidate"; }
location = /ngsw.json { add_header Cache-Control "public, max-age=0, must-revalidate"; }
location = /index.html { add_header Cache-Control "public, max-age=0, must-revalidate"; }

location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

## 6) Apache (.htaccess referencia)

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Y headers equivalentes para `manifest.webmanifest`, `ngsw-worker.js`, `ngsw.json`, `index.html` con `max-age=0, must-revalidate`.

## 7) Cloudflare Pages / S3+CloudFront

Asegura:

- Fallback de rutas a `index.html`.
- Cache-control manual para:
  - `manifest.webmanifest`
  - `ngsw-worker.js`
  - `ngsw.json`
  - `index.html`
- Assets hashed con cache largo.

## 8) Verificación post-deploy

1. `GET /manifest.webmanifest` → 200
2. `GET /ngsw-worker.js` → 200
3. `GET /ngsw.json` → 200
4. Abrir ruta interna (`/patient/...`) y refrescar sin 404
5. En iOS Safari: Compartir → **Agregar a pantalla de inicio**

Comandos útiles:

```bash
npx lighthouse https://tu-dominio --view
curl -I https://tu-dominio/manifest.webmanifest
curl -I https://tu-dominio/ngsw-worker.js
curl -I https://tu-dominio/ngsw.json
```
