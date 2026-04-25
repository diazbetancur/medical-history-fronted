# Auditoria backend de formularios POST/PUT/PATCH

Fecha de auditoria: 2026-04-22
Repositorio: `medical-history-backend`

## Alcance y criterio usado

- Se auditaron endpoints `POST`, `PUT` y `PATCH` que consumen payload de formulario o cuerpo JSON/multipart para crear, editar o moderar datos.
- Se excluyeron endpoints `POST` sin body util para formulario, por ejemplo:
  - `POST /api/appointments/{id}/cancel`
  - `POST /api/appointments/{id}/confirm`
  - `POST /api/appointments/{id}/resend-confirmation`
  - `POST /api/professional/encounters/{encounterId}/close`
  - `POST /api/admin/users/{id}/roles/{roleName}`
  - `PATCH /api/professional/locations/{id}/set-default`
- Fuentes revisadas: controllers, DTOs, services, repositories, middleware de errores y configuracion EF/Identity.

## Hallazgos globales

- No se detecto `FluentValidation` aplicado a estos contratos. La validacion vive en:
  - `DataAnnotations`
  - `IValidatableObject` (`CreateServiceDto`, `UpdateServiceDto`)
  - validaciones manuales en controllers
  - reglas de negocio en services/repositories
  - restricciones EF/DB
- `ApiController` usa validacion de modelo por defecto; no se encontro `InvalidModelStateResponseFactory` custom.
- El middleware central `Api-BackDirectory/Handlers/ErrorHandlingMiddleware.cs` devuelve `ProblemDetails` con `type`, `title`, `status`, `detail`, `instance`, `traceId`, `errorCode`, `timestamp` y `errors` (solo para `ValidationException`).
- Politica real de password de Identity en `Api-BackDirectory/Program.cs`:
  - minimo 8
  - requiere digito
  - requiere minuscula
  - requiere mayuscula
  - requiere caracter no alfanumerico
- Inconsistencias transversales importantes:
  - `RegisterUserDto` y `AdminCreateUserDto` aceptan `MinLength(6)`, pero Identity exige 8+ y complejidad.
  - `ProfessionalProfileDto` permite longitudes mayores que DB: `BusinessName` 200 vs DB 150, `Slug` 250 vs DB 150, `Address` 500 vs DB 300.
  - `Create/UpdateServiceDto` permite `Name` 200 vs DB 150.
  - `CreateServiceRequestDto` es mas estricto o distinto que DB: `ClientName` 100 vs DB 150, `ClientEmail` 150 vs DB 100, `Message` 1000 vs DB 2000.
  - `AdminUpdateRequestDto` y `UpdateRequestStatusDto` limitan notas a 500, pero DB permite 1000.
  - `PatientProfileService` no valida coherencia `CountryId`/`CityId`; si llegan IDs, solo los persiste. Si llegan nombres, intenta resolver por nombre pero tampoco valida relacion pais-ciudad.
  - `ProfessionalProfileService.ValidateMetadataAsync` valida pais y ciudad por separado, pero no que la ciudad pertenezca al pais enviado.
  - `AvailabilityController` opera con `professionalId` de ruta y no valida ownership contra el usuario autenticado.
  - `AvailabilityService.CreateExceptionAsync` ignora `InstitutionId` del DTO al persistir la excepcion.
  - `PatientMedicationService` hace fallback silencioso a `Active` si `Status` no parsea al enum.
  - `AdminRbacUsersController` "lock/unlock" solo cambia `LockoutEnabled`; no define `LockoutEnd`, por lo que el "bloqueo" puede no bloquear efectivamente.
  - `FavoriteController` no requiere auth y acepta `FavoriteDto` crudo sin validaciones de negocio.

## Bloque A: Inventario consolidado

### Auth

- `POST /api/auth/register` -> `RegisterUserDto`
- `POST /api/auth/login` -> `LoginDto`
- `POST /api/auth/change-password` -> `ChangePasswordDto`
- `POST /api/auth/forgot-password` -> `ForgotPasswordDto`
- `POST /api/auth/reset-password` -> `ResetPasswordDto`
- `POST /api/auth/become-professional` -> `BecomeProfessionalDto`

### Perfil paciente y modulos del paciente

- `POST /api/patients/me` -> `CreatePatientProfileDto` (create-or-update)
- `PUT /api/patients/me` -> `UpdatePatientProfileDto`
- `POST /api/patients/me/background` -> `CreateBackgroundItemDto`
- `PUT /api/patients/me/background/{id}` -> `UpdateBackgroundItemDto`
- `POST /api/patient/allergies` -> `CreateAllergyDto`
- `PUT /api/patient/allergies/{id}` -> `UpdateAllergyDto`
- `POST /api/patient/medications` -> `CreateMedicationDto`
- `PUT /api/patient/medications/{id}` -> `UpdateMedicationDto`
- `POST /api/patients/me/exams` -> multipart (`title`, `examDate`, `notes`, `file`)
- `PUT /api/patients/me/exams/{id}` -> `UpdateExamDto`
- `PUT /api/patient/privacy` -> `PatientPrivacyDto`

### Perfil profesional y autogestion profesional

- `POST /api/professional/profile` -> `CreateProfessionalProfileDto`
- `PUT /api/professional/profile` -> `UpdateProfessionalProfileDto`
- `POST /api/professional/profile/photo` -> multipart (`photo`)
- `POST /api/professional/services` -> `CreateServiceDto`
- `PUT /api/professional/services/{id}` -> `UpdateServiceDto`
- `POST /api/professional/specialties` -> `SelfAssignSpecialtyItemDto`
- `PUT /api/professional/specialties` -> `UpdateMySpecialtiesDto`
- `POST /api/professional/specialties/proposals` -> `ProposeSpecialtyDto`
- `PUT /api/professional/{professionalId}/availability/template` -> `UpsertAvailabilityTemplateDto`
- `POST /api/professional/{professionalId}/availability/exceptions` -> `CreateAvailabilityExceptionDto`
- `POST /api/professional/locations` -> `CreateProfessionalLocationDto`
- `PUT /api/professional/locations/{id}` -> `UpdateProfessionalLocationDto`
- `POST /api/professional/education` -> `CreateProfessionalEducationDto`
- `PUT /api/professional/education/{id}` -> `UpdateProfessionalEducationDto`
- `POST /api/professional/education/{id}/diploma` -> multipart (`file`)
- `PATCH /api/professional/requests/{id}` -> `UpdateRequestStatusDto`
- `POST /api/professional/patients/{patientProfileId}/encounters` -> `CreateMedicalEncounterDto`
- `PUT /api/professional/encounters/{encounterId}` -> `UpdateMedicalEncounterDto`
- `POST /api/professional/encounters/{encounterId}/addendum` -> `AddAddendumDto`

### Citas

- `POST /api/appointments` -> `CreateAppointmentDto`
- `POST /api/appointments/mine` -> `CreateMyAppointmentDto`
- `PUT /api/appointments/{id}` -> `UpdateAppointmentDto`
- `POST /api/appointments/{id}/reschedule` -> `RescheduleAppointmentDto`

### Publico

- `POST /api/public/requests` -> `CreateServiceRequestDto`
- `POST /api/public/favorites` -> `FavoriteDto`

### Admin / catalogos / RBAC

- `POST /api/catalog/institutions` -> `CreateInstitutionDto`
- `PUT /api/catalog/institutions/{id}` -> `UpdateInstitutionDto`
- `POST /api/admin/specialties` -> `CreateSpecialtyDto`
- `PUT /api/admin/specialties/{id}` -> `UpdateSpecialtyDto`
- `POST /api/admin/specialties/proposals/{proposalId}/approve` -> `ApproveProposalDto`
- `POST /api/admin/specialties/proposals/{proposalId}/merge/{existingSpecialtyId}` -> `MergeProposalDto`
- `POST /api/admin/specialties/proposals/{proposalId}/reject` -> `RejectProposalDto`
- `PATCH /api/admin/professionals/{id}` -> `AdminUpdateProfessionalDto`
- `POST /api/admin/professionals/{id}/approve` -> `ApproveProfessionalDto`
- `POST /api/admin/professionals/{id}/reject` -> `RejectProfessionalDto`
- `POST /api/admin/professionals/{id}/activate` -> `ApproveProfessionalDto`
- `PUT /api/admin/professionals/{id}/specialties` -> `List<AssignSpecialtyDto>`
- `PATCH /api/admin/services/{id}` -> `AdminUpdateServiceDto`
- `PATCH /api/admin/requests/{id}` -> `AdminUpdateRequestDto`
- `POST /api/admin/users` -> `AdminCreateUserDto`
- `PUT /api/admin/users/{id}/roles` -> `CC.Domain.Dtos.Auth.UpdateUserRolesDto`
- `POST /api/admin/rbac/users` -> `CC.Domain.Dtos.Admin.CreateUserDto`
- `PATCH /api/admin/rbac/users/{userId}` -> `UpdateUserDto`
- `PATCH /api/admin/rbac/users/{userId}/roles` -> `CC.Domain.Dtos.Admin.UpdateUserRolesDto`
- `POST /api/admin/rbac/users/{userId}/lock` -> `LockUserDto`
- `POST /api/admin/roles` -> `CreateRoleDto`
- `PATCH /api/admin/roles/{roleId}` -> `UpdateRoleDto`
- `PUT /api/admin/roles/{roleId}/permissions` -> `UpdateRolePermissionsDto`

