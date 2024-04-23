import { NextFunction, Request, Response } from 'express';
import { ValidationError, validateOrReject } from 'class-validator';
import { classToPlain, instanceToPlain, plainToInstance } from 'class-transformer';

import { HttpException } from '@exceptions/HttpException';

/**
 * Extracts error messages from validation errors, including nested errors.
 * @param errors Array of ValidationError objects
 * @returns Array of error message strings
 */
function extractErrorMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  errors.forEach(error => {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children && error.children.length > 0) {
      messages.push(...extractErrorMessages(error.children));
    }
  });
  return messages;
}

/**
 * Validation middleware that uses class-validator and class-transformer to validate request bodies.
 * @param type The class (type) to validate against.
 * @param skipMissingProperties Whether to skip validation of missing properties.
 * @param whitelist Whether to strip properties not existing in the validation class.
 * @param forbidNonWhitelisted Whether to throw errors for properties not existing in the validation class.
 * @returns Express middleware function.
 */
export const ValidationMiddleware = (type: any, skipMissingProperties = false, whitelist = false, forbidNonWhitelisted = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the request body is present
    if (!req.body) {
      return next(new HttpException(400, 'Request body is missing'));
    }

    // Convert the request body to the class instance
    // console.log(req.body);
    const dto = plainToInstance(type, req.body);
    // console.log(dto);

    validateOrReject(dto, { skipMissingProperties, whitelist, forbidNonWhitelisted })
      .then(() => {
        req.body = instanceToPlain(dto); // This ensures the object is in plain form
        // req.body = dto;
        next();
      })
      .catch((errors: ValidationError[]) => {
        // Extract and concatenate error messages
        const message = extractErrorMessages(errors).join(', ');
        next(new HttpException(400, message));
      });
  };
};
