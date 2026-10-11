import type { ErrorCode } from '@/types';

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly requestId: string;
  readonly retryable: boolean;

  constructor(code: ErrorCode, message: string, opts: { fieldErrors?: Record<string, string[]> } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = { unauthenticated: 401, forbidden: 403, not_found: 404, validation_failed: 422, conflict: 409, rate_limited: 429, unavailable: 503, offline: 0, unknown: 500 }[code];
    this.fieldErrors = opts.fieldErrors;
    this.requestId = `req_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
    this.retryable = code === 'unavailable' || code === 'offline' || code === 'rate_limited';
  }
}

export const forbidden = (msg = 'You do not have access to this.') => new ApiError('forbidden', msg);
export const notFound = (what = 'That') => new ApiError('not_found', `${what} could not be found.`);