## Bloque B: Detalle completo por endpoint / formulario

### F01. Registro de usuario

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/auth/register`
- Caso de uso / modulo: Auth / registro de cliente
- Archivos principales: `Api-BackDirectory/Controllers/Auth/AuthController.cs`, `CC.Domain/Dtos/Auth/UserManagementDtos.cs`, `CC.Application/Services/Auth/UserService.cs`, `Api-BackDirectory/Program.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| email | string | Si | Crear | - | max 256 | email; null no; empty no | Ingresa un correo valido | `El email es requerido`, `El formato del email no es valido` |
| password | string | Si | Crear | minimo real 8 por Identity | min 6 DTO / max 100 | null no; empty no | Usa una clave segura | `La contraseña es requerida`, `La contraseña debe tener al menos 6 caracteres` + errores Identity |
| confirmPassword | string | Si | Crear | - | - | debe coincidir con `password`; null no; empty no | Confirma la contraseña | `La confirmación de contraseña es requerida`, `Las contraseñas no coinciden` |
| firstName | string | Si | Crear | - | max 100 | null no; empty no | Ingresa tu nombre | `El nombre es requerido` |
| lastName | string | Si | Crear | - | max 100 | null no; empty no | Ingresa tu apellido | `El apellido es requerido` |
| phoneNumber | string | No | Crear | - | max 20 | `Phone`; null si; empty si | Telefono opcional | `El formato del teléfono no es valido` |

3. Reglas de negocio adicionales

- Email unico: `El email ya está registrado`.
- Siempre asigna rol por defecto `Client`.
- Siempre intenta autocrear `PatientProfile`.
- Policy real de password contradice DTO: Identity exige 8, mayuscula, minuscula, digito y caracter especial.

4. Observaciones para frontend

- Prioridad alta: no confiar en `MinLength(6)`; validar con regla Identity real.
- Mostrar errores de password de Identity completos cuando backend los devuelva.
- Marcar `email`, `password`, `confirmPassword`, `firstName`, `lastName` como obligatorios.

### F02. Login

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/auth/login`
- Caso de uso / modulo: Auth / inicio de sesion
- Archivos principales: `AuthController.cs`, `UserManagementDtos.cs`, `UserService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| email | string | Si | Crear | - | - | email; null no; empty no | Ingresa tu correo | `El email es requerido`, `El formato del email no es valido` |
| password | string | Si | Crear | - | - | null no; empty no | Ingresa tu contraseña | `La contraseña es requerida` |

3. Reglas de negocio adicionales

- Credenciales invalidas o usuario bloqueado devuelven el mismo mensaje: `Email o contraseña incorrectos`.

4. Observaciones para frontend

- No diferenciar "usuario no existe" vs "password incorrecta".
- Validar formato de email antes de enviar.

### F03. Cambio de contraseña autenticado

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/auth/change-password`
- Caso de uso / modulo: Auth / seguridad
- Archivos principales: `AuthController.cs`, `UserManagementDtos.cs`, `UserService.cs`, `Program.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| currentPassword | string | Si | Editar | - | - | null no; empty no | Ingresa tu clave actual | `La contraseña actual es requerida` |
| newPassword | string | Si | Editar | minimo real 8 por Identity | min 8 DTO / max 100 | null no; empty no | Usa una nueva clave segura | `La nueva contraseña es requerida`, `La nueva contraseña debe tener al menos 8 caracteres` + errores Identity |
| confirmNewPassword | string | Si | Editar | - | - | debe coincidir con `newPassword`; null no; empty no | Confirma tu nueva clave | `La confirmación de la nueva contraseña es requerida`, `Las contraseñas no coinciden` |

3. Reglas de negocio adicionales

- Se apoya en Identity para validar password actual y complejidad.

4. Observaciones para frontend

- Validar match y complejidad antes de enviar.
- Mantener la clave actual como obligatoria visualmente.

### F04. Solicitud de recuperacion de contraseña

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/auth/forgot-password`
- Caso de uso / modulo: Auth / recuperacion
- Archivos principales: `AuthController.cs`, `UserManagementDtos.cs`, `UserService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| email | string | Si | Crear | - | - | email; null no; empty no | Ingresa el correo de tu cuenta | `El email es requerido`, `El formato del email no es valido` |

3. Reglas de negocio adicionales

- Siempre responde exito generico para evitar enumeracion: `Si el email existe, se generó un token de recuperación`.

4. Observaciones para frontend

- Mostrar siempre mensaje generico de exito.
- No anunciar al usuario si la cuenta existe o no.

### F05. Reset de contraseña con token

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/auth/reset-password`
- Caso de uso / modulo: Auth / recuperacion
- Archivos principales: `AuthController.cs`, `UserManagementDtos.cs`, `UserService.cs`, `Program.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| email | string | Si | Editar | - | - | email; null no; empty no | Ingresa tu correo | `El email es requerido`, `El formato del email no es valido` |
| token | string | Si | Editar | - | - | base64url; null no; empty no | Usa el token recibido | `El token es requerido` |
| newPassword | string | Si | Editar | minimo real 8 por Identity | min 8 DTO / max 100 | null no; empty no | Define una nueva clave | `La nueva contraseña es requerida`, `La nueva contraseña debe tener al menos 8 caracteres` + errores Identity |
| confirmNewPassword | string | Si | Editar | - | - | debe coincidir con `newPassword` | Confirma tu nueva clave | `La confirmación de la nueva contraseña es requerida`, `Las contraseñas no coinciden` |

3. Reglas de negocio adicionales

- Si usuario/token no validan: `Token o email inválido`.
- Identity puede devolver mensajes adicionales por token invalido o password debil.

4. Observaciones para frontend

- Mantener flujo de error generico para token/email invalidos.
- Aplicar validacion de complejidad real.

### F06. Upgrade a profesional

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/auth/become-professional`
- Caso de uso / modulo: Auth / cambio de rol
- Archivos principales: `AuthController.cs`, `UserManagementDtos.cs`, `UserService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| reason | string | No | Crear | - | max 500 | null si; empty si | Motivo opcional | solo `MaxLength(500)` |

3. Reglas de negocio adicionales

- Solo usuarios con rol `Client` pueden invocarlo desde controller.
- Si ya es profesional: `El usuario ya tiene el rol de Profesional`.
- Si agrega `Professional`, asegura `PatientProfile`.

4. Observaciones para frontend

- `reason` no es obligatorio visualmente.
- Mostrar error especifico si el usuario ya fue promovido.

### F07. Perfil de paciente (crear o editar)

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/patients/me`, `/api/patients/me`
- Caso de uso / modulo: Perfil de paciente
- Archivos principales: `PatientsController.cs`, `CC.Domain/Dtos/PatientDto.cs`, `CC.Application/Services/PatientProfileService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fullName | string | Si | Ambos | - | max 200 | null no; empty no; backend normaliza espacios repetidos | Ingresa nombre completo | `FullName is required` |
| email | string | Si | Ambos | - | max 255 | email; null no; empty no | Ingresa un correo valido | `Email is required`, `Email must be a valid email address` |
| phone | string | No | Ambos | - | max 20 | null si; empty si; whitespace -> null en service | Telefono opcional | `Phone cannot exceed 20 characters` |
| documentType | string | No | Ambos | - | max 10 | null si; empty si | Tipo de documento opcional | `DocumentType cannot exceed 10 characters` |
| documentNumber | string | No | Ambos | - | max 30 | null si; empty si | Numero de documento opcional | `DocumentNumber cannot exceed 30 characters` |
| dateOfBirth | `DateOnly?` | No | Ambos | - | - | null si | Fecha de nacimiento opcional | sin mensaje custom |
| gender | string | No | Ambos | - | max 20 | null si; empty si | Genero opcional | `Gender cannot exceed 20 characters` |
| bloodType | string | No | Ambos | - | max 5 | null si; empty si | Grupo sanguineo opcional | `BloodType cannot exceed 5 characters` |
| countryId | `Guid?` | No | Ambos | - | - | null si | Pais opcional | sin validacion declarativa |
| cityId | `Guid?` | No | Ambos | - | - | null si | Ciudad opcional | sin validacion declarativa |
| countryName | string | No | Ambos | - | max 100 | usado como entrada transicional si no hay `countryId` | Pais texto libre | `CountryName cannot exceed 100 characters` |
| cityName | string | No | Ambos | - | max 100 | usado como entrada transicional si no hay `cityId` | Ciudad texto libre | `CityName cannot exceed 100 characters` |
| addressLine1 | string | No | Ambos | - | max 300 | null si; empty si | Direccion opcional | `AddressLine1 cannot exceed 300 characters` |

3. Reglas de negocio adicionales

- `POST /api/patients/me` crea o actualiza segun exista perfil previo.
- `PUT /api/patients/me` falla 404 si no existe perfil.
- `email` se sincroniza con Identity y termina persistiendo `user.Email ?? dto.Email`; el valor enviado por frontend puede ser ignorado.
- `ResolveLocationAsync` intenta resolver por nombre si no llegan IDs, pero no aplica validacion dura de coherencia entre pais y ciudad.

4. Observaciones para frontend

- Prioridad alta: si el frontend permite editar email aqui, puede dar una falsa expectativa; el backend manda la version de Identity.
- Marcar `fullName` y `email` como obligatorios.
- Validaciones locales simples: email, largos maximos, trim visual de espacios.

