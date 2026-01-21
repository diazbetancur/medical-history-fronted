/**
 * Core Module - Public exports
 *
 * Contains singletons and application-level services:
 * - auth: authentication, guards, roles
 * - http: interceptors
 * - platform: SSR helpers
 * - config: environment config, menu config
 * - pwa: install and update services
 * - services: menu builder, etc.
 */

export * from './auth';
export * from './config';
export * from './http';
export * from './platform';
export * from './pwa';
export { MenuBuilderService } from './services/menu-builder.service';
