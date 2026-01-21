# API CONTRACT — BackDirectory

> **Versión:** 1.0.0  
> **Última actualización:** 2026-01-15  
> **Audiencia:** Equipo Frontend

---

## 1. Base

### URLs

| Ambiente | Base URL |
|----------|----------|
| Development | `http://localhost:5000` |
| QA | `https://api-qa.directory.example.com` |
| Production | `https://api.directory.example.com` |

### Headers Requeridos

```http
Content-Type: application/json
Accept: application/json
```

### Prefijo API

Todos los endpoints usan el prefijo `/api`.

```
https://api.directory.example.com/api/auth/me
```

---

## 2. Autenticación

La API usa **JWT Bearer Token** para autenticación.

### Header de Autorización

```http
Authorization: Bearer <token>
```

---

### POST /api/auth/login

Autentica un usuario y retorna un JWT.

**Auth requerida:** No

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Response 200 OK:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-01-16T10:30:00Z",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "usuario@ejemplo.com",
    "userName": "usuario",
    "roles": ["Professional"]
  }
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Credenciales inválidas o campos faltantes |
| 401 | Email o contraseña incorrectos |

---

### GET /api/auth/me

Obtiene información del usuario autenticado actual, incluyendo si tiene perfil profesional.

**Auth requerida:** Sí (cualquier rol)

**Response 200 OK:**

```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userName": "maria.garcia",
  "email": "maria@ejemplo.com",
  "roles": ["Professional"],
  "hasProfessionalProfile": true,
  "professionalProfileId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "professionalProfileSlug": "maria-estilista"
}
```

**Notas:**
- `hasProfessionalProfile` indica si el usuario ya completó el onboarding.
- `professionalProfileId` y `professionalProfileSlug` son `null` si no tiene perfil.
- `roles` es un array que puede contener: `Client`, `Professional`, `Admin`, `SuperAdmin`.

**Errores:**

| Código | Descripción |
|--------|-------------|
| 401 | Token inválido o expirado |

---

## 3. Public Endpoints

Estos endpoints no requieren autenticación.

---

### GET /api/public/pages/home

Obtiene datos para la página de inicio.

**Auth requerida:** No

**Query Parameters:** Ninguno

**Response 200 OK:**

```json
{
  "featuredCategories": [
    {
      "id": "cat-001",
      "name": "Salud",
      "slug": "salud",
      "icon": "fa-heartbeat",
      "professionalCount": 145
    }
  ],
  "featuredProfessionals": [
    {
      "id": "prof-001",
      "slug": "dr-juan-perez",
      "businessName": "Dr. Juan Pérez",
      "profileImageUrl": "https://cdn.example.com/images/profile1.jpg",
      "categoryName": "Medicina General",
      "categorySlug": "medicina-general",
      "cityName": "Bogotá",
      "citySlug": "bogota",
      "isVerified": true,
      "isFeatured": true,
      "priceFrom": 80000
    }
  ],
  "popularCities": [
    {
      "id": "city-001",
      "name": "Bogotá",
      "slug": "bogota",
      "stateRegion": "Cundinamarca",
      "countryName": "Colombia",
      "countrySlug": "colombia",
      "professionalCount": 523
    }
  ],
  "totals": {
    "totalProfessionals": 1250,
    "totalCategories": 24,
    "totalCities": 15
  },
  "seo": {
    "title": "Directorio de Profesionales | Encuentra expertos cerca de ti",
    "description": "Encuentra médicos, abogados, psicólogos...",
    "canonical": "/"
  }
}
```

---

### GET /api/public/pages/search

Búsqueda de profesionales con filtros y paginación.

**Auth requerida:** No

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `q` | string | No | - | Texto de búsqueda (nombre, servicio) |
| `category` | string | No | - | Slug de categoría |
| `city` | string | No | - | Slug de ciudad |
| `country` | string | No | - | Slug o ISO2 del país |
| `page` | int | No | 1 | Número de página |
| `pageSize` | int | No | 20 | Items por página (máx 50) |

**Ejemplo:**

```
GET /api/public/pages/search?category=medicina&city=bogota&page=1&pageSize=10
```

**Response 200 OK:**

