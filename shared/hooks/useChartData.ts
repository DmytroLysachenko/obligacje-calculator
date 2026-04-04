import useSWR from 'swr';
import { ApiResponse } from '../types/api';

interface ErrorWithContext extends Error {
  code?: string;
  details?: unknown;
}

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const result: ApiResponse<T> = await response.json();
  
  if (!response.ok || result.error) {
    const error = new Error(result.error?.message || 'An error occurred while fetching the data.') as ErrorWithContext;
    error.code = result.error?.code;
    error.details = result.error?.details;
    throw error;
  }
  
  return result.data as T;
};

export function useChartData<T>(endpoint: string) {
  const { data, error, isLoading } = useSWR<T>(endpoint, fetcher<T>, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data,
    isLoading,
    isError: !!error,
    errorDetails: error as ErrorWithContext | undefined
  };
}
