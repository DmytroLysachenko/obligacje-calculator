import { NextResponse } from 'next/server';
import { getIndicatorHistory } from '@/lib/data-access';
import { EconomicIndicator } from '@/db/schema';

const FALLBACK_NBP = [
  { date: '2021-01', rate: 0.1 },
  { date: '2021-10', rate: 0.5 },
  { date: '2021-11', rate: 1.25 },
  { date: '2021-12', rate: 1.75 },
  { date: '2022-01', rate: 2.25 },
  { date: '2022-02', rate: 2.75 },
  { date: '2022-03', rate: 3.5 },
  { date: '2022-04', rate: 4.5 },
  { date: '2022-05', rate: 5.25 },
  { date: '2022-06', rate: 6.0 },
  { date: '2022-07', rate: 6.5 },
  { date: '2022-09', rate: 6.75 },
  { date: '2023-09', rate: 6.0 },
  { date: '2023-10', rate: 5.75 },
  { date: '2024-01', rate: 5.75 },
  { date: '2025-01', rate: 5.75 },
];

export async function GET() {
  try {
    const data = await getIndicatorHistory('nbp_rate', '2021-01-01', '2026-12-31');
    
    if (!data || data.length === 0) {
      return NextResponse.json(FALLBACK_NBP);
    }

    const formatted = data.map((d: EconomicIndicator) => ({
      date: d.date.substring(0, 7),
      rate: parseFloat(d.value),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch NBP data:', error);
    return NextResponse.json(FALLBACK_NBP);
  }
}
