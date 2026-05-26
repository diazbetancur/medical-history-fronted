/**
 * Pagination Constants
 *
 * Centralised page-size values used across the application.
 * Using named constants avoids magic numbers and makes it easy to
 * adjust limits without hunting through every component.
 */

/** Default number of items per page for most list views. */
export const PAGE_SIZE_DEFAULT = 10;

/** Compact page size used in card/tile grids (e.g. appointment lists). */
export const PAGE_SIZE_CARDS = 12;

/** Medium page size for wider tables that benefit from fewer page turns. */
export const PAGE_SIZE_MEDIUM = 20;

/** Large page size for lightweight, in-memory-filtered lists (e.g. professionals picker). */
export const PAGE_SIZE_LARGE = 50;

/**
 * Maximum items fetched in a single paginated request for calendar/range views
 * where all results are shown in a scrollable list (no further pagination).
 */
export const PAGE_SIZE_CALENDAR_RANGE = 100;

/**
 * Maximum items fetched for the monthly agenda view.
 * Capped at 100 to match the backend [Range(1,100)] validation on AppointmentFilterDto.
 * A professional with 20 working days × 5 slots comfortably fits inside this limit.
 */
export const PAGE_SIZE_MONTH = 100;

/** Available page-size options for paginator UI controls. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/** Available page-size options for admin tables with larger datasets. */
export const PAGE_SIZE_OPTIONS_ADMIN = [10, 25, 50, 100] as const;
