import type { StandardizedIndicator } from '@/lib/api-clients/base';

export const NBP_REFERENCE_FALLBACK_SERIES = [
  { date: '2021-01-01', rate: 0.10 },
  { date: '2021-10-07', rate: 0.50 },
  { date: '2021-11-04', rate: 1.25 },
  { date: '2021-12-09', rate: 1.75 },
  { date: '2022-01-05', rate: 2.25 },
  { date: '2022-02-09', rate: 2.75 },
  { date: '2022-03-09', rate: 3.50 },
  { date: '2022-04-07', rate: 4.50 },
  { date: '2022-05-06', rate: 5.25 },
  { date: '2022-06-09', rate: 6.00 },
  { date: '2022-07-08', rate: 6.50 },
  { date: '2022-09-08', rate: 6.75 },
  { date: '2023-09-07', rate: 6.00 },
  { date: '2023-10-05', rate: 5.75 },
  { date: '2024-10-03', rate: 5.50 },
  { date: '2025-05-08', rate: 5.25 },
  { date: '2025-07-03', rate: 5.00 },
  { date: '2025-10-09', rate: 4.50 },
  { date: '2025-12-04', rate: 4.00 },
  { date: '2026-03-05', rate: 3.75 },
] as const;

export function buildNbpReferenceFallbackIndicators(): StandardizedIndicator[] {
  return NBP_REFERENCE_FALLBACK_SERIES.map((point) => ({
    name: 'nbp_reference_rate',
    value: point.rate,
    date: point.date,
    metadata: {
      source: 'fallback',
      sourceLabel: 'NBP official publications fallback dataset',
    },
  }));
}
