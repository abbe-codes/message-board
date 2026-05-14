import { BadRequestException, type ValidationError } from '@nestjs/common';

import { type ApiErrorDetail } from '../errors/api-error-response';

export function createValidationException(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed.',
    details: flattenValidationErrors(errors),
  });
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath?: string,
): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const ownDetails = Object.entries(error.constraints ?? {}).map(([code, message]) => ({
      field,
      code,
      message,
    }));
    const childDetails = flattenValidationErrors(error.children ?? [], field);

    return [...ownDetails, ...childDetails];
  });
}
