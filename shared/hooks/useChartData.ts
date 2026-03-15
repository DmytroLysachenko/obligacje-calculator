import useSWR from 'swr';

const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return response.json();
};

export function useChartData<T>(endpoint: string) {
  const { data, error, isLoading } = useSWR<T>(endpoint, fetcher<T>, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    data,
    isLoading,
    isError: error
  };
}
