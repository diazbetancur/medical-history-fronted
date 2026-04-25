/**
 * Auth Form Messages
 * Mensajes de validación personalizados para formularios de autenticación
 * Basados en: docs/MATRIZ_FRONTEND_FORMULARIOS.md
 */

import { FormErrorMessageMap } from '@shared/utils/form-validation';

/**
 * Register Form Messages
 * Validación para POST /api/auth/register
 */
export const RegisterFormMessages = {
  firstName: {
    required: 'Ingresa tu nombre',
    maxlength: 'El nombre no puede exceder 100 caracteres',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Revisa el nombre ingresado',
  } as FormErrorMessageMap,

  lastName: {
    required: 'Ingresa tu apellido',
    maxlength: 'El apellido no puede exceder 100 caracteres',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Revisa el apellido ingresado',
  } as FormErrorMessageMap,

  email: {
    required: 'Ingresa tu correo',
    email: 'Ingresa un correo válido',
    maxlength: 'El correo no puede exceder 256 caracteres',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Revisa el correo ingresado',
  } as FormErrorMessageMap,

  password: {
    required: 'Ingresa una contraseña',
    minlength: 'La contraseña debe tener al menos 8 caracteres',
    maxlength: 'La contraseña no puede exceder 100 caracteres',
    pattern:
      'Usa al menos 8 caracteres con mayúscula, minúscula, número y símbolo',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Revisa la contraseña ingresada',
  } as FormErrorMessageMap,

  confirmPassword: {
    required: 'Confirma tu contraseña',
    passwordMismatch: 'Las contraseñas deben coincidir',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Las contraseñas deben coincidir',
  } as FormErrorMessageMap,

  phoneNumber: {
    maxlength: 'El teléfono no puede exceder 20 caracteres',
    invalidPhone: 'Ingresa un teléfono válido',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Revisa el teléfono ingresado',
  } as FormErrorMessageMap,

  asProfessional: {} as FormErrorMessageMap,
} as const;

/**
 * Login Form Messages
 * Validación para POST /api/auth/login
 */
export const LoginFormMessages = {
  email: {
    required: 'Ingresa tu correo',
    email: 'Ingresa un correo válido',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Revisa el correo ingresado',
  } as FormErrorMessageMap,

  password: {
    required: 'Ingresa tu contraseña',
    server: (errorValue) =>
      typeof errorValue === 'string'
        ? errorValue
        : 'Revisa la contraseña ingresada',
  } as FormErrorMessageMap,

  asProfessional: {} as FormErrorMessageMap,
} as const;

/**
 * Change Password Form Messages
 * Validación para POST /api/auth/change-password
 */
export const ChangePasswordFormMessages = {
  currentPassword: {
    required: 'Ingresa tu contraseña actual',
  } as FormErrorMessageMap,

  newPassword: {
    required: 'Ingresa una nueva contraseña',
    minlength: 'La contraseña debe tener al menos 8 caracteres',
    maxlength: 'La contraseña no puede exceder 100 caracteres',
    pattern:
      'Usa al menos 8 caracteres con mayúscula, minúscula, número y símbolo',
  } as FormErrorMessageMap,

  confirmNewPassword: {
    required: 'Confirma tu nueva contraseña',
    passwordMismatch: 'Las contraseñas deben coincidir',
  } as FormErrorMessageMap,
} as const;

/**
 * Password Strength Help Text
 * Mostrar debajo del campo de contraseña para ayudar al usuario
 */
export const PasswordComplexityHelpText =
  'Debe contener: mayúscula, minúscula, número y símbolo (!@#$%^&*)';