### F08. Perfil profesional (crear y editar)

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/professional/profile`, `/api/professional/profile`
- Caso de uso / modulo: Perfil profesional
- Archivos principales: `ProfileController.cs`, `ProfessionalProfileDtos.cs`, `ProfessionalProfileService.cs`, `MetadataRepository.cs`, `CC.Infrastructure/Configurations/DBContext.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| businessName | string | Si | Ambos | - | max 200 DTO / 150 DB | null no; empty no | Ingresa el nombre profesional o comercial | `El nombre del negocio es requerido` |
| slug | string | No | Crear | - | max 250 DTO / 150 DB | regex `^[a-z0-9-]*$`; si no llega se genera | URL publica del perfil | `El slug no puede exceder 250 caracteres`, `El slug solo puede contener letras minúsculas, números y guiones` |
| description | string | No | Ambos | - | max 2000 | null si; empty si | Descripcion opcional | `La descripción no puede exceder 2000 caracteres` |
| cityId | Guid | Si | Ambos | - | - | null no | Selecciona una ciudad | `La ciudad es requerida` |
| countryId | Guid | Si | Ambos | - | - | null no | Selecciona un pais | `El país es requerido` |
| phone | string | No | Ambos | - | max 20 | no tiene `[Phone]`; null si; empty si | Telefono opcional | `El teléfono no puede exceder 20 caracteres` |
| whatsApp | string | No | Ambos | - | max 20 | no tiene `[Phone]`; null si; empty si | WhatsApp opcional | `El WhatsApp no puede exceder 20 caracteres` |
| email | string | No | Ambos | - | max 100 | email; null si; empty si | Correo profesional opcional | `El email no es válido` |
| address | string | No | Ambos | - | max 500 DTO / 300 DB | null si; empty si | Direccion opcional | `La dirección no puede exceder 500 caracteres` |
| profileImageUrl | string | No | Ambos | - | max 500 | URL; null si; empty si | URL de imagen opcional | `La URL de la imagen no es válida` |

3. Reglas de negocio adicionales

- Un usuario solo puede tener un perfil profesional.
- Si `slug` no llega, se genera desde `BusinessName`.
- El `slug` se fuerza a unico.
- Valida pais y ciudad activos, pero no valida que la ciudad pertenezca al pais.
- `PUT` devuelve 404 si el usuario no tiene perfil.

4. Observaciones para frontend

- Prioridad alta: alinear maximos visibles con DB, no solo DTO (`businessName` 150, `slug` 150, `address` 300).
- Marcar `businessName`, `cityId`, `countryId` como obligatorios.
- Validar `phone`/`whatsApp` en frontend; backend solo limita longitud.

### F09. Foto de perfil profesional

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/professional/profile/photo`
- Caso de uso / modulo: Perfil profesional / media
- Archivos principales: `ProfileController.cs`, `ProfessionalProfileService.cs`, `CC.Application/Services/Storage/FileProcessingService.cs`, `UserStorageQuotaService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| photo | archivo | Si | Editar | max 5 MB | - | `image/jpeg`, `image/png`, `image/webp`; null no; vacio no | Sube JPG, PNG o WebP hasta 5 MB | `No se recibió ningún archivo.`, `El archivo excede el tamaño máximo permitido de 5 MB`, `Tipo de archivo no permitido.` y errores de mime/extension/contenido |

3. Reglas de negocio adicionales

- Solo funciona si existe perfil profesional.
- Se valida MIME, extension y magic bytes.
- Se verifica cuota de storage por usuario.

4. Observaciones para frontend

- Validar tipo y peso antes de enviar.
- Mostrar error 413 separado de errores 400.

### F10. Crear cita general

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/appointments`
- Caso de uso / modulo: Appointments / creacion general
- Archivos principales: `AppointmentController.cs`, `AppointmentDto.cs`, `AppointmentService.cs`, `AvailabilityService.cs`, `DBContext.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| patientId | Guid | Si | Crear | - | - | null no | Selecciona el paciente | `PatientId es requerido` |
| patientProfileId | `Guid?` | No | Crear | - | - | null si | Perfil de paciente opcional pero recomendado | sin mensaje declarativo |
| patientName | string | Si | Crear | - | max 200 | null no; empty no | Nombre del paciente | `Nombre del paciente es requerido` |
| patientEmail | string | Si | Crear | - | max 255 | email; null no; empty no | Email del paciente | `Email del paciente es requerido`, `Email inválido` |
| patientPhone | string | No | Crear | - | max 20 | `Phone`; null si; empty si | Telefono opcional | `Teléfono inválido` |
| professionalProfileId | Guid | Si | Crear | - | - | null no | Profesional | `ProfessionalProfileId es requerido` |
| institutionId | `Guid?` | No | Crear | - | - | null si | Institucion opcional | sin mensaje declarativo |
| appointmentDate | `DateTime` | Si | Crear | - | - | null no | Fecha de la cita | `Fecha de cita es requerida` |
| timeSlot | string | Si | Crear | - | len 5 aprox | regex `HH:mm`; null no; empty no | Selecciona un horario valido | `Horario es requerido`, `Formato de horario inválido. Use HH:mm (ej: 09:00)` |
| durationMinutes | int | Si | Crear | 15..480 | - | default 30 | Duracion de la cita | `Duración debe estar entre 15 y 480 minutos` |
| reason | string | No | Crear | - | max 500 | null si; empty si | Motivo opcional | `Motivo no puede exceder 500 caracteres` |
| patientNotes | string | No | Crear | - | max 1000 | null si; empty si | Notas del paciente | `Notas no pueden exceder 1000 caracteres` |
| notes | string | No | Crear | - | max 300 | null si; empty si; pensado como no PHI/PII | Notas internas | `Notes no pueden exceder 300 caracteres` |
| observation | string | No | Crear | - | max 1000 | null si; empty si | Observacion adicional | `Observation no puede exceder 1000 caracteres` |

3. Reglas de negocio adicionales

- No permite fechas pasadas: `No se pueden crear citas en fechas pasadas`.
- Requiere template de disponibilidad activo.
- Valida disponibilidad, traslape profesional y traslape paciente.
- Unique index DB evita doble booking por `ProfessionalProfileId + StartUtc` cuando `Status != Cancelled`.
- Mensajes principales:
  - `El horario seleccionado no está disponible`
  - `Ya existe una cita programada en este horario`
  - `Ya tienes una cita en este horario`

4. Observaciones para frontend

- Marcar requeridos: `patientId`, `patientName`, `patientEmail`, `professionalProfileId`, `appointmentDate`, `timeSlot`, `durationMinutes`.
- Validar `HH:mm`, email y rangos antes de enviar.
- Backend sigue siendo fuente de verdad para disponibilidad.

### F11. Crear cita propia del paciente autenticado

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/appointments/mine`
- Caso de uso / modulo: Appointments / self-booking
- Archivos principales: `AppointmentController.cs`, `AppointmentDto.cs`, `AppointmentService.cs`, `AvailabilityService.cs`, `PatientProfileService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| professionalProfileId | Guid | Si | Crear | - | - | null no | Selecciona un profesional | `ProfessionalProfileId es requerido` |
| institutionId | `Guid?` | No | Crear | - | - | null si | Institucion opcional | - |
| appointmentDate | `DateTime` | Si | Crear | - | - | null no | Selecciona una fecha | `Fecha de cita es requerida` |
| timeSlot | string | Si | Crear | - | - | regex `HH:mm` | Selecciona un horario valido | `Horario es requerido`, `Formato de horario inválido. Use HH:mm (ej: 09:00)` |
| reason | string | No | Crear | - | max 500 | null si | Motivo opcional | `Motivo no puede exceder 500 caracteres` |
| patientNotes | string | No | Crear | - | max 1000 | null si | Comentarios opcionales | `Notas no pueden exceder 1000 caracteres` |
| notes | string | No | Crear | - | max 300 | null si | Notas internas | `Notes no pueden exceder 300 caracteres` |
| observation | string | No | Crear | - | max 1000 | null si | Observacion opcional | `Observation no puede exceder 1000 caracteres` |

3. Reglas de negocio adicionales

- Identidad del paciente se resuelve desde JWT; el body no controla `patientId`, `patientName`, `patientEmail`, `patientPhone`.
- `durationMinutes` no viene en request; se toma de `template.SlotMinutes`.
- Si no existe perfil de paciente: 404 `No patient profile exists for the current user. Use POST /api/patients/me to create one.`
- Si el profesional no tiene template: 422 `Professional does not have an active availability template configured.`

4. Observaciones para frontend

- No renderizar campos de identidad del paciente en este formulario.
- Prioridad alta: el frontend debe manejar 404 de perfil paciente y dirigir a crear perfil.

### F12. Editar cita

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/appointments/{id}`
- Caso de uso / modulo: Appointments / edicion
- Archivos principales: `AppointmentController.cs`, `AppointmentDto.cs`, `AppointmentService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| appointmentDate | `DateTime?` | No | Editar | - | - | null si; si no llega conserva valor actual | Nueva fecha opcional | - |
| timeSlot | `string?` | No | Editar | - | - | regex `HH:mm`; null si | Nuevo horario opcional | `Formato de horario inválido. Use HH:mm` |
| durationMinutes | `int?` | No | Editar | 15..480 | - | null si | Nueva duracion | `Duración debe estar entre 15 y 480 minutos` |
| reason | `string?` | No | Editar | - | max 500 | null si; null = mantener; no hay clear explicito | Motivo | - |
| patientNotes | `string?` | No | Editar | - | max 1000 | null si; null = mantener | Notas paciente | - |
| professionalNotes | `string?` | No | Editar | - | max 2000 | null si; null = mantener | Notas profesional | - |
| observation | `string?` | No | Editar | - | max 1000 | null si; null = mantener | Observacion | - |
| status | `AppointmentStatus?` | No | Editar | - | - | null si | Estado | sin mensaje declarativo |

