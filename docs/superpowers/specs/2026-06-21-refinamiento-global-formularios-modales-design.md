# Refinamiento global de formularios y modales — Opción A (soft outline)

> **Fecha:** 2026-06-21 · **Repo:** medical-history-fronted · **Rama:** roadmap
> **Alcance:** Solo capa global de estilos (Material theme + design tokens). **Cero cambios de templates, componentes o lógica.** Aplica a toda la app (público + privado).

## Problema

Los formularios y modales se sienten densos y anticuados: inputs con borde grueso, esquinas poco redondeadas, foco azul de 2px "duro", estado inválido agresivo, y tipografía Roboto genérica. El usuario los quiere **delicados, finos, minimalistas**.

## Objetivo

Refinar la apariencia de **todos** los `mat-form-field` y diálogos de la app desde la capa global (`src/styles/_material-theme.scss` + `src/styles/_design-tokens.scss`), logrando un look "soft outline" delicado, sin tocar ningún template ni lógica (los formularios reactivos, validación, datepicker, permisos y rutas no cambian).

Dirección elegida: **Opción A — soft outline** (ver mockup comparativo aprobado).

## Diseño

### 1. Inputs — soft outline
Los templates ya usan `mat-form-field appearance="outline"`; se reestiliza ese outline globalmente:
- **Reposo:** borde **1px** en gris suave (token `--field-border`, ~`#dde3ea`), esquinas **11px**. Placeholder en gris tenue (`#aab4c2`).
- **Hover:** borde un punto más oscuro (`--field-border-hover`, ~`#c4ccd6`).
- **Foco:** borde color marca (`--color-primary` = #0a6ebd) **sin engrosar a 2px duro**, más un **anillo translúcido** `box-shadow: 0 0 0 4px rgba(10,110,189,.12)`.
- **Inválido:** borde rojo **suave** (`#f0a6a6`) + tinte de fondo muy leve (`#fffafa`), anillo rojo translúcido al enfocar. Nada de borde rojo grueso.
- **Deshabilitado:** atenuado (opacidad/!grises), legible.
- Cubre `input`, `select`, `textarea` y el trigger del `mat-datepicker`. Se mantiene la label flotante de Material.
- Implementación: ajustar las reglas existentes de `.mat-mdc-form-field` en `_material-theme.scss` (hoy ponen foco 2px e inválido duro) → borde fino, radio 11px, anillo de foco vía `box-shadow` en `.mat-mdc-text-field-wrapper`, e invalidación suave. La sección "Form fields" ya existe; se evoluciona, no se duplica.

### 2. Tokens (`_design-tokens.scss`)
Agregar tokens de campo (en #0a6ebd / grises del sistema):
`--field-border`, `--field-border-hover`, `--field-bg` (blanco), `--field-ring` (rgba marca .12), `--field-invalid-border`, `--field-invalid-ring`. Reusar `--color-primary` para el foco.

### 3. Modales / diálogos — solo chrome global
En `.mat-mdc-dialog-container` (ya existe con radius 16px): subir a **18px**, padding más generoso, **sombra grande y suave** (`0 24px 60px -12px rgba(16,24,40,.28)` + hairline ring), título un punto más marcado, divisores hairline. Sin subtítulos (eso requeriría tocar templates → fuera de alcance).

### 4. Tipografía
Reemplazar la familia Roboto por un **stack moderno del sistema** en dos lugares: el `$font-family` del `mat.m2-define-typography-config` (en `_material-theme.scss`) y el `body`/base (`styles.scss`):
`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
Sin dependencia de red (no se agrega webfont). *(Inter como upgrade opcional queda anotado, no se incluye.)*

## Fuera de alcance
- Cambios de templates/HTML, componentes nuevos, o lógica.
- Migración M2 → M3 de Material.
- Subtítulos en diálogos, rediseño de layouts/tarjetas/tablas (eso es el plan grande `2026-06-17-mejora-visual-area-privada.md`).
- Webfonts externas.

## Riesgos
- Reestilizar el notched-outline de MDC es delicado: verificar alineación de íconos prefix/suffix, `textarea`, `select`, datepicker, y los estados foco/hover/inválido/deshabilitado. Si algún estado queda raro, se ajusta en la verificación.
- El cambio es **app-wide**: afecta también inputs del público (auth/search). Es deseado (coherencia), pero hay que mirarlos en la verificación.

## Criterios de éxito
- Un formulario representativo (p. ej. crear examen: input, select, textarea, datepicker, validación) se ve "soft outline" delicado, con foco de anillo suave y error sutil, y **funciona igual** (datepicker abre, validación marca, submit envía).
- Diálogos con esquinas 18px, padding y sombra refinados.
- Tipografía moderna en toda la app.
- `npx ng build` AOT en verde; sin cambios de lógica/tests de comportamiento.
