# Checklist de Corrección de Formularios

**Objetivo**: Alinear los formularios de Auth (Crear Cuenta, Iniciar Sesión) con los requisitos de la matriz de validación.

**Estado General**: En Progreso
**Última actualización**: 2026-04-22

---

## Fase 1: Estructura y Mensajes ✅

### Crear Archivo de Mensajes
- [x] Crear `src/app/features/public/pages/auth-form-messages.ts` con mapeos de mensajes por formulario
  - [x] RegisterFormMessages
  - [x] LoginFormMessages
  - [x] ChangePasswordFormMessages
- [x] Crear `docs/FORMULARIOS_CHECKLIST.md` para rastrear progreso

**Estado**: Completado ✅

---

## Fase 2: Lógica de Botones (Deshabilitación) ✅

### Registro (Register Page)
- [x] Desabilitar botón cuando `form.invalid` (además de `isLoading()`)
- [x] Validar que el mensaje de error aparezca debajo del input
- [x] Verificar que no haya errores superpuestos dentro del mat-form-field

**Estado**: Completado ✅

### Login (Login Page)
- [x] Desabilitar botón cuando `form.invalid` (además de `isLoading()`)
- [x] Validar que el mensaje de error aparezca debajo del input
- [x] Verificar que no haya errores superpuestos dentro del mat-form-field

**Estado**: Completado ✅

---

## Fase 3: Estilos de Iconos y Placeholders ✅

### Registro
- [x] Verificar si hay iconos con `matPrefix` o `matSuffix` que causen overlap
- [x] Ajustar padding/espaciado si es necesario
- [x] Confirmar que los placeholders sean visibles

**Estado**: Completado ✅ (No hay iconos actualmente en registro)

### Login
- [x] Verificar si hay iconos con `matPrefix` o `matSuffix` que causen overlap
- [x] Ajustar padding/espaciado si es necesario
- [x] Confirmar que los placeholders sean visibles

**Estado**: Completado ✅ (No hay iconos actualmente en login)

---

## Fase 4: Validación Según Matriz ✅

### Registro
- [x] **email**: required, email, maxLength(256)
  - [x] Mensaje personalizado según error
- [x] **password**: required, minLength(8), maxLength(100), pattern complejo
  - [x] Mensaje personalizado según error
- [x] **confirmPassword**: required, debe coincidir con password
  - [x] Mensaje personalizado
- [x] **firstName**: required, maxLength(100)
  - [x] Mensaje personalizado
- [x] **lastName**: required, maxLength(100)
  - [x] Mensaje personalizado
- [x] **phoneNumber**: maxLength(20), opcional
  - [x] Mensaje personalizado si se ingresa
- [x] **asProfessional**: checkbox, opcional

**Estado**: Completado ✅

### Login
- [x] **email**: required, email
  - [x] Mensaje personalizado según error
- [x] **password**: required
  - [x] Mensaje personalizado según error
- [x] **asProfessional**: checkbox, opcional

**Estado**: Completado ✅

---

## Fase 5: Validaciones Especiales ✅

- [x] Password matcher validator en registro (confirmPassword === password)
- [x] No mostrar "obligatorio" dentro del input (rojo) - usar mensaje debajo
- [x] Desabilitar botón hasta que formula sea válido
- [x] Mostrar help text de complejidad de contraseña cerca del campo (en registro)

**Estado**: Completado ✅

---

## Fase 6: Pruebas en Navegador ✅

- [x] Formulario de Registro
  - [x] Todos los campos muestran errores debajo al blur/submit
  - [x] Botón se deshabilita hasta llenar formulario correctamente
  - [x] Placeholders visibles y no solapados
  - [x] Iconos (si los hay) no solapan placeholder
  - [x] Help text de complejidad de contraseña visible
  
- [x] Formulario de Login
  - [x] Todos los campos muestran errores debajo al blur/submit
  - [x] Botón se deshabilita hasta llenar formulario correctamente
  - [x] Placeholders visibles y no solapados
  - [x] Iconos (si los hay) no solapan placeholder

**Estado**: Completado ✅

---

## Fase 7: Modal de Autenticación ✅

### Login emergente
- [x] Mensajes de error debajo del input
- [x] Botón deshabilitado si el formulario no es válido
- [x] Icono para mostrar/ocultar contraseña
- [x] Placeholders visibles sin solaparse con iconos

### Registro emergente
- [x] Mensajes de error debajo del input
- [x] Botón deshabilitado si el formulario no es válido
- [x] Icono para mostrar/ocultar contraseña
- [x] Icono para confirmar contraseña
- [x] Placeholders visibles sin solaparse con iconos

**Estado**: Completado ✅

---

## Notas

- Documentación de referencia: `docs/MATRIZ_FRONTEND_FORMULARIOS.md` y `docs/AUDITORIA_FORMULARIOS_POST_PUT_PATCH.md`
- Componentes utilizados: `FormControlErrorComponent`, `FormLabelComponent`
- Librería de validación: `src/app/shared/utils/form-validation.ts`
