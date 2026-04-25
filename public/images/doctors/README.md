# Doctor Profile Images

Fotos de perfiles de doctores y profesionales médicos.

## Especificaciones

### Profile Photos
- **Dimensiones**: 400x400px (cuadrado, 1:1)
- **Formato**: WebP o JPEG
- **Tamaño máximo**: 50KB
- **Calidad**: 80-85%
- **Aspectos**:
  - Fondo neutro o profesional
  - Buena iluminación
  - Encuadre de busto/rostro
  - Vestimenta profesional

### Card Thumbnails
- **Dimensiones**: 600x720px (5:6 ratio, vertical)
- **Formato**: WebP o JPEG
- **Tamaño máximo**: 80KB
- **Descripción**: Imágenes para las tarjetas de profesionales

## Nomenclatura

```
doctor-profile-[id].webp          # Foto de perfil cuadrada
doctor-card-[id].webp            # Foto para card (vertical)
doctor-placeholder-male.webp     # Placeholder masculino
doctor-placeholder-female.webp   # Placeholder femenino
```

## Fallback

Si no hay foto, el componente `ProfessionalCardComponent` usa:
- UI Avatars API: https://ui-avatars.com/api/
- Genera avatares con iniciales del nombre

## Uso en Código

```typescript
// En professional-card.component.ts
get imageUrl(): string {
  return this.professional.avatarUrl || 
    '/images/doctors/doctor-placeholder-male.webp';
}
```

## Fuentes de Imágenes

- This Person Does Not Exist: https://thispersondoesnotexist.com/
- Generated Photos: https://generated.photos/
- Unsplash (con atribución): https://unsplash.com/s/photos/doctor