3. Reglas de negocio adicionales

- No permite editar canceladas: `No se puede modificar una cita cancelada`.
- No permite editar completadas: `No se puede modificar una cita completada`.
- Si cambia fecha/hora, aplica mismas reglas de disponibilidad y no-pasado.
- Si cambia fecha/hora, al menos algunos flujos terminan en `Rescheduled`.
- No hay forma clara de borrar textos enviando string vacio o null; el servicio usa semantica parcial.

4. Observaciones para frontend

- Si la UI quiere "vaciar" campos de texto, hoy el backend no ofrece semantica explicita para todos.
- La disponibilidad debe revalidarse siempre en backend.

### F13. Reprogramar cita

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/appointments/{id}/reschedule`
- Caso de uso / modulo: Appointments / reprogramacion
- Archivos principales: `AppointmentController.cs`, `AppointmentDto.cs`, `AppointmentService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| newDate | DateTime | Si | Editar | - | - | null no | Nueva fecha | `Nueva fecha es requerida` |
| newTimeSlot | string | Si | Editar | - | - | regex `HH:mm`; null no | Nuevo horario | `Nuevo horario es requerido`, `Formato de horario inválido. Use HH:mm (ej: 09:00)` |
| durationMinutes | `int?` | No | Editar | 15..480 | - | null si; si no llega conserva duracion actual | Duracion opcional | `Duración debe estar entre 15 y 480 minutos` |
| reason | `string?` | No | Editar | - | max 500 | null si; string vacio no limpia | Motivo opcional | `Motivo no puede exceder 500 caracteres` |

3. Reglas de negocio adicionales

- No permite reprogramar canceladas o completadas.
- No permite fecha pasada.
- Valida disponibilidad, traslape profesional y traslape paciente.
- Mensaje por traslape paciente: `El paciente ya tiene una cita en este horario`.

4. Observaciones para frontend

- Este formulario es distinto de la edicion parcial general; conviene UI dedicada.

### F14. Antecedentes del paciente

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/patients/me/background`, `/api/patients/me/background/{id}`
- Caso de uso / modulo: Patient background
- Archivos principales: `PatientBackgroundController.cs`, `PatientBackgroundDtos.cs`, `PatientBackgroundService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| type | string | Si | Ambos | - | max 50 | null no; empty no; service revalida whitespace | Tipo de antecedente | `Type is required` / `El tipo es requerido` |
| title | string | Si | Ambos | - | max 120 | null no; empty no; service revalida whitespace | Titulo del antecedente | `Title is required` / `El título es requerido` |
| description | string | No | Ambos | - | max 1000 | null si | Descripcion opcional | `Description must not exceed 1000 characters` |
| eventDate | `DateOnly?` | No | Ambos | - | - | null si | Fecha opcional | - |
| isChronic | bool | No | Ambos | - | - | default false create | Marcar si es cronico | - |
| isActive | bool | No | Editar | - | - | default true | Activo/inactivo | - |

3. Reglas de negocio adicionales

- Requiere perfil de paciente.
- `POST` siempre crea `IsActive = true`.
- Si el item no pertenece al usuario: `Elemento no encontrado`.

4. Observaciones para frontend

- Marcar `type` y `title` como obligatorios.
- Hacer trim antes de enviar para evitar mensajes redundantes.

### F15. Alergias

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/patient/allergies`, `/api/patient/allergies/{id}`
- Caso de uso / modulo: Patient allergies
- Archivos principales: `PatientAllergiesController.cs`, `PatientAllergyDtos.cs`, `PatientAllergyService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| allergen | string | Si | Ambos | - | max 200 | null no; empty no; service rechaza whitespace | Alergeno | `Allergen is required` / `Allergen cannot be empty` |
| reaction | string | No | Ambos | - | max 300 | null si | Reaccion opcional | `Reaction must not exceed 300 characters` |
| severity | enum | Si | Ambos | - | - | null no | Severidad | `Severity is required` |
| status | enum | Si | Ambos | - | - | create default `Active` | Estado | `Status is required` |
| notes | string | No | Ambos | - | max 500 | null si | Notas opcionales | `Notes must not exceed 500 characters` |
| onsetDate | `DateOnly?` | No | Ambos | - | - | null si | Fecha de inicio opcional | - |

3. Reglas de negocio adicionales

- Requiere perfil de paciente.
- Si no existe item: `Allergy not found`.

4. Observaciones para frontend

- `allergen`, `severity`, `status` deben verse obligatorios.
- Si el UI usa enum numerico, alinear con el contrato real del backend.

### F16. Medicaciones

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/patient/medications`, `/api/patient/medications/{id}`
- Caso de uso / modulo: Patient medications
- Archivos principales: `PatientMedicationsController.cs`, `PatientMedicationDtos.cs`, `PatientMedicationService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| name | string | Si | Ambos | - | max 200 | null no; empty no | Nombre del medicamento | `Medication name is required` |
| dose | string | No | Ambos | - | max 100 | null si | Dosis opcional | `Dose cannot exceed 100 characters` |
| frequency | string | No | Ambos | - | max 100 | null si | Frecuencia opcional | `Frequency cannot exceed 100 characters` |
| prescribedBy | string | No | Ambos | - | max 200 | null si | Prescrito por | `Prescribed by cannot exceed 200 characters` |
| startDate | `DateOnly?` | No | Ambos | - | - | null si | Fecha inicio | - |
| endDate | `DateOnly?` | No | Ambos | - | - | null si | Fecha fin | - |
| isOngoing | bool | Si | Ambos | - | - | create default true | Sigue en curso | `[Required]` |
| notes | string | No | Ambos | - | max 500 | null si | Notas opcionales | `Notes cannot exceed 500 characters` |
| status | string | Si | Ambos | - | - | create default `Active`; no enum declarado en DTO | Estado | `[Required]` |

3. Reglas de negocio adicionales

- Si `isOngoing=true`, `endDate` no puede existir: `Si el medicamento está en curso (IsOngoing=true), no puede tener fecha de fin`.
- Si `status` no parsea al enum, el service hace fallback silencioso a `Active`.
- No existe validacion para `endDate >= startDate`.

4. Observaciones para frontend

- Prioridad alta: validar `status` contra lista cerrada en frontend; backend hoy acepta basura y la convierte a `Active`.
- Conviene validar cronologia `startDate/endDate` en frontend, porque backend no lo hace.

### F17. Examenes del paciente - alta con archivo

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/patients/me/exams`
- Caso de uso / modulo: Patient exams / upload
- Archivos principales: `PatientExamsController.cs`, `PatientExamDtos.cs`, `PatientExamService.cs`, `FileProcessingService.cs`, `UserStorageQuotaService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| title | string | Si | Crear | - | max 150 | null no; empty no; service revalida whitespace | Titulo del examen | `Title is required` / `El título es requerido` |
| examDate | `DateOnly` | Si | Crear | - | - | null no | Fecha del examen | `Exam date is required` / `La fecha del examen es requerida` |
| notes | string | No | Crear | - | max 1500 | null si | Notas opcionales | `Notes must not exceed 1500 characters` |
| file | archivo | Si | Crear | max 10 MB | - | `application/pdf`, `image/jpeg`, `image/png`, `image/webp`; null no; vacio no | Sube PDF o imagen hasta 10 MB | errores de archivo, cuota y media type |

3. Reglas de negocio adicionales

- Requiere perfil de paciente.
- Valida MIME, extension y magic bytes.
- Verifica cuota de storage.
- Controller traduce errores:
  - 413 si detecta texto de tamano maximo
  - 415 si detecta tipo de archivo no permitido
  - 400 para resto

4. Observaciones para frontend

- Prioridad alta: validar tipo/peso antes de subir.
- Mostrar errores de archivo aparte de errores de metadata.

### F18. Examenes del paciente - edicion metadata

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/patients/me/exams/{id}`
- Caso de uso / modulo: Patient exams / metadata
- Archivos principales: `PatientExamsController.cs`, `PatientExamDtos.cs`, `PatientExamService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| title | string | Si | Editar | - | max 150 | null no; empty no | Titulo del examen | `Title is required` / `El título es requerido` |
| examDate | `DateOnly` | Si | Editar | - | - | null no | Fecha del examen | `Exam date is required` / `La fecha del examen es requerida` |
| notes | string | No | Editar | - | max 1500 | null si | Notas opcionales | `Notes must not exceed 1500 characters` |

3. Reglas de negocio adicionales

- No soporta reemplazo de archivo en este endpoint.
- Si no existe item: 404 `Examen no encontrado`.

4. Observaciones para frontend

- Si la UI necesita cambiar archivo, hoy no existe PUT de reemplazo.

