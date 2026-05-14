import { ApiResponse } from '@/shared/types/api';

export function unwrapApiData<T>(payload: ApiResponse<T> | T | null | undefined): T | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data ?? null;
  }

  return payload as T;
}
