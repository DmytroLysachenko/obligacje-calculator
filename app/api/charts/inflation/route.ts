import { NextResponse } from 'next/server';
import { getIndicatorHistory } from '@/lib/data-access';

const FALLBACK_INFLATION = [
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
  { year: '2025', rate: 4.2 },
];

export async function GET() {
  try {
    const data = await getIndicatorHistory('inflation_pl', '2015-01-01', '2026-12-31');
    
    if (!data || data.length === 0) {
      return NextResponse.json(FALLBACK_INFLATION);
    }

    const formatted = data.map(d => ({
      year: d.date.substring(0, 4),
      rate: d.value,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch inflation data:', error);
    return NextResponse.json(FALLBACK_INFLATION);
  }
}
