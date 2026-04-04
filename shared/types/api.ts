export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: {
    requestId?: string;
    timestamp: string;
    version: string;
  };
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.2.0',
    },
  };
}

export function createErrorResponse(message: string, code?: string, details?: unknown): ApiResponse<null> {
  return {
    error: {
      message,
      code,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.2.0',
    },
  };
}
