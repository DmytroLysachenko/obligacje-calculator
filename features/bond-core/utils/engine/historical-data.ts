import { format, subMonths } from 'date-fns';
import { HistoricalDataMap } from '../../types';

export function getHistoricalValue(
  targetDate: Date,
  type: 'inflation' | 'nbpRate',
  lagMonths: number = 2,
  providedData?: HistoricalDataMap,
): { value: number | undefined; isProjected: boolean } {
  const lookbackDate = subMonths(targetDate, lagMonths);
  const key = format(lookbackDate, 'yyyy-MM');

  if (providedData?.[key]?.[type] !== undefined) {
    return {
      value: providedData[key][type],
      isProjected: false,
    };
  }

  return { value: undefined, isProjected: true };
}
