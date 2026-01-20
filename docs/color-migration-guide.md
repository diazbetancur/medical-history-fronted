# Guía de Migración de Colores - ProDirectory

Esta guía proporciona estrategias y herramientas para migrar colores legacy al nuevo sistema de diseño.

**Versión**: 2.0  
**Última actualización**: Enero 2026

---

## 🔍 Colores Legacy Detectados

### Colores a Reemplazar

| Color Legacy         | Uso Original         | Nuevo Token                                          |
| -------------------- | -------------------- | ---------------------------------------------------- |
| `#667eea`            | Primary antiguo      | `var(--color-primary)` → `#2563EB`                   |
| `#764ba2`            | Gradient secundario  | Usar `var(--gradient-hero)`                          |
| `#666`, `#666666`    | Texto secundario     | `var(--color-text-secondary)`                        |
| `#888`               | Texto hint/terciario | `var(--color-text-tertiary)`                         |
| `#999`               | Texto disabled       | `var(--color-text-disabled)`                         |
| `#fafafa`            | Background           | `var(--color-background-alt)`                        |
| `#f5f5f5`            | Surface alt          | `var(--color-background-alt)`                        |
| `#eee`, `#eeeeee`    | Border light         | `var(--color-border-light)`                          |
| `#ddd`               | Border default       | `var(--color-border)`                                |
| `#dc2626`            | Error                | `var(--color-error)`                                 |
| `#c62828`            | Error text           | `var(--color-error-text)`                            |
| `#ffebee`            | Error background     | `var(--color-error-bg)`                              |
| `#ef5350`            | Error border         | `var(--color-error)`                                 |
| `#4caf50`, `#66bb6a` | Success              | `var(--color-success)`                               |
| `#2e7d32`            | Success text         | `var(--color-success-text)`                          |
| `#e8f5e9`            | Success background   | `var(--color-success-bg)`                            |
| `#d1fae5`            | Success chip bg      | `var(--chip-success-bg)`                             |
| `#065f46`            | Success chip text    | `var(--chip-success-text)`                           |
| `#f59e0b`            | Warning/Rating star  | `var(--color-warning)` o `var(--rating-star-filled)` |
| `#92400e`            | Warning text         | `var(--chip-warning-text)`                           |
| `#fef3c7`            | Warning background   | `var(--chip-warning-bg)`                             |
| `#dbeafe`            | Info background      | `var(--chip-info-bg)`                                |
| `#1e40af`            | Info text            | `var(--chip-info-text)`                              |
| `#0284c7`            | Info link            | `var(--color-info)`                                  |
| `#f0f9ff`            | Info light bg        | `var(--chip-info-bg)`                                |
| `#fee2e2`            | Error chip bg        | `var(--chip-error-bg)`                               |
| `#991b1b`            | Error chip text      | `var(--chip-error-text)`                             |
| `#d97706`            | Warning icon         | `var(--color-warning)`                               |
| `white`              | Text inverted        | `var(--color-text-inverted)`                         |
| `rgba(0,0,0,0.87)`   | Text primary         | `var(--color-text-primary)`                          |
| `rgba(0,0,0,0.6)`    | Text secondary       | `var(--color-text-secondary)`                        |
| `rgba(0,0,0,0.38)`   | Text disabled        | `var(--color-text-disabled)`                         |

---

## 🛠️ Expresiones Regulares para Búsqueda

### Buscar todos los colores hexadecimales

```regex
#[0-9a-fA-F]{3,6}\b
```

### Buscar colores rgba específicos

```regex
rgba\s*\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.\d+\s*\)
```

### Buscar el color primary antiguo

```regex
#667eea|#764ba2
```

### Buscar colores de texto grises

```regex
#666|#888|#999|#666666
```

### Buscar backgrounds claros

```regex
#fafafa|#f5f5f5|#eee|#eeeeee
```

### Buscar colores de error

```regex
#dc2626|#c62828|#ef5350|#ffebee|#fee2e2|#991b1b
```

### Buscar colores de éxito

```regex
#10b981|#4caf50|#2e7d32|#66bb6a|#e8f5e9|#d1fae5|#065f46
```

### Buscar colores de warning/rating

```regex
#f59e0b|#fef3c7|#92400e|#d97706
```

---

## 📋 Orden Recomendado de Migración

### Fase 1: Fundamentos ✅ (Completado)

