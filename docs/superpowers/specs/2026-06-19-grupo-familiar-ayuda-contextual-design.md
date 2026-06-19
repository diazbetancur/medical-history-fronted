# Grupo Familiar — Ayuda contextual ligera

> **Fecha:** 2026-06-19 · **Alcance:** 100% frontend (copy + un componente colapsable + tooltips). Sin cambios de backend ni de lógica de negocio.

## Problema

Los usuarios no entienden el feature de **Grupo Familiar**: qué es, para qué sirve, cómo usarlo, y —sobre todo— **para qué son las invitaciones**. Hoy la copy es mínima (la lista solo dice *"Crea un grupo para administrar a los pacientes que cuidas"*) y no distingue los dos caminos para sumar personas.

El núcleo de la confusión es el par **Dependiente vs Invitación**.

## Audiencia / casos de uso

El grupo familiar cubre tres escenarios, y la copy debe abarcarlos:

1. **Padres → hijos menores** — adulto gestiona la info médica de un hijo **sin cuenta propia**.
2. **Cuidado de adultos mayores** — alguien gestiona a un familiar que **sí puede tener cuenta** y aceptar invitación.
3. **Pareja / familia entre adultos** — adultos con cuenta propia que se vinculan mutuamente.

## Modelo (estado actual, para anclar la copy)

- **Miembros** con dos `linkType`:
  - **Dependiente** (`Dependent`) — persona **sin cuenta propia**; su perfil lo crean y gestionan los administradores del grupo.
  - **Registrado** — persona **con cuenta propia**, vinculada **por invitación**; debe aceptar y autorizar el acceso.
- **Roles** (`adminRole`): **Principal** (creador) · **Administrador** (`Additional`, gestiona e invita) · **Miembro** (`None`).
- **Invitaciones / "Solicitudes pendientes"** — personas con cuenta a las que se invitó y están esperando aceptar/rechazar.

Archivos relevantes:
- `src/app/patient/pages/family-group/family-group-list.page.html`
- `src/app/patient/pages/family-group/family-requests.page.html`
- `src/app/patient/pages/family-group/family-group-detail.page.html`

## Diseño

### 1. Componente colapsable "¿Cómo funciona?"

Componente chico **reutilizable** (p. ej. `FamilyGroupHelpPanelComponent` en la carpeta del feature). Colapsado por defecto; **recuerda el estado** del usuario (localStorage). Se usa arriba de la **lista de grupos** y de **invitaciones**.

Contenido:

> **Qué es:** Un grupo familiar te permite administrar la información médica de las personas que cuidas —tus hijos, un familiar mayor o tu pareja— desde tu propia cuenta.
>
> **Dos formas de sumar personas:**
> - **Dependiente** — alguien sin cuenta propia (p. ej. un hijo menor). Tú creas y gestionas todo su perfil.
> - **Miembro registrado (por invitación)** — alguien que ya tiene cuenta. Le envías una invitación y, al aceptarla, autoriza que los administradores del grupo vean y gestionen su información.
>
> **Roles:** Principal (creador) · Administrador (gestiona e invita) · Miembro.

### 2. Estados vacíos más explicativos

- **Lista vacía** → *"Aún no tienes grupos familiares. Crea uno para administrar la información médica de las personas que cuidas (hijos, adultos mayores o tu pareja). Podrás agregar dependientes sin cuenta o invitar a quienes ya tienen una."*
- **Invitaciones vacía** → *"No tienes invitaciones pendientes. Cuando alguien te invite a su grupo familiar, la verás aquí para aceptarla o rechazarla."*

### 3. Tooltips puntuales

Donde aportan en una línea corta:

- Chip **Dependiente** (detalle) → *"Persona sin cuenta propia; su perfil lo gestionan los administradores del grupo."*
- Chip **Registrado** (detalle) → *"Persona con cuenta propia, vinculada por invitación. Debe autorizar el acceso."*
- Chip **Principal / Admin** (detalle) → *"Puede gestionar miembros, invitar y administrar la información del grupo."*
- Botón **Agregar miembro** (detalle) → *"Agrega un dependiente (sin cuenta) o invita a alguien que ya tiene cuenta."*

> Nota: los tooltips son refuerzo, no la única fuente. La misma explicación (Dependiente / Registrado / Roles) vive en el panel "¿Cómo funciona?", de modo que en móvil/táctil —donde el hover no aplica— el usuario igual la encuentra.

## Tono

Tuteo (consistente con la copy actual del portal).

## Fuera de alcance

- Onboarding/modal paso a paso (se descartó por scope).
- Cambios de backend, de lógica de invitaciones, o de roles.
- Reescritura visual del módulo.

## Criterios de éxito

- Un usuario nuevo, al entrar a Grupo Familiar, entiende en <30s qué es y la diferencia entre **dependiente** e **invitación** sin salir de la pantalla.
- El panel "¿Cómo funciona?" no estorba a usuarios recurrentes (colapsado + recuerda estado).
- Sin regresiones: build y type-check en verde.
