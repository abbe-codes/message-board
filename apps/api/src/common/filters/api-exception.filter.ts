import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { type ApiErrorCode } from '../errors/api-error-code';
import {
  type ApiErrorDetail,
  type ApiErrorPayload,
  type ApiErrorResponse,
} from '../errors/api-error-response';

interface NestErrorBody {
  code?: ApiErrorCode;
  message?: string | string[];
  error?: string;
  details?: ApiErrorDetail[];
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = this.toPayload(exception, statusCode);
    const body: ApiErrorResponse = {
      statusCode,
      code: payload.code,
      message: payload.message,
      path: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
    };

    if (payload.details && payload.details.length > 0) {
      body.details = payload.details;
    }

    response.status(statusCode).json(body);
  }

  private toPayload(exception: unknown, statusCode: number): ApiErrorPayload {
    if (!(exception instanceof HttpException)) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        code: this.codeFromStatus(statusCode),
        message: response,
      };
    }

    if (this.isNestErrorBody(response)) {
      const payload: ApiErrorPayload = {
        code: response.code ?? this.codeFromStatus(statusCode, response),
        message: this.getMessage(response, exception),
      };
      const details = response.details ?? this.getDetailsFromMessage(response.message);

      if (details && details.length > 0) {
        payload.details = details;
      }

      return payload;
    }

    return {
      code: this.codeFromStatus(statusCode),
      message: exception.message || 'Request failed.',
    };
  }

  private isNestErrorBody(value: unknown): value is NestErrorBody {
    return typeof value === 'object' && value !== null;
  }

  private getMessage(response: NestErrorBody, exception: HttpException): string {
    if (typeof response.message === 'string') {
      return response.message;
    }

    if (Array.isArray(response.message)) {
      return this.isValidationBody(response)
        ? 'Request validation failed.'
        : response.message.join('; ');
    }

    if (response.error) {
      return response.error;
    }

    return exception.message || 'Request failed.';
  }

  private getDetailsFromMessage(message: NestErrorBody['message']): ApiErrorDetail[] | undefined {
    if (!Array.isArray(message)) {
      return undefined;
    }

    return message.map((item) => ({ message: item }));
  }

  private codeFromStatus(statusCode: number, response?: NestErrorBody): ApiErrorCode {
    if (response && this.isValidationBody(response)) {
      return 'VALIDATION_ERROR';
    }

    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST';
    }
  }

  private isValidationBody(response: NestErrorBody): boolean {
    return (
      response.code === 'VALIDATION_ERROR' ||
      (response.error === 'Bad Request' && Array.isArray(response.message))
    );
  }
}
