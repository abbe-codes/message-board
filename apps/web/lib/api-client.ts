export interface ApiErrorDetail {
  field?: string;
  code?: string;
  message: string;
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.code = body.code;
    this.details = body.details ?? [];
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { body, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const requestInit: RequestInit = {
    ...requestOptions,
    credentials: 'include',
    headers,
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, requestInit);
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(toErrorBody(payload, response.status));
  }

  return payload as TResponse;
}

function toErrorBody(payload: unknown, statusCode: number): ApiErrorBody {
  if (isApiErrorBody(payload)) {
    return payload;
  }

  return {
    statusCode,
    code: statusCode === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED',
    message: 'Request failed.',
  };
}

function isApiErrorBody(payload: unknown): payload is ApiErrorBody {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const maybeError = payload as Partial<ApiErrorBody>;

  return (
    typeof maybeError.statusCode === 'number' &&
    typeof maybeError.code === 'string' &&
    typeof maybeError.message === 'string'
  );
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