### F19. Privacidad del historial medico del paciente

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/patient/privacy`
- Caso de uso / modulo: Patient privacy
- Archivos principales: `PatientHistoryController.cs`, `PatientHistoryDtos.cs`, `PatientHistoryService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| shareFullHistoryWithTreatingProfessionals | bool | Si | Editar | - | - | null no | Compartir historial completo | `[Required]` |

3. Reglas de negocio adicionales

- Requiere perfil de paciente.
- Actualiza tambien `ShareUpdatedAtUtc`.

4. Observaciones para frontend

- Conviene mostrar este switch con explicacion funcional, no solo booleana.

### F20. Servicios del profesional

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/professional/services`, `/api/professional/services/{id}`
- Caso de uso / modulo: Professional services
- Archivos principales: `ServicesController.cs`, `ServiceDtos.cs`, `ProfessionalServiceService.cs`, `DBContext.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| name | string | Si | Ambos | - | max 200 DTO / 150 DB | null no; empty no | Nombre del servicio | `El nombre del servicio es requerido`, `El nombre no puede exceder 200 caracteres` |
| description | string | No | Ambos | - | max 1000 | null si | Descripcion | `La descripción no puede exceder 1000 caracteres` |
| priceFrom | `decimal?` | No | Ambos | 0..999999.99 | - | null si | Precio desde | `El precio debe estar entre 0 y 999999.99` |
| priceTo | `decimal?` | No | Ambos | 0..999999.99 | - | null si; si viene con `priceFrom`, debe ser >= | Precio hasta | `El precio debe estar entre 0 y 999999.99`, `El precio máximo debe ser mayor o igual al precio mínimo` |
| duration | string | No | Ambos | - | max 50 | null si | Duracion textual | `La duración no puede exceder 50 caracteres` |
| sortOrder | int | No | Ambos | - | - | default 0 | Orden visual | - |

3. Reglas de negocio adicionales

- Requiere perfil profesional del usuario.
- `PUT` valida ownership del servicio.
- No hay partial update: en `PUT` todos los campos del DTO se reemplazan.

4. Observaciones para frontend

- Prioridad alta: limitar `name` a 150 hasta alinear DB.
- Si `priceFrom` y `priceTo` se muestran juntos, validar relacion antes de enviar.

### F21. Especialidades propias del profesional

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/professional/specialties`, `/api/professional/specialties`
- Caso de uso / modulo: Professional specialties
- Archivos principales: `SpecialtiesController.cs`, `SpecialtyProposalDtos.cs`, `ProfessionalSpecialtyService.cs`, `ProfessionalProfileRepository.cs`

2. Campos del request

POST `SelfAssignSpecialtyItemDto`

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| specialtyId | Guid | Si | Crear | - | - | null no | Selecciona una especialidad | `SpecialtyId is required` |
| isPrimary | bool | No | Crear | - | - | default false | Marcar como principal | - |

PUT `UpdateMySpecialtiesDto`

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| specialties | lista | Si | Editar | max 10 | - | puede ir vacia para limpiar todo; dedup por `specialtyId` | Define tus especialidades | `Specialties list is required`, `Cannot assign more than 10 specialties` |

3. Reglas de negocio adicionales

- Si agrega una nueva y es la primera, pasa a primaria automaticamente.
- Si `POST` intenta agregar una ya asignada, no falla; devuelve la lista actual.
- En `PUT`, si hay mas de una primaria: `Solo puede haber una especialidad principal.`
- Repositorio valida que el perfil exista y que todos los `specialtyId` existan.

4. Observaciones para frontend

- En `PUT`, permitir lista vacia solo si la UX contempla "quitar todas".
- Controlar una sola especialidad primaria en frontend.

### F22. Propuesta de nueva especialidad

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/professional/specialties/proposals`
- Caso de uso / modulo: Professional specialty proposals
- Archivos principales: `SpecialtiesController.cs`, `SpecialtyProposalDtos.cs`, `ProfessionalSpecialtyService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| proposedName | string | Si | Crear | - | min 2 / max 100 | null no; empty no | Escribe la especialidad propuesta | `ProposedName is required` |
| justification | string | No | Crear | - | max 500 | null si | Justificacion opcional | `MaxLength(500)` |

3. Reglas de negocio adicionales

- Si ya existe en catalogo: 422 `La especialidad '{name}' ya existe en el catálogo...`
- Si el mismo profesional ya tiene propuesta pendiente con el mismo nombre normalizado: `Ya tienes una propuesta pendiente para esta especialidad.`

4. Observaciones para frontend

- Validar trim y minimo 2.
- Si backend responde 422 por duplicado en catalogo, conviene sugerir seleccionar la especialidad existente.

### F23. Template de disponibilidad

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/professional/{professionalId}/availability/template`
- Caso de uso / modulo: Availability / template semanal
- Archivos principales: `AvailabilityController.cs`, `ProfessionalAvailabilityDto.cs`, `AvailabilityService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| timeZone | string | Si | Ambos | - | max 100 | default `UTC`; null no; empty no | Zona horaria | `TimeZone is required` |
| slotMinutes | int | Si | Ambos | 5..240 | - | default 30 | Duracion de slot | `SlotMinutes must be between 5 and 240` |
| isActive | bool | No | Ambos | - | - | default true | Activar template | - |
| weeklyWindows | lista | Si | Ambos | - | - | lista requerida | Define los bloques horarios | `WeeklyWindows is required` |

Campos por item `weeklyWindows[]`

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dayOfWeek | int | Si | Ambos | 0..6 | - | domingo=0 | Dia de semana | `DayOfWeek must be between 0 (Sunday) and 6 (Saturday)` |
| startTime | string | Si | Ambos | - | - | regex `HH:mm` | Hora inicio | `StartTime is required`, `StartTime must be in HH:mm format` |
| endTime | string | Si | Ambos | - | - | regex `HH:mm` | Hora fin | `EndTime is required`, `EndTime must be in HH:mm format` |
| institutionId | `Guid?` | No | Ambos | - | - | null si | Institucion catalogo | - |
| professionalLocationId | `Guid?` | No | Ambos | - | - | null si; comentario indica precedencia sobre `institutionId` | Sede propia | - |

3. Reglas de negocio adicionales

- `EndTime` debe ser mayor que `StartTime`.
- No permite ventanas solapadas en el mismo dia.
- No valida que `institutionId` o `professionalLocationId` existan.
- No valida ownership del `professionalId` de ruta.

4. Observaciones para frontend

- Prioridad alta: el frontend debe impedir solapes y fin <= inicio.
- Tambien conviene verificar que solo uno de `institutionId` o `professionalLocationId` quede seleccionado.

### F24. Excepcion de disponibilidad

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/professional/{professionalId}/availability/exceptions`
- Caso de uso / modulo: Availability / excepciones
- Archivos principales: `AvailabilityController.cs`, `ProfessionalAvailabilityDto.cs`, `AvailabilityService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| type | string | Si | Crear | - | - | esperado `Absent` o `Override` | Tipo de excepcion | `Type is required`, `Invalid exception type '{dto.Type}'. Must be 'Absent' or 'Override'` |
| startDateTime | DateTime | Si | Crear | - | - | ISO 8601 | Inicio | `StartDateTime is required` |
| endDateTime | DateTime | Si | Crear | - | - | ISO 8601; debe ser > inicio | Fin | `EndDateTime is required`, `EndDateTime must be greater than StartDateTime` |
| overrideStartTime | `string?` | Condicional | Crear | - | - | regex `HH:mm`; requerido si `type=Override` | Hora inicio override | `OverrideStartTime must be in HH:mm format`, `Override exception requires OverrideStartTime and OverrideEndTime` |
| overrideEndTime | `string?` | Condicional | Crear | - | - | regex `HH:mm`; requerido si `type=Override` y > inicio override | Hora fin override | `OverrideEndTime must be in HH:mm format`, `OverrideEndTime must be greater than OverrideStartTime` |
| reason | `string?` | No | Crear | - | max 200 | null si | Motivo opcional | `Reason cannot exceed 200 characters` |
| institutionId | `Guid?` | No | Crear | - | - | null si | Institucion opcional | sin efecto real en persistencia actual |
| professionalLocationId | `Guid?` | No | Crear | - | - | null si | Sede propia opcional | - |

3. Reglas de negocio adicionales

- `Absent` debe durar al menos 1 minuto.
- `InstitutionId` existe en contrato pero el service no lo guarda.
- No hay validacion de ownership del `professionalId` de ruta.

4. Observaciones para frontend

- Prioridad alta: no depender hoy de `institutionId` porque el backend lo ignora.
- Si `type=Override`, hacer obligatorios visuales los dos horarios override.

### F25. Sedes del profesional

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/professional/locations`, `/api/professional/locations/{id}`
- Caso de uso / modulo: Professional locations
- Archivos principales: `ProfessionalLocationsController.cs`, `ProfessionalLocationDtos.cs`, `ProfessionalLocationService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| name | string | Si | Ambos | - | max 200 | null no; empty no | Nombre de la sede | `Name es requerido` |
| address | string | No | Ambos | - | max 300 | null si | Direccion | `Address no puede exceder 300 caracteres` |
| floor | string | No | Ambos | - | max 100 | null si | Piso/consultorio | `Floor no puede exceder 100 caracteres` |
| cityName | string | No | Ambos | - | max 100 | null si | Ciudad | `CityName no puede exceder 100 caracteres` |
| countryName | string | No | Ambos | - | max 100 | null si | Pais | `CountryName no puede exceder 100 caracteres` |
| latitude | `decimal?` | No | Ambos | -90..90 | - | null si | Latitud | `Latitude debe estar entre -90 y 90` |
| longitude | `decimal?` | No | Ambos | -180..180 | - | null si | Longitud | `Longitude debe estar entre -180 y 180` |
| phone | string | No | Ambos | - | max 30 | `Phone`; null si | Telefono | `Phone format inválido` |
| isDefault | bool | No | Ambos | - | - | create default false | Marcar como sede principal | - |
| isActive | bool | No | Editar | - | - | default true | Activa/inactiva | - |

3. Reglas de negocio adicionales

- Requiere perfil profesional.
- Si es la primera sede y `isDefault=false`, el service la vuelve default automaticamente.
- Si se marca una como default, limpia defaults anteriores.
- Delete no permitido si esta usada en ventanas de disponibilidad.

4. Observaciones para frontend

- Informar que siempre existira una sede principal.
- Validar coordenadas y telefono en cliente.

### F26. Educacion del profesional

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/professional/education`, `/api/professional/education/{id}`
- Caso de uso / modulo: Professional education
- Archivos principales: `ProfessionalEducationController.cs`, `ProfessionalEducationDtos.cs`, `ProfessionalEducationService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| type | enum | Si | Ambos | - | - | `EducationType` | Tipo de formacion | `Type es requerido` |
| degreeTitle | string | Si | Ambos | - | max 200 | null no; empty no | Titulo obtenido | `DegreeTitle es requerido` |
| institutionName | string | Si | Ambos | - | max 200 | null no; empty no | Institucion | `InstitutionName es requerido` |
| institutionCountry | string | No | Ambos | - | max 100 | null si | Pais de la institucion | `InstitutionCountry no puede exceder 100 caracteres` |
| startYear | `int?` | No | Ambos | 1900..2100 | - | null si | Ano de inicio | `StartYear fuera de rango` |
| graduationYear | `int?` | No | Ambos | 1900..2100 | - | null si | Ano de graduacion | `GraduationYear fuera de rango` |
| description | string | No | Ambos | - | max 1000 | null si | Descripcion opcional | `Description no puede exceder 1000 caracteres` |
| sortOrder | int | No | Ambos | - | - | default 0 | Orden | - |

3. Reglas de negocio adicionales

- Requiere perfil profesional.
- No existe validacion de `graduationYear >= startYear`.
- No existe validacion de anos futuros mas alla del rango 2100.

4. Observaciones para frontend

- Prioridad alta: validar cronologia de anos en frontend mientras el backend no la haga.

### F27. Diploma del profesional

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/professional/education/{id}/diploma`
- Caso de uso / modulo: Professional education / upload diploma
- Archivos principales: `ProfessionalEducationController.cs`, `ProfessionalEducationService.cs`, `FileProcessingService.cs`, `UserStorageQuotaService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| file | archivo | Si | Editar | max 10 MB | - | `application/pdf`, `image/jpeg`, `image/png`, `image/webp`; null no; vacio no | Sube diploma PDF o imagen | `No se recibió ningún archivo.`, errores de validacion de archivo, cuota y storage |

3. Reglas de negocio adicionales

- Requiere ownership del registro academico.
- Valida MIME, extension, contenido y cuota.
- Si no hay diploma al borrar en otro endpoint: `No hay diploma adjunto para eliminar.`

4. Observaciones para frontend

- Separar errores por peso, formato y cuota.

### F28. Actualizacion de solicitudes por profesional

1. Endpoint
- Metodo: `PATCH`
- Ruta completa: `/api/professional/requests/{id}`
- Caso de uso / modulo: Service requests / gestion profesional
- Archivos principales: `RequestsController.cs`, `UpdateRequestDtos.cs`, `ProfessionalRequestsService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| status | enum | Si | Editar | - | - | `RequestStatus` | Estado de la solicitud | `El estado es requerido` |
| professionalNotes | string | No | Editar | - | max 500 | null si; whitespace no actualiza; no clear explicito | Notas del profesional | `Las notas no pueden exceder 500 caracteres` |

