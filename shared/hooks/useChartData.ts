import useSWR from 'swr';

// Simulate an API fetcher
const fetcher = async <T>(url: string): Promise<T> => {
  // In a real app with Neon serverless Postgres, this would fetch from /api/...
  // For now, we simulate API delay and return mocked data based on the endpoint.
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      if (url === '/api/charts/inflation') {
        resolve([
          { year: '2015', rate: -0.9 },
          { year: '2016', rate: -0.6 },
          { year: '2017', rate: 2.0 },
          { year: '2018', rate: 1.6 },
          { year: '2019', rate: 2.3 },
          { year: '2020', rate: 3.4 },
          { year: '2021', rate: 5.1 },
          { year: '2022', rate: 14.4 },
          { year: '2023', rate: 11.4 },
          { year: '2024', rate: 3.7 },
          { year: '2025', rate: 4.5 },
        ] as unknown as T);
      } else if (url === '/api/charts/nbp-rate') {
        resolve([
          { date: '2020-05', rate: 0.10 },
          { date: '2021-10', rate: 0.50 },
          { date: '2021-11', rate: 1.25 },
          { date: '2022-01', rate: 2.25 },
          { date: '2022-04', rate: 4.50 },
          { date: '2022-07', rate: 6.50 },
          { date: '2022-09', rate: 6.75 },
          { date: '2023-09', rate: 6.00 },
          { date: '2023-10', rate: 5.75 },
          { date: '2024-01', rate: 5.75 },
          { date: '2025-01', rate: 5.75 },
        ] as unknown as T);
      } else {
        resolve([] as unknown as T);
      }
    }, 500); // 500ms delay to simulate network request
  });
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