1. ✅ Crear `_design-tokens.scss` con todos los tokens
2. ✅ Crear `_material-theme.scss` con tema personalizado
3. ✅ Crear `_utilities.scss` con clases utilitarias
4. ✅ Actualizar `styles.scss` con imports
5. ✅ Actualizar `angular.json` (remover tema prebuilt)
6. ✅ Actualizar PWA branding (manifest, meta tags)

### Fase 2: Componentes Core ✅ (Completado)

1. ✅ Layouts (public-layout, app-layout, admin-layout)
2. ✅ Páginas principales (home, search, profile)
3. ✅ Login/Auth pages
4. ✅ Dashboard
5. ✅ Dialogs y modals

### Fase 3: Componentes Secundarios

1. [ ] Verificar todos los componentes en `shared/ui/`
2. [ ] Verificar componentes de admin
3. [ ] Verificar componentes de features/app
4. [ ] Verificar componentes de features/public

### Fase 4: Validación

1. [ ] Ejecutar búsqueda regex de colores hardcodeados
2. [ ] Validar contraste WCAG con herramientas
3. [ ] Probar en diferentes dispositivos
4. [ ] Verificar PWA manifest en móvil
5. [ ] Probar estados de focus/keyboard navigation
6. [ ] Verificar reduced motion preference

---

## 🔄 Scripts de Búsqueda

### PowerShell - Buscar colores en archivos SCSS

```powershell
# Buscar todos los colores hex en archivos SCSS (excluyendo tokens)
Get-ChildItem -Path "src/app" -Filter "*.scss" -Recurse |
  Select-String -Pattern "#[0-9a-fA-F]{3,6}\b" |
  Select-Object Path, LineNumber, Line

# Contar ocurrencias por archivo
Get-ChildItem -Path "src/app" -Filter "*.scss" -Recurse | ForEach-Object {
    $count = (Get-Content $_.FullName | Select-String -Pattern "#[0-9a-fA-F]{3,6}\b").Count
    if ($count -gt 0) {
        [PSCustomObject]@{
            File = $_.FullName.Replace((Get-Location).Path + "\", "")
            Count = $count
        }
    }
} | Sort-Object Count -Descending | Format-Table -AutoSize

# Buscar estilos inline en HTML
Get-ChildItem -Path "src/app" -Filter "*.html" -Recurse |
  Select-String -Pattern 'style="[^"]*(?:color|background)[^"]*#[0-9a-fA-F]' |
  Select-Object Path, LineNumber, Line
```

### Bash - Buscar colores en archivos SCSS

```bash
# Buscar todos los colores hex (excluyendo tokens)
grep -rn --include="*.scss" "#[0-9a-fA-F]\{3,6\}" src/app/

# Solo contar ocurrencias
grep -rc --include="*.scss" "#[0-9a-fA-F]\{3,6\}" src/app/ | grep -v ":0$"

# Buscar estilos inline en HTML
grep -rn --include="*.html" 'style=".*#[0-9a-fA-F]' src/app/
```

### VS Code Search

Para buscar en VS Code:

1. Abre búsqueda (`Ctrl+Shift+F`)
2. Activa regex (`.*` botón)
3. Busca: `#[0-9a-fA-F]{3,6}`
4. Incluir: `src/app/**/*.scss`
5. Excluir: `**/node_modules/**`

---

## 🎯 Mapeo de Reemplazo Rápido

### En SCSS

```scss
// ANTES                          // DESPUÉS
// ================================================================
// Textos
color: #666;
color: var(--color-text-secondary);
color: #999;
color: var(--color-text-tertiary);
color: #333;
color: var(--color-text-primary);
color: white;
color: var(--color-text-inverted);
color: rgba(0, 0, 0, 0.87);
color: var(--color-text-primary);
color: rgba(0, 0, 0, 0.6);
color: var(--color-text-secondary);

// Fondos
background: #667eea;
background: var(--color-primary);
background: #fff;
background: var(--color-surface);
background: #fafafa;
background: var(--color-background-alt);
background: #f5f5f5;
background: var(--color-background-alt);

// Bordes
border-color: #eee;
border-color: var(--color-border-light);
border-color: #ddd;
border-color: var(--color-border);
border-color: #ccc;
border-color: var(--color-border-dark);

// Sombras
box-shadow: 0 2px 8px rgba(...);
box-shadow: var(--shadow-sm);
box-shadow: 0 4px 16px rgba(...);
box-shadow: var(--shadow-md);
box-shadow: 0 8px 32px rgba(...);
box-shadow: var(--shadow-lg);

// Gradientes
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// →
background: var(--gradient-hero);

// Status chips
background: #d1fae5;
background: var(--chip-success-bg);
color: #065f46;
color: var(--chip-success-text);
background: #fef3c7;
background: var(--chip-warning-bg);
color: #92400e;
color: var(--chip-warning-text);
background: #fee2e2;
background: var(--chip-error-bg);
color: #991b1b;
color: var(--chip-error-text);
background: #dbeafe;
background: var(--chip-info-bg);
color: #1e40af;
color: var(--chip-info-text);
```

