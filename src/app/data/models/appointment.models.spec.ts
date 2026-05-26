import { normalizeAppointmentStatus } from './appointment.models';

/**
 * Unit tests for normalizeAppointmentStatus (M-02/M-09).
 *
 * The function must handle:
 *   • Canonical UPPERCASE strings → returned as-is
 *   • Lowercase / mixed-case strings → normalised to UPPERCASE
 *   • Backend numeric enum codes (0-4) → mapped to string
 *   • Known aliases (CANCELED, NO_SHOWED, NOSHOW) → canonical form
 *   • Whitespace / hyphen separators → converted to underscore
 *   • Unknown values and undefined → fallback PENDING
 *   • statusDisplay fallback when primary status is empty
 */
describe('normalizeAppointmentStatus', () => {

  // ── Canonical UPPERCASE strings ──────────────────────────────────────────

  it('returns PENDING unchanged', () => {
    expect(normalizeAppointmentStatus('PENDING')).toBe('PENDING');
  });

  it('returns CONFIRMED unchanged', () => {
    expect(normalizeAppointmentStatus('CONFIRMED')).toBe('CONFIRMED');
  });

  it('returns CANCELLED unchanged', () => {
    expect(normalizeAppointmentStatus('CANCELLED')).toBe('CANCELLED');
  });

  it('returns COMPLETED unchanged', () => {
    expect(normalizeAppointmentStatus('COMPLETED')).toBe('COMPLETED');
  });

  it('returns NO_SHOW unchanged', () => {
    expect(normalizeAppointmentStatus('NO_SHOW')).toBe('NO_SHOW');
  });

  // ── Case normalisation ───────────────────────────────────────────────────

  it('normalises lowercase "pending" to PENDING', () => {
    expect(normalizeAppointmentStatus('pending')).toBe('PENDING');
  });

  it('normalises lowercase "confirmed" to CONFIRMED', () => {
    expect(normalizeAppointmentStatus('confirmed')).toBe('CONFIRMED');
  });

  it('normalises mixed-case "Cancelled" to CANCELLED', () => {
    expect(normalizeAppointmentStatus('Cancelled')).toBe('CANCELLED');
  });

  // ── Numeric backend enum codes ───────────────────────────────────────────

  it('maps code 0 to PENDING', () => {
    expect(normalizeAppointmentStatus(0)).toBe('PENDING');
  });

  it('maps code 1 to CONFIRMED', () => {
    expect(normalizeAppointmentStatus(1)).toBe('CONFIRMED');
  });

  it('maps code 2 to CANCELLED', () => {
    expect(normalizeAppointmentStatus(2)).toBe('CANCELLED');
  });

  it('maps code 3 to COMPLETED', () => {
    expect(normalizeAppointmentStatus(3)).toBe('COMPLETED');
  });

  it('maps code 4 to NO_SHOW', () => {
    expect(normalizeAppointmentStatus(4)).toBe('NO_SHOW');
  });

  // ── Known string aliases ─────────────────────────────────────────────────

  it('maps American "CANCELED" to CANCELLED', () => {
    expect(normalizeAppointmentStatus('CANCELED')).toBe('CANCELLED');
  });

  it('maps "NO_SHOWED" to NO_SHOW', () => {
    expect(normalizeAppointmentStatus('NO_SHOWED')).toBe('NO_SHOW');
  });

  it('maps "NOSHOW" to NO_SHOW', () => {
    expect(normalizeAppointmentStatus('NOSHOW')).toBe('NO_SHOW');
  });

  // ── Whitespace / separator normalisation ────────────────────────────────

  it('maps "no show" (space-separated) to NO_SHOW', () => {
    expect(normalizeAppointmentStatus('no show')).toBe('NO_SHOW');
  });

  it('maps "no-show" (hyphen-separated) to NO_SHOW', () => {
    expect(normalizeAppointmentStatus('no-show')).toBe('NO_SHOW');
  });

  // ── statusDisplay fallback ───────────────────────────────────────────────

  it('uses statusDisplay when primary status is empty string', () => {
    expect(normalizeAppointmentStatus('', 'CONFIRMED')).toBe('CONFIRMED');
  });

  it('uses statusDisplay when primary status is undefined', () => {
    expect(normalizeAppointmentStatus(undefined, 'COMPLETED')).toBe('COMPLETED');
  });

  it('statusDisplay also handles lowercase', () => {
    expect(normalizeAppointmentStatus(undefined, 'confirmed')).toBe('CONFIRMED');
  });

  // ── Unknown / fallback ───────────────────────────────────────────────────

  it('returns PENDING for undefined with no statusDisplay', () => {
    expect(normalizeAppointmentStatus(undefined)).toBe('PENDING');
  });

  it('returns PENDING for empty string with no statusDisplay', () => {
    expect(normalizeAppointmentStatus('')).toBe('PENDING');
  });

  it('returns PENDING for an unknown string value', () => {
    expect(normalizeAppointmentStatus('UNKNOWN_STATUS')).toBe('PENDING');
  });

  it('returns PENDING for an unknown numeric code', () => {
    // 99 is not a valid code
    expect(normalizeAppointmentStatus(99)).toBe('PENDING');
  });
});
