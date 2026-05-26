import { AbstractControl, Validators } from '@angular/forms';

export type RequiredMessageMode = 'text' | 'selection' | 'boolean';
export type FormErrorMessageFactory = (
  errorValue: unknown,
  control: AbstractControl | null,
) => string;
export type FormErrorMessage = string | FormErrorMessageFactory;
export type FormErrorMessageMap = Record<string, FormErrorMessage>;

const DEFAULT_ERROR_PRIORITY = [
  'required',
  'requiredTrue',
  'email',
  'trimmedMinLength',
  'minlength',
  'maxlength',
  'min',
  'max',
  'pattern',
  'passwordMismatch',
] as const;

function resolveDefaultMessage(
  errorKey: string,
  errorValue: unknown,
  requiredMode: RequiredMessageMode,
): string {
  switch (errorKey) {
    case 'required':
      if (requiredMode === 'selection') return 'Selecciona una opción';
      return 'Este campo es obligatorio';
    case 'requiredTrue':
      return 'Debes aceptar esta opción';
    case 'email':
      return 'Ingresa un correo válido';
    case 'trimmedMinLength': {
      const requiredLength =
        typeof errorValue === 'object' &&
        errorValue !== null &&
        'requiredLength' in errorValue
          ? (errorValue as { requiredLength: number }).requiredLength
          : 0;
      return `Debes ingresar al menos ${requiredLength} caracteres`;
    }
    case 'minlength': {
      const requiredLength =
        typeof errorValue === 'object' &&
        errorValue !== null &&
        'requiredLength' in errorValue
          ? (errorValue as { requiredLength: number }).requiredLength
          : 0;
      return `Debes ingresar al menos ${requiredLength} caracteres`;
    }
    case 'maxlength': {
      const requiredLength =
        typeof errorValue === 'object' &&
        errorValue !== null &&
        'requiredLength' in errorValue
          ? (errorValue as { requiredLength: number }).requiredLength
          : 0;
      return `El máximo permitido es ${requiredLength} caracteres`;
    }
    case 'min': {
      const minValue =
        typeof errorValue === 'object' && errorValue !== null && 'min' in errorValue
          ? (errorValue as { min: number }).min
          : '';
      return `El valor mínimo permitido es ${minValue}`;
    }
    case 'max': {
      const maxValue =
        typeof errorValue === 'object' && errorValue !== null && 'max' in errorValue
          ? (errorValue as { max: number }).max
          : '';
      return `El valor máximo permitido es ${maxValue}`;
    }
    case 'pattern':
      return 'El formato ingresado no es válido';
    case 'passwordMismatch':
      return 'Las contraseñas no coinciden';
    default:
      return 'Revisa este campo';
  }
}

function pickErrorKey(control: AbstractControl): string | null {
  const errors = control.errors;
  if (!errors) {
    return null;
  }

  for (const key of DEFAULT_ERROR_PRIORITY) {
    if (key in errors) {
      return key;
    }
  }

  const fallback = Object.keys(errors)[0];
  return fallback || null;
}

export function shouldDisplayControlError(
  control: AbstractControl | null,
  submitted = false,
  force = false,
): boolean {
  if (!control || !control.invalid) {
    return false;
  }

  if (force) {
    return true;
  }

  return submitted || control.touched || control.dirty;
}

export function resolveControlErrorMessage(
  control: AbstractControl | null,
  options?: {
    submitted?: boolean;
    force?: boolean;
    requiredMode?: RequiredMessageMode;
    messages?: FormErrorMessageMap;
  },
): string | null {
  if (!control) {
    return null;
  }

  const submitted = options?.submitted ?? false;
  const force = options?.force ?? false;
  const requiredMode = options?.requiredMode ?? 'text';

  if (!shouldDisplayControlError(control, submitted, force)) {
    return null;
  }

  const errorKey = pickErrorKey(control);
  if (!errorKey) {
    return null;
  }

  const errorValue = control.errors?.[errorKey];
  const customMessage = options?.messages?.[errorKey];

  if (typeof customMessage === 'function') {
    return customMessage(errorValue, control);
  }

  if (typeof customMessage === 'string') {
    return customMessage;
  }

  return resolveDefaultMessage(errorKey, errorValue, requiredMode);
}

export function hasRequiredValidator(control: AbstractControl | null): boolean {
  if (!control) {
    return false;
  }

  return (
    control.hasValidator(Validators.required) ||
    control.hasValidator(Validators.requiredTrue)
  );
}