### En HTML - Usar clases utilitarias

```html
<!-- ANTES (evitar) -->
<div style="color: #666;">Text</div>
<div style="background: #fafafa;">Content</div>

<!-- DESPUÉS -->
<div class="text-secondary">Text</div>
<div class="bg-surface-alt">Content</div>

<!-- Status chips -->
<span class="chip-success">Verified</span>
<span class="chip-warning">Pending</span>
<span class="chip-error">Rejected</span>
<span class="chip-info">In Progress</span>

<!-- Alertas -->
<div class="alert-success">Success message</div>
<div class="alert-warning">Warning message</div>
<div class="alert-error">Error message</div>
```

---

## ⚠️ Casos Especiales

### 1. Colores con opacidad

```scss
// ANTES
background: rgba(0, 0, 0, 0.5);

// DESPUÉS - Usar overlay tokens
background: var(--color-overlay); // 50% opacity
background: var(--color-overlay-light); // 20% opacity
background: var(--color-backdrop); // 70% opacity (para modals)
```

### 2. Colores en linear-gradient

```scss
// ANTES
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// DESPUÉS - Usar gradient tokens
background: var(--gradient-hero);
background: var(--gradient-primary);
background: var(--gradient-accent);
background: var(--gradient-surface);
```

### 3. Colores en box-shadow

```scss
// ANTES
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

// DESPUÉS - Usar shadow tokens
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
box-shadow: var(--shadow-lg);
box-shadow: var(--shadow-xl);
box-shadow: var(--shadow-2xl);
box-shadow: var(--shadow-focus); // Para focus rings
```

### 4. Colores en SVG icons

```scss
// ANTES
.icon {
  fill: #2563eb;
}

// DESPUÉS
.icon {
  fill: currentColor; // Hereda del color del texto
}

// O usar variables CSS
.icon {
  fill: var(--color-primary);
}
```

### 5. Colores en :hover/:focus

```scss
// ANTES
.button:hover {
  background: #1d4ed8;
}

// DESPUÉS - Usar tokens de estado
.button:hover {
  background: var(--color-primary-hover);
}

.button:active {
  background: var(--color-primary-active);
}

.button:disabled {
  background: var(--color-primary-disabled);
  opacity: 0.6;
}
```

### 6. Colores en media queries (dark mode)

```scss
// Si necesitas override específico para dark mode:
@media (prefers-color-scheme: dark) {
  // Usar los mismos tokens, el sistema se encarga
  // No hardcodear colores aquí
}
```

---

## ✅ Checklist Final de Validación

### Archivos SCSS

- [ ] `src/styles.scss` - Sin colores hardcodeados
- [ ] `src/app/**/*.scss` - Sin colores hardcodeados
- [ ] Verificar con regex (ver scripts arriba)

### Archivos HTML

- [ ] Sin estilos inline con colores
- [ ] Usar clases utilitarias donde aplique
- [ ] Sin `style="color: #xxx"` directo

### PWA Branding

- [ ] `public/manifest.webmanifest`:
  - [ ] `theme_color: "#2563EB"`
  - [ ] `background_color: "#F8FAFC"`
- [ ] `src/index.html`:
  - [ ] `<meta name="theme-color" content="#2563EB">`
  - [ ] `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`

### Angular Material

- [ ] `angular.json` no incluye tema prebuilt (solo `src/styles.scss`)
- [ ] Tema personalizado carga correctamente
- [ ] Todos los componentes Material heredan el tema

### Accesibilidad

