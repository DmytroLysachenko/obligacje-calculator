import { format, subMonths } from 'date-fns';
import { HistoricalDataMap } from '../../types';
import { HISTORICAL_RETURNS } from '../../constants/historical-data';

const HISTORICAL_DATA_MAP = new Map(HISTORICAL_RETURNS.map((row) => [row.date, row]));

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

  const record = HISTORICAL_DATA_MAP.get(key);
  if (record && record[type] !== undefined) {
    return { value: record[type], isProjected: false };
  }

  return { value: undefined, isProjected: true };
}
