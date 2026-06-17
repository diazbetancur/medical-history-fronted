# Plan de mejora visual — Área privada (con login)

> **Estado:** Propuesta / hoja de ruta. Para ejecutar en una fase próxima.
> **Fecha:** 2026-06-17 · **Rama base sugerida:** `feature/ui-private-refresh` (desde `develop`)
> **Alcance:** Todo lo que está **detrás del login** — Paciente (`/patient/*`), Profesional (`/professional/*`), Admin (`/admin/*`) y diálogos/compartidos asociados. **No** vuelve a tocar el área pública (ya quedó homogeneizada: slider, home, search, perfil, auth, agendar).

---

## 1. Objetivo

Llevar la misma calidad visual y coherencia que se logró en el área pública (azul de marca **#0a6ebd**, botones **pill**, tarjetas con sombra azul suave + hover, espaciado consistente, estados de carga/vacío cuidados) al área privada, **sin romper funcionalidad** y reutilizando un sistema de diseño compartido en lugar de parches por página.

### Principios
- **Reutilizar, no duplicar:** un set de componentes/estilos compartidos (botones, tarjetas, formularios, tablas, encabezados de página, estados vacío/carga/error) que todas las áreas consuman.
- **No romper la función:** los cambios son de presentación (clases, tokens, layout fino). La lógica, formularios reactivos, permisos y rutas no cambian.
- **Accesibilidad y responsive** como criterio de aceptación, no como extra.
- **Por fases verificables:** cada fase deja un área navegable y mejorada, no a medias.

---

## 2. Decisión transversal pendiente (definir antes de Fase 1)

Hoy conviven **dos azules**: público **#0a6ebd** (slider/home/auth) y el token global del sistema **#2563eb** (que usa el área privada vía Material + `--color-primary`). Hay que decidir:

- **Opción A (recomendada):** unificar el token global a **#0a6ebd** (una sola marca en toda la app). Requiere QA del área privada porque toca `--color-primary`/`--gradient-primary` y el tema de Material. Resultado: máxima coherencia.
- **Opción B:** mantener el privado en #2563eb y solo homogeneizar formas (botones/tarjetas) sin cambiar el azul. Menos riesgo, menos coherencia de color.

> El resto del plan asume **Opción A**. Si se elige B, se omite el paso de tokens y se conserva el azul actual del privado.

---

## 3. Fase 0 — Sistema de diseño compartido (fundación)

**Meta:** base reutilizable que las 3 áreas consumirán. Sin esto, cada fase reinventaría estilos.

- **Botones pill compartidos:** ya existe `src/styles/_public-buttons.scss` con `.pill-btn` (`--primary/--outline/--light/--ghost-light`). Promoverlo a botón estándar de la app (o envolver en una directiva `appPillButton`) y documentar cuándo usar pill vs Material icon-button.
- **Tokens de marca:** si Opción A, ajustar `src/styles/_design-tokens.scss` (`$color-brand-primary` → `#0a6ebd`, regenerar `--gradient-primary`, hover/active) y validar el tema de Material (`material-theme`).
- **Tarjeta estándar:** clase/mixin `.surface-card` (radio 16–18px, borde `rgba(10,110,189,.08)`, sombra `0 6–10px … rgba(10,110,189,.1)`, hover-lift opcional) reutilizable en dashboards, listados y formularios.
- **Encabezado de página privado:** patrón único (título + subtítulo + acciones a la derecha en pill) para todas las páginas internas.
- **Estados compartidos:** componentes/ís estilos para *loading* (spinner + texto), *empty state* (icono + texto + acción pill) y *error* (icono + mensaje + reintentar pill). Hoy están repetidos ad-hoc en varias páginas.
- **Formularios:** estandarizar `mat-form-field` (appearance, densidad, spacing), labels requeridas (`app-form-label`) y errores (`app-form-control-error`) — ya existen, falta consistencia de uso.
- **Tablas/listados:** estilo común (header, filas, hover, paginación, chips de estado) para admin/profesional.

**Entregable:** PR de fundación + una página "piloto" (p. ej. dashboard de paciente) migrada como referencia viva.

**Aceptación:** los componentes compartidos existen, documentados, y la página piloto los usa sin regresiones.

---

## 4. Fase 1 — Área Paciente (`/patient/*`)

Es la más expuesta tras el público. Páginas (desde `app.routes.ts`):

- `patient` (home), `wizard` (agendar cita), `appointments` + `appointments/:id`, `profile`, `access-requests`, `change-password`, `activate-professional`, `family-group` (+ `:id`, `family-requests`, `managed/:patientProfileId`), `medications`, `allergies`, `background`, `exams`.
- Layout: `patient-layout` (topbar + sidebar).

**Trabajo:**
- Layout: topbar/sidebar con marca y navegación coherentes (estado activo, iconos, responsive/colapsable).
- Dashboards y listados (citas, medicamentos, alergias, antecedentes, exámenes, grupo familiar) a `.surface-card` + estados compartidos + botones pill.
- Wizard de cita: pasos con estilo consistente, botones pill, foco/teclado.
- Diálogos (alta de medicamento/alergia/examen, etc.): acciones a pill (como ya se hizo en `book-appointment-dialog`).

**Aceptación:** todas las páginas de paciente usan el sistema compartido; sin regresiones de permisos/funcionalidad; responsive verificado.

---

## 5. Fase 2 — Área Profesional (`/professional/*`)

Páginas: `professional` (dashboard), `appointments`, `profile`/onboarding, `availability`, `patients` (+ `:id`), `requests`, `reports`, `suspended`, y `professional/onboarding` standalone.

**Trabajo:**
- Layout profesional homogéneo con el de paciente (misma base, navegación propia).
- Agenda/disponibilidad: calendarios y slots con estilo consistente (reutilizar el patrón de `.slot-item` del diálogo público).
- Listado/detalle de pacientes y solicitudes: tablas/listados estándar + chips de estado + acciones pill.
- Onboarding/perfil: formularios largos con la pauta de formularios de Fase 0.

**Aceptación:** área profesional coherente con paciente; flujos de agenda y revisión sin regresiones.

---

## 6. Fase 3 — Área Admin (`/admin/*`)

Páginas: `admin` (dashboard), `users`, `roles`, `specialties`, `solicitudes`, `patient-claims`, `channel-licenses`, `reports`.

**Trabajo:**
- Layout admin homogéneo.
- Tablas de gestión (usuarios, roles, especialidades, licencias) al estilo de tabla estándar (Fase 0): header, hover, paginación, filtros, acciones pill, chips de estado.
- Pantallas de revisión (solicitudes, vinculaciones de pacientes) con tarjetas/listados y estados compartidos.
- Reportes: tarjetas de métricas consistentes con los dashboards.

**Aceptación:** admin coherente; sin regresiones en CRUD ni permisos.

---

## 7. Cross-cutting (todas las fases)

- **Páginas legales y de error** (`/terms`, `/privacy`, `/help`, `/forbidden`, `/unauthorized`, `not-found`): pasada ligera para que no desentonen (tipografía, botón pill de retorno).
- **Notificaciones** (`/notifications`, campana): listado y estados consistentes.
- **Accesibilidad:** contraste AA, foco visible, navegación por teclado, `aria-*` en menús/diálogos.
- **Responsive:** breakpoints revisados por página (sidebars colapsables, tablas con scroll/*cards* en móvil).
- **Rendimiento:** evitar sombras/animaciones costosas en listados largos; respetar `prefers-reduced-motion`.

---

## 8. Estrategia de ejecución

- **Una rama por fase** (`feature/ui-private-foundation`, `…-patient`, `…-professional`, `…-admin`) desde `develop`, con PR y verificación visual (screenshots de las páginas clave) antes de mergear.
- **Verificación runtime** por página (no solo build): levantar la app, navegar autenticado a cada área, capturar evidencia. Para flujos con click (diálogos/menús) idealmente sumar Playwright al repo (hoy no está) o verificación manual guiada.
- **Orden recomendado:** Fase 0 → 1 → 2 → 3. Fase 0 es prerrequisito; 1–3 son independientes entre sí y se pueden reordenar según prioridad de negocio.

## 9. Riesgos / notas

- **Tema de Material:** si se unifica el token global (Opción A), revisar que componentes Material (botones, toolbars, tabs, form-fields) tomen el nuevo azul sin romper contrastes.
- **Superficie grande:** el privado tiene muchas páginas; el valor está en la **fundación reutilizable** (Fase 0). Sin ella, el costo se dispara.
- **Sin Playwright:** la verificación de diálogos/menús internos será manual hasta integrar una herramienta de interacción.
- **No alcance:** este plan no añade features ni cambia lógica; es exclusivamente presentación/UX visual.