- [ ] Focus states visibles (`:focus-visible`)
- [ ] Contraste de texto ≥ 4.5:1 para texto normal
- [ ] Contraste de texto ≥ 3:1 para texto grande (≥18px bold o ≥24px)
- [ ] No usar solo color para transmitir información
- [ ] Reduced motion se respeta

### Visual

- [ ] Probar en Chrome, Firefox, Safari
- [ ] Probar en móvil (iOS Safari, Chrome Android)
- [ ] Verificar splash screen en instalación PWA
- [ ] Verificar barra de estado en iOS/Android

---

## 🐛 Troubleshooting

### Error: Variable CSS no definida

Asegúrate de que `styles.scss` importa correctamente los tokens:

```scss
@use "styles/design-tokens" as tokens;
@use "styles/material-theme";
@use "styles/utilities";
```

### Error: Tema de Material no se aplica

Verifica que `angular.json` no tenga el tema prebuilt:

```json
{
  "styles": ["src/styles.scss"]
}
```

**NO debe tener:**

```json
{
  "styles": ["@angular/material/prebuilt-themes/indigo-pink.css", "src/styles.scss"]
}
```

### Colores no cambian en desarrollo

1. Reinicia el servidor de desarrollo (`ng serve`)
2. Limpia la caché del navegador (Ctrl+Shift+R)
3. Verifica que no hay `!important` overrides en componentes
4. Verifica orden de imports en `styles.scss`

### Variable CSS muestra "undefined"

1. Verifica ortografía del nombre de la variable
2. Verifica que la variable está definida en `:root`
3. Usa fallback: `var(--color-primary, #2563eb)`

### Componente no hereda estilos

1. Verifica que el componente no tiene `ViewEncapsulation.ShadowDom`
2. Si usa `ViewEncapsulation.None`, asegúrate de que no hay conflictos
3. Para estilos específicos, usa `::ng-deep` (con cuidado) o host selectors

---

## 📊 Métricas de Migración

| Métrica                     | Antes | Después |
| --------------------------- | ----- | ------- |
| Colores hex hardcodeados    | ~100+ | 0       |
| Archivos SCSS con tokens    | 3     | 3       |
| Tokens semánticos definidos | 50+   | 150+    |
| Clases utilitarias          | ~80   | ~300    |
| Mixins reutilizables        | 6     | 25+     |
| Preparación dark mode       | No    | Sí      |

---

## 🔮 Próximos Pasos

1. **Dark Mode**: Activar cuando sea requerido
   - Descomentar sección en `_design-tokens.scss`
   - Descomentar sección en `_material-theme.scss`
   - Implementar ThemeService

2. **Más variantes**: Agregar tokens según necesidad
   - Nuevos colores de marca
   - Nuevos componentes

3. **Componentes compartidos**: Crear biblioteca con Storybook
   - Documentar visualmente cada componente
   - Mostrar variantes y estados

4. **Tests visuales**: Implementar tests de regresión visual
   - Chromatic o Percy
   - Snapshots de componentes clave

5. **Performance**: Monitorear tamaño de CSS
   - Usar PurgeCSS si es necesario
   - Analizar unused CSS

---

## 🔗 Herramientas Útiles

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Verificar contraste WCAG
- [Coolors Contrast Checker](https://coolors.co/contrast-checker) - UI más amigable
- [Chrome DevTools Color Picker](https://developer.chrome.com/docs/devtools/css/color/) - Debug en navegador
- [Figma Color Accessibility Plugin](https://www.figma.com/community/plugin/733159460536249875) - Verificar en diseño

---

## 📝 Notas de la Versión 2.0

### Cambios principales

1. **Nueva paleta de marca**:
   - Primary: `#667eea` → `#2563EB`
   - Accent: Nuevo `#FF6B35`
   - Success: `#4caf50` → `#10B981`

2. **Más tokens de componentes**:
   - Cards, Inputs, Buttons, Navigation
   - Tables, Dialogs, Alerts
   - Skeleton loading, Dividers

3. **Mixins mejorados**:
   - `button-variant()` con 5 variantes
   - `card-interactive()` para cards clickables
   - `alert()` para notificaciones
   - Breakpoint mixins para responsive

4. **Utilidades expandidas**:
   - Hover/Active states
   - Animaciones
   - Skeleton loading
   - Container utilities

5. **Dark mode preparado**:
   - Estructura completa lista
   - Solo requiere descomentar
