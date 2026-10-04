import type { FieldErrors, FieldValues } from 'react-hook-form';

export type FirstFormError = {
  /** Dot path, e.g. `uomLines.0.catalogUomId` */
  path: string;
  message: string;
};

function isFieldError(value: unknown): value is { message?: string; type?: string } {
  return typeof value === 'object' && value !== null && 'message' in value;
}

/** Walk react-hook-form / zod nested errors and return the first human message. */
export function findFirstFormError(errors: FieldErrors<FieldValues>, prefix = ''): FirstFormError | null {
  for (const key of Object.keys(errors)) {
    const value = errors[key as keyof typeof errors];
    if (value == null) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (isFieldError(value) && typeof value.message === 'string' && value.message.length > 0) {
      return { path, message: value.message };
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const row = value[index];
        if (row == null) continue;
        const nested = findFirstFormError(row as FieldErrors<FieldValues>, `${path}.${index}`);
        if (nested) return nested;
      }
      continue;
    }

    if (typeof value === 'object') {
      const nested = findFirstFormError(value as FieldErrors<FieldValues>, path);
      if (nested) return nested;
    }
  }
  return null;
}

export function topLevelFieldFromErrorPath(path: string): string {
  return path.split('.')[0] ?? path;
}

export function formHasErrorForFields(errors: FieldErrors<FieldValues>, fields: string[]): boolean {
  return fields.some((field) => field in errors && errors[field as keyof typeof errors] != null);
}