3. Reglas de negocio adicionales

- Ownership obligatorio; si no, `No tiene permiso para actualizar esta solicitud`.
- Estados permitidos para profesional: `Contacted`, `InProgress`, `Completed`, `Rejected`, `Cancelled`.
- No permite volver a `Pending`: `No puede cambiar el estado a Pendiente`.

4. Observaciones para frontend

- Mostrar un selector limitado a estados permitidos.
- Si la UI permite borrar notas, hoy no hay clear explicito.

### F29. Crear atencion medica

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/professional/patients/{patientProfileId}/encounters`
- Caso de uso / modulo: Professional history
- Archivos principales: `ProfessionalHistoryController.cs`, `ProfessionalHistoryDtos.cs`, `ProfessionalHistoryService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| summary | string | No | Crear | - | max 200 | null si | Resumen breve | `MaxLength(200)` |
| initialNote | string | Si | Crear | - | max 20000 | null no; empty no por `[Required]` | Nota clinica inicial | `[Required]`, `MaxLength(20000)` |
| noteTitle | string | No | Crear | - | max 100 | null si | Titulo opcional de nota | `MaxLength(100)` |
| appointmentId | `Guid?` | No | Crear | - | - | null si | Cita asociada opcional | - |

3. Reglas de negocio adicionales

- Requiere perfil profesional y relacion previa con el paciente.
- Si no hay relacion: `No tienes acceso a este paciente`.
- Crea encounter en estado `Draft`.

4. Observaciones para frontend

- `initialNote` debe ser obligatorio visualmente.
- Si la relacion paciente-profesional no existe, el frontend debe esperar 403.

### F30. Editar atencion medica draft

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/professional/encounters/{encounterId}`
- Caso de uso / modulo: Professional history
- Archivos principales: `ProfessionalHistoryController.cs`, `ProfessionalHistoryDtos.cs`, `ProfessionalHistoryService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| summary | string | No | Editar | - | max 200 | null si; null = mantener | Resumen | `MaxLength(200)` |
| initialNote | string | No | Editar | - | max 20000 | null si; null = mantener | Nota inicial | `MaxLength(20000)` |

3. Reglas de negocio adicionales

- Solo autor puede editar.
- Solo estado `Draft` es editable.
- Mensajes:
  - `Atención médica no encontrada`
  - `Solo puedes editar tus propias atenciones`
  - `Solo puedes editar atenciones en estado borrador`

4. Observaciones para frontend

- Si la atencion ya fue cerrada, bloquear edicion en UI.

### F31. Agregar adenda

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/professional/encounters/{encounterId}/addendum`
- Caso de uso / modulo: Professional history
- Archivos principales: `ProfessionalHistoryController.cs`, `ProfessionalHistoryDtos.cs`, `ProfessionalHistoryService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| text | string | Si | Editar | - | max 20000 | null no; empty no | Texto de la adenda | `[Required]`, `MaxLength(20000)` |
| title | string | No | Editar | - | max 100 | null si | Titulo opcional | `MaxLength(100)` |

3. Reglas de negocio adicionales

- Solo autor puede agregar adendas.
- Solo en encounters `Closed`: `Solo puedes agregar adendas a atenciones cerradas`.

4. Observaciones para frontend

- Ocultar este formulario si la atencion no esta cerrada.

### F32. Solicitud publica a profesional

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/public/requests`
- Caso de uso / modulo: Public directory / lead
- Archivos principales: `PublicRequestsController.cs`, `CreateServiceRequestDto.cs`, `PublicDirectoryService.cs`, `DBContext.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| profileId | Guid | Si | Crear | - | - | null no | Profesional de destino | `El perfil del profesional es requerido` |
| serviceId | `Guid?` | No | Crear | - | - | null si | Servicio especifico opcional | - |
| clientName | string | Si | Crear | - | max 100 DTO / 150 DB | null no; empty no | Tu nombre | `El nombre es requerido` |
| clientEmail | string | Si | Crear | - | max 150 DTO / 100 DB | email; null no | Tu email | `El email es requerido`, `El formato del email no es válido` |
| clientPhone | string | No | Crear | - | max 20 | `Phone`; null si | Tu telefono | `El formato del teléfono no es válido` |
| message | string | Si | Crear | - | min 10 / max 1000 DTO / 2000 DB | null no; empty no | Cuentale al profesional que necesitas | `El mensaje es requerido`, `El mensaje debe tener al menos 10 caracteres`, `El mensaje no puede exceder 1000 caracteres` |

3. Reglas de negocio adicionales

- `profileId` debe existir y estar activo.
- Si llega `serviceId`, debe pertenecer a ese perfil.
- Mensaje de exito: `Tu solicitud ha sido enviada exitosamente. El profesional se pondrá en contacto contigo pronto.`

4. Observaciones para frontend

- Prioridad alta: restringir email a 100 si no se corrige DB.
- Validar `message >= 10` antes de enviar.

### F33. Favoritos publicos

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/public/favorites`
- Caso de uso / modulo: Favorites
- Archivos principales: `FavoriteController.cs`, `FavoriteDto.cs`, `FavoriteService.cs`, `ServiceBase.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| id | Guid | No efectivo | Crear | - | - | el servicio base mapea DTO completo | No deberia venir desde frontend | sin validacion |
| userId | Guid | Si funcionalmente | Crear | - | - | null no esperado, pero no hay `[Required]` | Usuario favorito | sin validacion |

3. Reglas de negocio adicionales