```json
{
  "professionals": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "slug": "dr-juan-perez",
      "businessName": "Dr. Juan Pérez",
      "profileImageUrl": "https://cdn.example.com/images/profile1.jpg",
      "categoryName": "Medicina General",
      "categorySlug": "medicina-general",
      "cityName": "Bogotá",
      "citySlug": "bogota",
      "isVerified": true,
      "isFeatured": false,
      "priceFrom": 80000
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 145,
    "totalPages": 15,
    "hasPrevious": false,
    "hasNext": true
  },
  "filters": {
    "categories": [
      { "slug": "medicina-general", "name": "Medicina General", "count": 45 }
    ],
    "cities": [
      { "slug": "bogota", "name": "Bogotá", "count": 120 }
    ],
    "priceRange": { "min": 30000, "max": 500000 }
  },
  "appliedFilters": {
    "category": "medicina",
    "city": "bogota",
    "q": null
  },
  "seo": {
    "title": "Médicos en Bogotá | Directorio",
    "description": "Encuentra médicos verificados en Bogotá...",
    "canonical": "/buscar/medicina/bogota"
  }
}
```

**Notas:**
- Los resultados se ordenan: Featured > Verified > ViewCount > DateCreated.
- Solo retorna perfiles con `IsActive=true`.

---

### GET /api/public/pages/profile/{slug}

Obtiene el detalle de un perfil profesional.

**Auth requerida:** No

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `slug` | string | Slug único del profesional |

**Ejemplo:**

```
GET /api/public/pages/profile/dr-juan-perez
```

**Response 200 OK:**

