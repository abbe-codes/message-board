import { type ApiErrorCode } from './api-error-code';

export interface ApiErrorDetail {
  field?: string;
  code?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse extends ApiErrorPayload {
  statusCode: number;
  path: string;
  timestamp: string;
}