- No hay validaciones declarativas.
- No hay auth en controller.
- No se observa regla de ownership ni unicidad.

4. Observaciones para frontend

- Hallazgo critico: contrato inseguro y poco definido para un formulario real.
- No usar este endpoint desde frontend sin revisar primero seguridad y ownership.

### F34. Instituciones (catalogo)

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/catalog/institutions`, `/api/catalog/institutions/{id}`
- Caso de uso / modulo: Catalog / institutions
- Archivos principales: `InstitutionsController.cs`, `InstitutionDto.cs`, `InstitutionService.cs`, `DBContext.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| name | string | Si | Ambos | - | max 150 | null no; empty no | Nombre de la institucion | `Name is required` |
| code | string | No | Ambos | - | max 30 | null si | Codigo unico opcional | `Code cannot exceed 30 characters` |
| countryId | `Guid?` | No | Ambos | - | - | null si | Pais opcional | - |
| cityId | `Guid?` | No | Ambos | - | - | null si | Ciudad opcional | - |
| isActive | bool | No en create / Si funcional en update | Ambos | - | - | create default true | Estado | - |

3. Reglas de negocio adicionales

- `code` debe ser unico si se informa.
- No se valida que `countryId` o `cityId` existan ni que la ciudad pertenezca al pais.

4. Observaciones para frontend

- Validar unicidad solo via backend.
- `name` obligatorio visual en ambos casos.

### F35. Catalogo de especialidades (admin)

1. Endpoint
- Metodo: `POST` y `PUT`
- Ruta completa: `/api/admin/specialties`, `/api/admin/specialties/{id}`
- Caso de uso / modulo: Admin specialties
- Archivos principales: `AdminSpecialtiesController.cs`, `SpecialtyAdminDto.cs`, `AdminSpecialtiesService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| name | string | Si | Ambos | - | max 100 | null no; empty no; service hace trim | Nombre de la especialidad | `Name is required`, `Name cannot exceed 100 characters` |
| description | string | No | Ambos | - | max 500 | null si; empty -> null | Descripcion opcional | `Description cannot exceed 500 characters` |
| sortOrder | int | No | Ambos | >= 0 | - | create default 0 | Orden | `SortOrder must be greater than or equal to 0` |
| isActive | bool | No en create / Si funcional en update | Ambos | - | - | create default true | Estado | - |

3. Reglas de negocio adicionales

- No permite nombre duplicado: `A specialty with name '{name}' already exists`.

4. Observaciones para frontend

- `name` obligatorio y unico.

### F36. Moderacion admin de propuestas de especialidad

1. Endpoint
- Metodo: `POST`
- Ruta completa:
  - `/api/admin/specialties/proposals/{proposalId}/approve`
  - `/api/admin/specialties/proposals/{proposalId}/merge/{existingSpecialtyId}`
  - `/api/admin/specialties/proposals/{proposalId}/reject`
- Caso de uso / modulo: Admin specialties / proposals
- Archivos principales: `AdminSpecialtiesController.cs`, `SpecialtyProposalDtos.cs`, `AdminSpecialtiesService.cs`

2. Campos del request

Approve:

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| officialName | string | No | Editar | - | max 100 | si falta usa `ProposedName` | Nombre oficial final | `MaxLength(100)` |
| description | string | No | Editar | - | max 500 | null si | Descripcion final | `MaxLength(500)` |
| adminNotes | string | No | Editar | - | max 500 | null si | Nota interna | `MaxLength(500)` |

Merge / Reject:

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| adminNotes | string | No | Editar | - | max 500 | null si | Nota interna | `MaxLength(500)` |

3. Reglas de negocio adicionales

- Solo proposals `Pending`.
- `approve` crea especialidad y asigna a todos los perfiles con el mismo nombre normalizado.
- `merge` enlaza con especialidad existente y asigna tambien en lote.
- `reject` solo rechaza la proposal actual.

4. Observaciones para frontend

- Si el admin cambia `officialName`, seguir validando duplicados solo en backend.
- Estos formularios son buenos candidatos a modales de moderacion.

### F37. Flags de perfil profesional por admin

1. Endpoint
- Metodo: `PATCH`
- Ruta completa: `/api/admin/professionals/{id}`
- Caso de uso / modulo: Admin professionals / moderation flags
- Archivos principales: `AdminProfessionalsController.cs`, `AdminProfessionalDtos.cs`, `AdminProfessionalsService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| isActive | `bool?` | No | Editar | - | - | null si | Visibilidad/activo | - |
| isVerified | `bool?` | No | Editar | - | - | null si | Verificado | - |
| isFeatured | `bool?` | No | Editar | - | - | null si | Destacado | - |
| adminNotes | `string?` | No | Editar | - | max 500 | null si | Nota admin | `Las notas de admin no pueden exceder 500 caracteres` |

3. Reglas de negocio adicionales

- Controller valida `adminNotes <= 500`.
- Si el perfil no existe: `Perfil profesional no encontrado`.

4. Observaciones para frontend

- `PATCH` real; enviar solo campos cambiados.

### F38. Workflow admin de aprobacion / rechazo / activacion profesional

1. Endpoint
- Metodo: `POST`
- Ruta completa:
  - `/api/admin/professionals/{id}/approve`
  - `/api/admin/professionals/{id}/reject`
  - `/api/admin/professionals/{id}/activate`
- Caso de uso / modulo: Admin professionals / actions
- Archivos principales: `AdminProfessionalsController.cs`, `AdminProfessionalDtos.cs`

2. Campos del request

Approve / Activate (`ApproveProfessionalDto`)

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| adminNotes | string | No | Editar | - | no anotado | null si | Nota admin | sin validacion declarativa propia |
| isFeatured | bool | No | Editar | - | - | default false; solo aplica en approve | Destacar perfil | - |

Reject (`RejectProfessionalDto`)

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| reason | string | No | Editar | - | no anotado | null si | Motivo de rechazo | sin validacion declarativa |

3. Reglas de negocio adicionales

- `approve` fuerza `IsActive=true` e `IsVerified=true`.
- `reject` fuerza `IsActive=false`, `IsVerified=false`, y construye `AdminNotes`.
- `activate` solo cambia `IsActive=true`.
- No hay limites declarativos para `reason` ni `adminNotes` en estos DTOs; dependen indirectamente del endpoint base si luego se reutiliza.

4. Observaciones para frontend

- Hallazgo: contratos sin `MaxLength`; conviene limitar `reason/adminNotes` en FE a 500 por consistencia con otros endpoints.

### F39. Asignacion admin de especialidades a profesional

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/admin/professionals/{id}/specialties`
- Caso de uso / modulo: Admin professionals / specialties
- Archivos principales: `AdminProfessionalsController.cs`, `ProfessionalSpecialtyDtos.cs`, `ProfessionalProfileRepository.cs`

2. Campos del request

Body real: lista cruda `List<AssignSpecialtyDto>`

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| specialties[].specialtyId | Guid | Si | Editar | - | - | null no | Especialidad | `SpecialtyId is required` |
| specialties[].isPrimary | bool | No | Editar | - | - | default false | Principal | - |

3. Reglas de negocio adicionales

- Controller exige al menos 1 y maximo 10 items.
- Si hay mas de una primaria: `Only one specialty can be marked as primary`.
- Repositorio valida perfil existente y que todos los IDs existan.
- Inconsistencia: existe `AssignProfessionalSpecialtiesDto` con `MinLength(1)`, pero este endpoint no la usa; recibe lista cruda.

4. Observaciones para frontend

- Limitar 10.
- Validar una sola primaria.

### F40. Moderacion admin de servicios

1. Endpoint
- Metodo: `PATCH`
- Ruta completa: `/api/admin/services/{id}`
- Caso de uso / modulo: Admin services
- Archivos principales: `AdminServicesController.cs`, `AdminProfessionalDtos.cs`, `AdminServicesService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| isActive | `bool?` | No | Editar | - | - | null si | Activar/desactivar | - |
| sortOrder | `int?` | No | Editar | - | - | null si | Orden | - |

3. Reglas de negocio adicionales

- Si servicio no existe: controller devuelve 404.

4. Observaciones para frontend

- Formulario simple de moderacion; sin validaciones declarativas adicionales.

### F41. Moderacion admin de solicitudes