```json
{
  "profile": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "slug": "dr-juan-perez",
    "businessName": "Dr. Juan Pérez",
    "description": "Médico general con 15 años de experiencia...",
    "phone": "+573001234567",
    "whatsApp": "+573001234567",
    "email": "contacto@drjuanperez.com",
    "address": "Calle 100 #15-20, Consultorio 302",
    "profileImageUrl": "https://cdn.example.com/images/profile1.jpg",
    "isVerified": true,
    "isFeatured": true,
    "viewCount": 1523,
    "categoryId": "cat-001",
    "categoryName": "Medicina General",
    "categorySlug": "medicina-general",
    "countryId": "co-001",
    "countryName": "Colombia",
    "cityId": "city-001",
    "cityName": "Bogotá",
    "citySlug": "bogota",
    "dateCreated": "2025-06-15T10:30:00Z",
    "dateUpdated": "2026-01-10T14:20:00Z"
  },
  "services": [
    {
      "id": "svc-001",
      "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Consulta General",
      "description": "Evaluación médica completa",
      "priceFrom": 80000,
      "priceTo": 120000,
      "duration": "45 min",
      "isActive": true,
      "sortOrder": 0
    }
  ],
  "relatedProfessionals": [
    {
      "id": "prof-002",
      "slug": "dra-ana-martinez",
      "businessName": "Dra. Ana Martínez",
      "profileImageUrl": "https://cdn.example.com/images/profile2.jpg",
      "categoryName": "Medicina General",
      "categorySlug": "medicina-general",
      "cityName": "Bogotá",
      "citySlug": "bogota",
      "isVerified": true,
      "isFeatured": false,
      "priceFrom": 70000
    }
  ],
  "seo": {
    "title": "Dr. Juan Pérez | Medicina General en Bogotá",
    "description": "Médico general con 15 años de experiencia...",
    "canonical": "/profesional/dr-juan-perez"
  }
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 404 | Perfil no encontrado o inactivo |

---

### GET /api/public/search/suggest

Autocompletado para búsqueda (typeahead).

**Auth requerida:** No

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `q` | string | Sí | - | Texto a buscar (mín 2 chars) |
| `limit` | int | No | 10 | Máximo de sugerencias |

**Ejemplo:**

```
GET /api/public/search/suggest?q=med&limit=5
```

**Response 200 OK:**

```json
{
  "professionals": [
    {
      "id": "prof-001",
      "slug": "dr-juan-perez",
      "businessName": "Dr. Juan Pérez",
      "categoryName": "Medicina General",
      "cityName": "Bogotá"
    }
  ],
  "categories": [
    {
      "slug": "medicina-general",
      "name": "Medicina General",
      "icon": "fa-stethoscope"
    }
  ],
  "services": [
    {
      "name": "Medicina Preventiva",
      "professionalSlug": "dr-juan-perez",
      "professionalName": "Dr. Juan Pérez"
    }
  ]
}
```

**Notas:**
- Retorna vacío si `q` tiene menos de 2 caracteres.
- Búsqueda case-insensitive, ignora acentos.

---

### GET /api/public/metadata

Obtiene catálogos para dropdowns (países, ciudades, categorías).

**Auth requerida:** No

**Response 200 OK:**

```json
{
  "countries": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Colombia",
      "iso2": "CO",
      "slug": "colombia"
    }
  ],
  "cities": [
    {
      "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "name": "Bogotá",
      "slug": "bogota",
      "countryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    {
      "id": "b2c3d4e5-6789-01bc-def0-2345678901bc",
      "name": "Medellín",
      "slug": "medellin",
      "countryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "categories": [
    {
      "id": "cat-001",
      "name": "Salud",
      "slug": "salud",
      "icon": "fa-heartbeat"
    },
    {
      "id": "cat-002",
      "name": "Legal",
      "slug": "legal",
      "icon": "fa-balance-scale"
    }
  ]
}
```

**Notas:**
- Solo retorna items activos.
- Respuesta cacheada por 5 minutos.
- Usar `countryId` de cities para filtrar ciudades por país en el frontend.

---

### POST /api/public/requests

Crea una solicitud de contacto para un profesional.

**Auth requerida:** No

**Request Body:**

```json
{
  "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serviceId": "svc-001",
  "clientName": "Carlos López",
  "clientEmail": "carlos@ejemplo.com",
  "clientPhone": "+573009876543",
  "message": "Quisiera agendar una cita para la próxima semana."
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `profileId` | Guid | Sí | Debe existir y estar activo |
| `serviceId` | Guid | No | Debe pertenecer al profile |
| `clientName` | string | Sí | Max 100 chars |
| `clientEmail` | string | Sí | Email válido, max 150 chars |
| `clientPhone` | string | No | Max 20 chars |
| `message` | string | Sí | Max 1000 chars |

**Response 201 Created:**

```json
{
  "id": "req-001",
  "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "Pending",
  "dateCreated": "2026-01-15T10:30:00Z",
  "message": "Solicitud enviada correctamente"
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Validación fallida (campos requeridos, formato email) |
| 404 | Profile o Service no encontrado |

---

## 4. Professional Endpoints

Requieren autenticación con rol `Professional` o `SuperAdmin`.

---

### GET /api/professional/profile

Obtiene el perfil del profesional autenticado.

**Auth requerida:** Sí (Professional, SuperAdmin)

**Response 200 OK:**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "user-001",
  "businessName": "María Estilista",
  "slug": "maria-estilista",
  "description": "Estilista profesional con 10 años de experiencia...",
  "categoryId": "cat-003",
  "categoryName": "Belleza",
  "categorySlug": "belleza",
  "cityId": "city-001",
  "cityName": "Bogotá",
  "countryId": "co-001",
  "countryName": "Colombia",
  "phone": "+573001234567",
  "whatsApp": "+573001234567",
  "email": "maria@estilista.com",
  "address": "Centro Comercial X, Local 205",
  "profileImageUrl": "https://cdn.example.com/images/maria.jpg",
  "isActive": true,
  "isVerified": false,
  "isFeatured": false,
  "viewCount": 234,
  "dateCreated": "2025-12-01T08:00:00Z",
  "dateUpdated": "2026-01-10T15:30:00Z",
  "servicesCount": 5
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 401 | No autenticado |
| 404 | El usuario no tiene perfil profesional |

---

### POST /api/professional/profile

Crea el perfil profesional (onboarding).

**Auth requerida:** Sí (Professional, SuperAdmin)

**Request Body:**

```json
{
  "businessName": "María Estilista",
  "slug": "maria-estilista",
  "description": "Estilista profesional con 10 años de experiencia...",
  "categoryId": "cat-003",
  "cityId": "city-001",
  "countryId": "co-001",
  "phone": "+573001234567",
  "whatsApp": "+573001234567",
  "email": "maria@estilista.com",
  "address": "Centro Comercial X, Local 205",
  "profileImageUrl": "https://cdn.example.com/images/maria.jpg"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `businessName` | string | Sí | Max 200 chars |
| `slug` | string | No | Max 250, solo `[a-z0-9-]`. Auto-generado si no se envía |
| `description` | string | No | Max 2000 chars |
| `categoryId` | Guid | Sí | Debe existir y estar activo |
| `cityId` | Guid | Sí | Debe existir y estar activo |
| `countryId` | Guid | Sí | Debe existir y estar activo |
| `phone` | string | No | Max 20 chars |
| `whatsApp` | string | No | Max 20 chars |
| `email` | string | No | Email válido, max 100 chars |
| `address` | string | No | Max 500 chars |
| `profileImageUrl` | string | No | URL válida, max 500 chars |

**Response 201 Created:**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "user-001",
  "businessName": "María Estilista",
  "slug": "maria-estilista",
  "...": "..."
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Validación fallida (categoría/ciudad/país inválido) |
| 401 | No autenticado |
| 409 | El usuario ya tiene un perfil profesional |

**Notas:**
- Si `slug` no se envía, se genera desde `businessName`.
- Si el slug ya existe, se agrega sufijo numérico (`maria-estilista-2`).
- `isActive=true`, `isVerified=false`, `isFeatured=false` por defecto.

---

### PUT /api/professional/profile

Actualiza el perfil del profesional autenticado.

**Auth requerida:** Sí (Professional, SuperAdmin)

**Request Body:**

```json
{
  "businessName": "María Estilista Premium",
  "description": "Actualizada descripción...",
  "categoryId": "cat-003",
  "cityId": "city-001",
  "countryId": "co-001",
  "phone": "+573009999999",
  "whatsApp": "+573009999999",
  "email": "nueva@email.com",
  "address": "Nueva dirección",
  "profileImageUrl": "https://cdn.example.com/images/nueva.jpg"
}
```

**Campos NO editables por el profesional:**
- `slug` (inmutable después de creación)
- `isVerified` (solo admin)
- `isFeatured` (solo admin)
- `viewCount` (sistema)

**Response 200 OK:**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "businessName": "María Estilista Premium",
  "...": "..."
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Validación fallida |
| 401 | No autenticado |
| 404 | El usuario no tiene perfil profesional |

---

### GET /api/professional/services

Lista los servicios del profesional autenticado.

**Auth requerida:** Sí (Professional, SuperAdmin)

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `includeInactive` | bool | No | false | Incluir servicios eliminados |

**Response 200 OK:**

```json
[
  {
    "id": "svc-001",
    "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Corte de Cabello",
    "description": "Corte profesional con lavado incluido",
    "priceFrom": 25000,
    "priceTo": 35000,
    "duration": "45 min",
    "isActive": true,
    "sortOrder": 0,
    "dateCreated": "2025-12-15T10:00:00Z",
    "dateUpdated": null
  },
  {
    "id": "svc-002",
    "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Tinte Completo",
    "description": "Tinte con productos premium",
    "priceFrom": 80000,
    "priceTo": 150000,
    "duration": "2 horas",
    "isActive": true,
    "sortOrder": 1,
    "dateCreated": "2025-12-15T10:05:00Z",
    "dateUpdated": "2026-01-05T14:20:00Z"
  }
]
```

**Notas:**
- Ordenados por `sortOrder` ASC, luego `name` ASC.
- Retorna array vacío si el usuario no tiene perfil.

---

### POST /api/professional/services

Crea un nuevo servicio.

**Auth requerida:** Sí (Professional, SuperAdmin)

**Request Body:**

```json
{
  "name": "Manicure",
  "description": "Manicure básico con esmaltado",
  "priceFrom": 20000,
  "priceTo": 30000,
  "duration": "30 min",
  "sortOrder": 2
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `name` | string | Sí | Max 200 chars |
| `description` | string | No | Max 1000 chars |
| `priceFrom` | decimal | No | 0 - 999999.99 |
| `priceTo` | decimal | No | >= priceFrom |
| `duration` | string | No | Max 50 chars |
| `sortOrder` | int | No | Default 0 |

**Response 201 Created:**

```json
{
  "id": "svc-003",
  "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Manicure",
  "description": "Manicure básico con esmaltado",
  "priceFrom": 20000,
  "priceTo": 30000,
  "duration": "30 min",
  "isActive": true,
  "sortOrder": 2,
  "dateCreated": "2026-01-15T11:00:00Z",
  "dateUpdated": null
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Validación fallida (priceTo < priceFrom, etc.) |
| 400 | El usuario no tiene perfil profesional |
| 401 | No autenticado |

---

### PUT /api/professional/services/{id}

Actualiza un servicio existente.

**Auth requerida:** Sí (Professional, SuperAdmin)

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Guid | ID del servicio |

**Request Body:**

```json
{
  "name": "Manicure Premium",
  "description": "Manicure con tratamiento especial",
  "priceFrom": 25000,
  "priceTo": 40000,
  "duration": "45 min",
  "isActive": true,
  "sortOrder": 2
}
```

**Response 200 OK:**

```json
{
  "id": "svc-003",
  "name": "Manicure Premium",
  "...": "..."
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Validación fallida |
| 401 | No autenticado |
| 403 | El servicio no pertenece al usuario |
| 404 | Servicio no encontrado |

---

### DELETE /api/professional/services/{id}

Elimina un servicio (soft delete).

**Auth requerida:** Sí (Professional, SuperAdmin)

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Guid | ID del servicio |

**Response 204 No Content**

**Errores:**

| Código | Descripción |
|--------|-------------|
| 401 | No autenticado |
| 403 | El servicio no pertenece al usuario |
| 404 | Servicio no encontrado |

**Notas:**
- Es un soft delete: el servicio queda con `isActive=false`.
- Se puede recuperar con PUT enviando `isActive: true`.

---

### GET /api/professional/requests

Lista las solicitudes recibidas por el profesional.

**Auth requerida:** Sí (Professional, SuperAdmin)

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | int | No | 1 | Página |
| `pageSize` | int | No | 20 | Items por página |
| `status` | string | No | - | Filtrar por status |
| `from` | datetime | No | - | Fecha desde (ISO 8601) |
| `to` | datetime | No | - | Fecha hasta (ISO 8601) |

**Status values:** `Pending`, `Contacted`, `InProgress`, `Completed`, `Rejected`, `Cancelled`

**Ejemplo:**

```
GET /api/professional/requests?status=Pending&page=1&pageSize=10
```

**Response 200 OK:**

```json
{
  "data": [
    {
      "id": "req-001",
      "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "serviceId": "svc-001",
      "serviceName": "Corte de Cabello",
      "clientName": "Carlos López",
      "clientEmail": "carlos@ejemplo.com",
      "clientPhone": "+573009876543",
      "message": "Quisiera agendar una cita...",
      "status": "Pending",
      "statusName": "Pending",
      "professionalNotes": null,
      "dateCreated": "2026-01-15T10:30:00Z",
      "dateUpdated": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 25,
    "totalPages": 3,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

---

### PATCH /api/professional/requests/{id}

Actualiza el estado de una solicitud.

**Auth requerida:** Sí (Professional, SuperAdmin)

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Guid | ID de la solicitud |

**Request Body:**

```json
{
  "status": "Contacted",
  "professionalNotes": "Llamé al cliente, agendamos para el viernes"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `status` | string | Sí | Ver valores permitidos |
| `professionalNotes` | string | No | Max 500 chars |

**Status permitidos para profesional:**
- `Contacted` - Contactó al cliente
- `InProgress` - En proceso
- `Completed` - Completado
- `Rejected` - Rechazado
- `Cancelled` - Cancelado

**Status NO permitido:**
- `Pending` - No se puede volver a pendiente

**Response 200 OK:**

```json
{
  "id": "req-001",
  "status": "Contacted",
  "professionalNotes": "Llamé al cliente, agendamos para el viernes",
  "dateUpdated": "2026-01-15T14:30:00Z"
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Status inválido o transición no permitida |
| 401 | No autenticado |
| 403 | La solicitud no pertenece al usuario |
| 404 | Solicitud no encontrada |

---

## 5. Admin Endpoints

Requieren autenticación con rol `Admin` o `SuperAdmin`.

---

### GET /api/admin/professionals

Lista todos los perfiles profesionales con filtros.

**Auth requerida:** Sí (Admin, SuperAdmin)

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `status` | string | No | all | `pending`, `active`, `disabled`, `all` |
| `countryId` | Guid | No | - | Filtrar por país |
| `cityId` | Guid | No | - | Filtrar por ciudad |
| `categoryId` | Guid | No | - | Filtrar por categoría |
| `q` | string | No | - | Buscar por nombre o slug |
| `orderBy` | string | No | dateCreated | `dateCreated` o `businessName` |
| `page` | int | No | 1 | Página |
| `pageSize` | int | No | 20 | Items por página |

**Status definitions:**
- `pending`: IsActive=true AND IsVerified=false (pendientes de verificación)
- `active`: IsActive=true AND IsVerified=true (activos y verificados)
- `disabled`: IsActive=false (desactivados)
- `all`: Sin filtro de status

**Ejemplo:**

```
GET /api/admin/professionals?status=pending&page=1
```

**Response 200 OK:**

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "userId": "user-001",
      "slug": "maria-estilista",
      "businessName": "María Estilista",
      "countryId": "co-001",
      "countryName": "Colombia",
      "cityId": "city-001",
      "cityName": "Bogotá",
      "categoryId": "cat-003",
      "categoryName": "Belleza",
      "isActive": true,
      "isVerified": false,
      "isFeatured": false,
      "viewCount": 234,
      "servicesCount": 5,
      "adminNotes": null,
      "dateCreated": "2025-12-01T08:00:00Z",
      "dateUpdated": "2026-01-10T15:30:00Z",
      "email": "maria@estilista.com",
      "phone": "+573001234567"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

---

### GET /api/admin/professionals/{id}

Obtiene detalle completo de un perfil para revisión admin.

**Auth requerida:** Sí (Admin, SuperAdmin)

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Guid | ID del perfil |

**Response 200 OK:**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "user-001",
  "slug": "maria-estilista",
  "businessName": "María Estilista",
  "description": "Estilista profesional...",
  "countryId": "co-001",
  "countryName": "Colombia",
  "cityId": "city-001",
  "cityName": "Bogotá",
  "categoryId": "cat-003",
  "categoryName": "Belleza",
  "isActive": true,
  "isVerified": false,
  "isFeatured": false,
  "viewCount": 234,
  "servicesCount": 5,
  "adminNotes": null,
  "dateCreated": "2025-12-01T08:00:00Z",
  "dateUpdated": "2026-01-10T15:30:00Z",
  "email": "maria@estilista.com",
  "phone": "+573001234567",
  "whatsApp": "+573001234567",
  "address": "Centro Comercial X, Local 205",
  "profileImageUrl": "https://cdn.example.com/images/maria.jpg",
  "services": [
    {
      "id": "svc-001",
      "name": "Corte de Cabello",
      "isActive": true,
      "...": "..."
    }
  ],
  "requestCountsByStatus": {
    "Pending": 3,
    "Contacted": 5,
    "Completed": 12,
    "Rejected": 1
  }
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 401 | No autenticado |
| 403 | No tiene rol Admin |
| 404 | Perfil no encontrado |

---

### PATCH /api/admin/professionals/{id}

Modera un perfil profesional (verificar, destacar, desactivar).

**Auth requerida:** Sí (Admin, SuperAdmin)

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Guid | ID del perfil |

**Request Body:**

```json
{
  "isActive": true,
  "isVerified": true,
  "isFeatured": false,
  "adminNotes": "Verificado con documentación completa"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `isActive` | bool | No | Activar/desactivar visibilidad pública |
| `isVerified` | bool | No | Marcar como verificado |
| `isFeatured` | bool | No | Destacar en home/búsqueda |
| `adminNotes` | string | No | Notas internas (max 500 chars) |

**Response 200 OK:**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "isActive": true,
  "isVerified": true,
  "isFeatured": false,
  "adminNotes": "Verificado con documentación completa",
  "dateUpdated": "2026-01-15T16:00:00Z"
}
```

**Efectos:**
- `isActive=false` → El perfil desaparece de búsqueda pública y perfil público retorna 404.
- `isVerified=true` → Aparece badge de verificado.
- `isFeatured=true` → Aparece en sección destacados del home.

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | adminNotes excede 500 caracteres |
| 401 | No autenticado |
| 403 | No tiene rol Admin |
| 404 | Perfil no encontrado |

---

### PATCH /api/admin/services/{id}

Modera un servicio (desactivar contenido inapropiado).

**Auth requerida:** Sí (Admin, SuperAdmin)

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Guid | ID del servicio |

**Request Body:**

```json
{
  "isActive": false,
  "sortOrder": 0
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `isActive` | bool | No | Activar/desactivar servicio |
| `sortOrder` | int | No | Orden de visualización |

**Response 200 OK:**

```json
{
  "id": "svc-001",
  "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Servicio X",
  "isActive": false,
  "sortOrder": 0,
  "dateUpdated": "2026-01-15T16:05:00Z",
  "...": "..."
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 401 | No autenticado |
| 403 | No tiene rol Admin |
| 404 | Servicio no encontrado |

---

### GET /api/admin/requests

Lista todas las solicitudes de contacto.

**Auth requerida:** Sí (Admin, SuperAdmin)

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | int | No | 1 | Página |
| `pageSize` | int | No | 20 | Items por página |
| `status` | string | No | - | Filtrar por status |
| `from` | datetime | No | - | Fecha desde |
| `to` | datetime | No | - | Fecha hasta |

**Response 200 OK:**

```json
{
  "data": [
    {
      "id": "req-001",
      "profileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "serviceId": "svc-001",
      "serviceName": "Corte de Cabello",
      "clientName": "Carlos López",
      "clientEmail": "carlos@ejemplo.com",
      "clientPhone": "+573009876543",
      "message": "Quisiera agendar...",
      "status": "Pending",
      "statusName": "Pending",
      "professionalNotes": null,
      "dateCreated": "2026-01-15T10:30:00Z",
      "dateUpdated": null,
      "profileBusinessName": "María Estilista",
      "profileSlug": "maria-estilista",
      "profileUserId": "user-001",
      "adminNotes": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

---

### PATCH /api/admin/requests/{id}

Modera una solicitud (rechazar, agregar notas).

**Auth requerida:** Sí (Admin, SuperAdmin)

**Path Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | Guid | ID de la solicitud |

**Request Body:**

```json
{
  "status": "Rejected",
  "adminNotes": "Solicitud spam detectada"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `status` | string | No | Solo `Rejected` permitido para admin |
| `adminNotes` | string | No | Notas de moderación (max 500 chars) |

**Response 200 OK:**

```json
{
  "id": "req-001",
  "status": "Rejected",
  "adminNotes": "Solicitud spam detectada",
  "dateUpdated": "2026-01-15T16:10:00Z"
}
```

**Errores:**

| Código | Descripción |
|--------|-------------|
| 400 | Status diferente a "Rejected" |
| 401 | No autenticado |
| 403 | No tiene rol Admin |
| 404 | Solicitud no encontrada |

---

### GET /api/admin/catalogs

Obtiene catálogos con estadísticas (incluye inactivos).

**Auth requerida:** Sí (Admin, SuperAdmin)

**Response 200 OK:**

```json
{
  "countries": [
    {
      "id": "co-001",
      "name": "Colombia",
      "iso2": "CO",
      "slug": "colombia",
      "isActive": true,
      "citiesCount": 5
    }
  ],
  "cities": [
    {
      "id": "city-001",
      "name": "Bogotá",
      "slug": "bogota",
      "countryId": "co-001",
      "countryName": "Colombia",
      "isActive": true,
      "profilesCount": 523
    }
  ],
  "categories": [
    {
      "id": "cat-001",
      "name": "Salud",
      "slug": "salud",
      "icon": "fa-heartbeat",
      "sortOrder": 0,
      "isActive": true,
      "profilesCount": 145
    }
  ]
}
```

---

## 6. Modelos (Schemas)

### UserSession

```typescript
interface UserSession {
  userId: string;           // Guid
  userName: string;
  email: string;
  roles: string[];          // ["Professional", "Admin", ...]
  hasProfessionalProfile: boolean;
  professionalProfileId?: string;  // Guid, null si no tiene
  professionalProfileSlug?: string;
}
```

### ProfessionalProfile

```typescript
interface ProfessionalProfile {
  id: string;               // Guid
  userId: string;           // Guid
  businessName: string;
  slug: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  countryId: string;
  countryName: string;
  cityId: string;
  cityName: string;
  citySlug: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  address?: string;
  profileImageUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  dateCreated: string;      // ISO 8601
  dateUpdated?: string;
  servicesCount: number;
}
```

### Service

```typescript
interface Service {
  id: string;               // Guid
  profileId: string;        // Guid
  name: string;
  description?: string;
  priceFrom?: number;       // decimal
  priceTo?: number;
  duration?: string;
  isActive: boolean;
  sortOrder: number;
  dateCreated: string;
  dateUpdated?: string;
}
```

### ServiceRequest

```typescript
interface ServiceRequest {
  id: string;               // Guid
  profileId: string;
  serviceId?: string;
  serviceName?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  message: string;
  status: RequestStatus;
  statusName: string;
  professionalNotes?: string;
  adminNotes?: string;
  dateCreated: string;
  dateUpdated?: string;
}

type RequestStatus = 
  | "Pending" 
  | "Contacted" 
  | "InProgress" 
  | "Completed" 
  | "Rejected" 
  | "Cancelled";
```

### PaginationMeta

```typescript
interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
```

### Metadata Types

```typescript
interface Country {
  id: string;
  name: string;
  iso2?: string;
  slug: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
  countryId: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}
```

---

## 7. Errores Estándar

La API usa formato **ProblemDetails** (RFC 7807) para errores.

### Estructura de Error

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "El campo 'email' es requerido",
  "instance": "/api/public/requests",
  "errors": {
    "email": ["El campo 'email' es requerido"],
    "clientName": ["El nombre no puede exceder 100 caracteres"]
  }
}
```

### Códigos de Error

| Código | Título | Descripción |
|--------|--------|-------------|
| 400 | Bad Request | Validación fallida, datos inválidos |
| 401 | Unauthorized | Token faltante, inválido o expirado |
| 403 | Forbidden | Sin permisos para el recurso (ownership o rol) |
| 404 | Not Found | Recurso no existe o no está activo |
| 409 | Conflict | El recurso ya existe (ej: perfil duplicado) |
| 500 | Internal Server Error | Error interno del servidor |

### Formato Simplificado

Para errores simples, también se puede retornar:

```json
{
  "message": "El usuario ya tiene un perfil profesional"
}
```

---

## 8. Convenciones

### Paginación

Todos los endpoints con listados usan paginación consistente:

**Request:**
```
?page=1&pageSize=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

- `page` default: 1
- `pageSize` default: 20, máximo: 50
- Página 0 o negativa se trata como 1

### Slugs

- Formato: `[a-z0-9-]+` (minúsculas, números, guiones)
- Generados automáticamente desde nombres
- Sin acentos ni caracteres especiales
- Únicos por entidad
- Ejemplos: `dr-juan-perez`, `medicina-general`, `bogota`

### Fechas

- Formato: ISO 8601
- Timezone: UTC
- Ejemplos:
  - `2026-01-15T10:30:00Z`
  - `2026-01-15T10:30:00.000Z`

### Soft Deletes

- Los servicios eliminados quedan con `isActive=false`
- No se borran físicamente de la base de datos
- Se pueden recuperar actualizando `isActive=true`
- Por defecto los listados NO incluyen items inactivos
- Usar `?includeInactive=true` para incluirlos

### IDs

- Tipo: UUID v4 (Guid)
- Formato: `3fa85f64-5717-4562-b3fc-2c963f66afa6`
- Case-insensitive en URLs

### Roles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `Client` | Usuario básico | Solo endpoints públicos |
| `Professional` | Profesional | Dashboard, servicios, solicitudes propias |
| `Admin` | Administrador | Moderación de contenido |
| `SuperAdmin` | Super administrador | Acceso total |

### Null vs Undefined

- Campos opcionales omitidos o `null` son equivalentes
- En respuestas, campos sin valor se envían como `null`
- En requests, se puede omitir el campo o enviar `null`

---

## Apéndice: Ejemplos de Flujos

### A. Onboarding de Profesional

```
1. POST /auth/login → obtener token
2. GET /auth/me → verificar hasProfessionalProfile=false
3. GET /public/metadata → cargar dropdowns
4. POST /professional/profile → crear perfil
5. POST /professional/services → agregar servicios
```

### B. Búsqueda Pública

```
1. GET /public/pages/home → mostrar categorías y destacados
2. GET /public/search/suggest?q=med → autocompletado
3. GET /public/pages/search?category=medicina&city=bogota → resultados
4. GET /public/pages/profile/dr-juan-perez → detalle
5. POST /public/requests → enviar solicitud
```

### C. Gestión de Leads (Profesional)

```
1. GET /auth/me → verificar rol Professional
2. GET /professional/requests?status=Pending → ver nuevas
3. PATCH /professional/requests/{id} → cambiar a Contacted
4. PATCH /professional/requests/{id} → cambiar a Completed
```

### D. Moderación Admin

```
1. GET /admin/professionals?status=pending → pendientes de verificar
2. GET /admin/professionals/{id} → revisar detalle
3. PATCH /admin/professionals/{id} → verificar y/o destacar
4. PATCH /admin/professionals/{id} → desactivar si es necesario
```

---

*Documento generado para el equipo frontend. Para dudas técnicas, contactar al equipo backend.*
