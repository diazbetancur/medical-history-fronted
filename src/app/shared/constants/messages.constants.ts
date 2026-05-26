/**
 * UI Message Constants (C-01)
 *
 * Centralised Spanish user-facing strings for toast notifications.
 * Using constants here (rather than inline literals) ensures:
 *   • consistent wording across the app
 *   • a single place to update copy or add i18n later
 *   • findable references via IDE "Find Usages"
 *
 * Naming convention: MSG_<DOMAIN>_<VERB/STATE>
 */

// ── Appointments — patient ─────────────────────────────────────────────────────
export const MSG_APPOINTMENT_NO_PROFESSIONAL =
  'No se ha seleccionado un profesional';
export const MSG_APPOINTMENT_NO_SLOTS =
  'No hay horarios disponibles para esta fecha';
export const MSG_APPOINTMENT_SLOT_UNAVAILABLE =
  'Este horario ya no está disponible';
export const MSG_APPOINTMENT_SELECT_SLOT =
  'Por favor selecciona una fecha y horario';
export const MSG_APPOINTMENT_CREATED = '¡Cita creada exitosamente!';
export const MSG_APPOINTMENT_ERROR_LOAD = 'Error al cargar disponibilidad';
export const MSG_APPOINTMENT_ERROR_CREATE = 'Error al crear la cita';

// ── Appointments — professional ───────────────────────────────────────────────
export const MSG_APPOINTMENT_PROFILE_NOT_FOUND =
  'No se encontró perfil profesional';
export const MSG_APPOINTMENT_CONFIRMED = 'Cita confirmada exitosamente';
export const MSG_APPOINTMENT_CANCELLED = 'Cita cancelada exitosamente';
export const MSG_APPOINTMENT_COMPLETED = 'Cita marcada como completada';
export const MSG_APPOINTMENT_NO_SHOW  = 'Paciente marcado como no asistido';
export const MSG_APPOINTMENT_ERROR_LOAD_LIST = 'Error al cargar citas';
export const MSG_APPOINTMENT_ERROR_CONFIRM = 'Error al confirmar la cita';
export const MSG_APPOINTMENT_ERROR_CANCEL = 'Error al cancelar la cita';
export const MSG_APPOINTMENT_ERROR_COMPLETE = 'Error al completar la cita';
export const MSG_APPOINTMENT_ERROR_NO_SHOW = 'Error al registrar la inasistencia';

// ── Availability ───────────────────────────────────────────────────────────────
export const MSG_AVAILABILITY_UPDATED = 'Horario actualizado exitosamente';
export const MSG_AVAILABILITY_ERROR_LOAD = 'Error al cargar la disponibilidad';
export const MSG_AVAILABILITY_ERROR_SAVE = 'Error al guardar la disponibilidad';
export const MSG_ABSENCE_CREATED = 'Ausencia creada exitosamente';
export const MSG_ABSENCE_DELETED = 'Ausencia eliminada exitosamente';
export const MSG_ABSENCE_ERROR_CREATE = 'Error al crear la ausencia';
export const MSG_ABSENCE_ERROR_DELETE = 'Error al eliminar la ausencia';
export const MSG_AVAILABILITY_NO_SLOTS =
  'No hay horarios disponibles para esta fecha';
export const MSG_AVAILABILITY_NOT_CONFIGURED =
  'No tienes horario configurado. Usa el horario por defecto como base.';

// ── Exams ──────────────────────────────────────────────────────────────────────
export const MSG_EXAM_CREATED  = 'Examen creado exitosamente';
export const MSG_EXAM_UPDATED  = 'Examen actualizado exitosamente';
export const MSG_EXAM_DELETED  = 'Examen eliminado exitosamente';
export const MSG_EXAM_ERROR_LOAD   = 'Error al cargar los exámenes';
export const MSG_EXAM_ERROR_SINGLE = 'Error al cargar el examen';
export const MSG_EXAM_ERROR_CREATE = 'Error al crear el examen';
export const MSG_EXAM_ERROR_UPDATE = 'Error al actualizar el examen';
export const MSG_EXAM_ERROR_DELETE = 'Error al eliminar el examen';

// ── Generic fallbacks ──────────────────────────────────────────────────────────
/** Use as: `problemDetails.title ?? MSG_GENERIC_ERROR` */
export const MSG_GENERIC_ERROR = 'Ha ocurrido un error inesperado';
export const MSG_GENERIC_NETWORK_ERROR =
  'No se pudo conectar con el servidor. Verifica tu conexión.';