1. Endpoint
- Metodo: `PATCH`
- Ruta completa: `/api/admin/requests/{id}`
- Caso de uso / modulo: Admin requests
- Archivos principales: `AdminRequestsController.cs`, `UpdateRequestDtos.cs`, `AdminRequestsService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| status | `RequestStatus?` | No | Editar | - | - | null si; solo `Rejected` permitido | Estado | `Admin solo puede cambiar estado a Rechazado` |
| adminNotes | string | No | Editar | - | max 500 | null si; whitespace no actualiza | Nota admin | `Las notas no pueden exceder 500 caracteres` |

3. Reglas de negocio adicionales

- Si no existe solicitud: 404.
- No hay clear explicito de notas.

4. Observaciones para frontend

- Limitar selector a `Rejected` si se usa este endpoint.

### F42. Alta admin de usuarios (Auth flow)

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/admin/users`
- Caso de uso / modulo: Admin users (Auth)
- Archivos principales: `AdminUsersController.cs`, `UserManagementDtos.cs`, `UserService.cs`, `Program.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| email | string | Si | Crear | - | max 256 | email | Email del usuario | `El email es requerido`, `El formato del email no es valido` |
| password | string | Si | Crear | minimo real 8 por Identity | min 6 DTO / max 100 | complejidad real Identity | Contraseña temporal/segura | `La contraseña es requerida`, `La contraseña debe tener al menos 6 caracteres` + errores Identity |
| firstName | string | Si | Crear | - | max 100 | null no | Nombre | `El nombre es requerido` |
| lastName | string | Si | Crear | - | max 100 | null no | Apellido | `El apellido es requerido` |
| phoneNumber | string | No | Crear | - | max 20 | `Phone`; null si | Telefono opcional | `El formato del teléfono no es valido` |
| roles | lista string | No condicional | Crear | - | - | si vacia, usa `Client` por defecto | Roles iniciales | si algun rol no existe -> `El rol '{role}' no existe` |
| emailConfirmed | bool | No | Crear | - | - | default true | Confirmar email | - |

3. Reglas de negocio adicionales

- Email unico.
- Si `roles` vacio, asigna `Client`.
- Autocrea perfil de paciente.

4. Observaciones para frontend

- Misma inconsistencia de password que en registro publico.
- Si UI no requiere roles, puede omitirlos y backend pondra `Client`.

### F43. Reemplazo admin de roles (Auth flow)

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/admin/users/{id}/roles`
- Caso de uso / modulo: Admin users (Auth)
- Archivos principales: `AdminUsersController.cs`, `UserManagementDtos.cs`, `UserService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| roles | lista string | Si | Editar | al menos 1 | - | reemplaza lista completa | Roles del usuario | `Debe especificar al menos un rol`, `El rol '{role}' no existe` |

3. Reglas de negocio adicionales

- Reemplaza completamente los roles actuales.
- Si agrega `Professional` o `Client`, asegura perfil de paciente.

4. Observaciones para frontend

- Confirmar UX de reemplazo total, no incremental.

### F44. Alta admin RBAC de usuarios

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/admin/rbac/users`
- Caso de uso / modulo: Admin RBAC users
- Archivos principales: `AdminRbacUsersController.cs`, `RbacDtos.cs`, `AdminUsersService.cs`, `Program.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| userName | string | Si funcionalmente | Crear | - | - | no tiene `DataAnnotations` | Nombre de usuario | validado por service: unico |
| email | string | Si funcionalmente | Crear | - | - | no tiene `DataAnnotations` | Email | validado por service: unico; errores Identity adicionales |
| password | string | Si funcionalmente | Crear | minimo real 8 por Identity | - | sin `DataAnnotations` | Contraseña | errores Identity |
| firstName | string | Si funcionalmente | Crear | - | - | sin `DataAnnotations` | Nombre | sin mensaje declarativo |
| lastName | string | Si funcionalmente | Crear | - | - | sin `DataAnnotations` | Apellido | sin mensaje declarativo |
| phoneNumber | string | No | Crear | - | - | sin `DataAnnotations` | Telefono opcional | - |
| roles | lista string | No | Crear | - | - | si llegan, deben existir | Roles | `El rol '{role}' no existe` |

3. Reglas de negocio adicionales

- Username unico.
- Email unico.
- Si falla asignacion de roles, hace rollback del usuario.
- Autocrea perfil de paciente.

4. Observaciones para frontend

- Hallazgo: este flujo no tiene `DataAnnotations`; toda la validacion depende del service/Identity.
- Duplicacion funcional con `/api/admin/users`.

### F45. Edicion admin RBAC de usuario

1. Endpoint
- Metodo: `PATCH`
- Ruta completa: `/api/admin/rbac/users/{userId}`
- Caso de uso / modulo: Admin RBAC users
- Archivos principales: `AdminRbacUsersController.cs`, `RbacDtos.cs`, `AdminUsersService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| firstName | `string?` | No | Editar | - | - | null si | Nombre | sin `DataAnnotations` |
| lastName | `string?` | No | Editar | - | - | null si | Apellido | sin `DataAnnotations` |
| email | `string?` | No | Editar | - | - | null si | Email | service valida unicidad si cambia |
| phoneNumber | `string?` | No | Editar | - | - | null si | Telefono | - |
| lockoutEnabled | `bool?` | No | Editar | - | - | null si | Habilitar lockout | - |
| emailConfirmed | `bool?` | No | Editar | - | - | null si | Confirmar email | - |

3. Reglas de negocio adicionales

- Email unico si cambia.
- Sincroniza perfil de paciente (`fullName`, `phone`, `email`) despues del update.

4. Observaciones para frontend

- Como es `PATCH`, enviar solo campos cambiados.

### F46. Roles admin RBAC incrementales

1. Endpoint
- Metodo: `PATCH`
- Ruta completa: `/api/admin/rbac/users/{userId}/roles`
- Caso de uso / modulo: Admin RBAC users
- Archivos principales: `AdminRbacUsersController.cs`, `RbacDtos.cs`, `AdminUsersService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rolesToAdd | lista string | No | Editar | - | - | default lista vacia | Roles a agregar | service valida existencia |
| rolesToRemove | lista string | No | Editar | - | - | default lista vacia | Roles a remover | service valida existencia |

3. Reglas de negocio adicionales

- Todos los roles enviados deben existir.
- Si agrega `Professional` o `Client`, asegura perfil de paciente.

4. Observaciones para frontend

- Este formulario es incremental, a diferencia de `/api/admin/users/{id}/roles` que reemplaza todo.

### F47. Lock / unlock admin RBAC

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/admin/rbac/users/{userId}/lock`
- Caso de uso / modulo: Admin RBAC users / lock
- Archivos principales: `AdminRbacUsersController.cs`, `RbacDtos.cs`, `AdminUsersService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| locked | bool | Si | Editar | - | - | true=lock, false=unlock | Bloquear usuario | no tiene `DataAnnotations` |

3. Reglas de negocio adicionales

- Internamente solo mapea a `LockoutEnabled = dto.Locked`.
- No configura `LockoutEnd`.

4. Observaciones para frontend

- Prioridad alta: no prometer "bloqueo inmediato" hasta corregir backend.

### F48. Crear rol

1. Endpoint
- Metodo: `POST`
- Ruta completa: `/api/admin/roles`
- Caso de uso / modulo: Admin roles
- Archivos principales: `AdminRolesController.cs`, `RbacDtos.cs`, `AdminRolesService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| name | string | Si funcionalmente | Crear | - | - | sin `DataAnnotations` | Nombre del rol | `El rol '{name}' ya existe` o errores Identity |
| description | string | No | Crear | - | - | default empty | Descripcion | - |

3. Reglas de negocio adicionales

- No permite nombre duplicado.

4. Observaciones para frontend

- Como no hay `DataAnnotations`, conviene validar nombre no vacio y trim desde UI.

### F49. Editar rol

1. Endpoint
- Metodo: `PATCH`
- Ruta completa: `/api/admin/roles/{roleId}`
- Caso de uso / modulo: Admin roles
- Archivos principales: `AdminRolesController.cs`, `RbacDtos.cs`, `AdminRolesService.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| name | `string?` | No | Editar | - | - | null si | Nuevo nombre del rol | `El nombre de rol '{name}' ya está en uso` |
| description | `string?` | No | Editar | - | - | null si; null = no cambia | Descripcion | - |

3. Reglas de negocio adicionales

- No permite modificar roles del sistema: `SuperAdmin`, `Admin`, `Professional`, `Client`.
- Si no existe rol: `Rol no encontrado`.

4. Observaciones para frontend

- Si el rol es de sistema, ocultar este formulario.

### F50. Permisos de rol

1. Endpoint
- Metodo: `PUT`
- Ruta completa: `/api/admin/roles/{roleId}/permissions`
- Caso de uso / modulo: Admin roles / permisos
- Archivos principales: `AdminRolesController.cs`, `RbacDtos.cs`, `AdminRolesService.cs`, `CC.Domain/Constants/PermissionConstants.cs`

2. Campos del request

| Campo | Tipo | Obligatorio | Contexto | Min/Max | Longitud | Formato / default / null / empty / condiciones | Mensaje funcional sugerido | Backend actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| permissions | lista string | Si funcionalmente | Editar | - | - | lista puede ir vacia para limpiar permisos | Permisos del rol | `Permisos inválidos: ...` |

3. Reglas de negocio adicionales

- Valida que cada permiso exista en `PermissionConstants.GetAllPermissions()`.
- Lista vacia limpia permisos actuales.
- Si el rol no existe: `Rol no encontrado`.

4. Observaciones para frontend

- La UI debe trabajar con un catalogo de permisos backend-driven para no enviar nombres invalidos.

## Resumen de prioridades altas para frontend

- Alinear password UI con la policy real de Identity, no con `MinLength(6)`.
- En perfil profesional, aplicar maximos reales de DB: `businessName 150`, `slug 150`, `address 300`.
- En servicios profesionales, limitar `name` a 150 hasta corregir DB/DTO.
- En solicitudes publicas, limitar `clientEmail` a 100 hasta corregir DB.
- No confiar en que el backend valide coherencia pais/ciudad en perfiles.
- No confiar en `institutionId` de excepciones de disponibilidad; hoy no se persiste.
- No confiar en `status` libre de medicamentos; validar enum en frontend.
- No usar `POST /api/public/favorites` desde FE sin revisar seguridad.
- Si el frontend expone lock/unlock admin, advertir que el backend hoy no hace lockout completo.
