import { BondType } from '@/features/bond-core/types';

type SearchParams = Pick<URLSearchParams, 'get'>;

export type ComparisonBondPair = readonly [BondType, BondType];

export function parseComparisonBondPair(searchParams: SearchParams): ComparisonBondPair | null {
  const a = searchParams.get('a');
  const b = searchParams.get('b');

  if (!a || !b || a === b || !Object.values(BondType).includes(a as BondType)) {
    return null;
  }

  if (!Object.values(BondType).includes(b as BondType)) {
    return null;
  }

  return [a as BondType, b as BondType];
}

export function withComparisonBondPair(
  pathname: string,
  currentSearchParams: URLSearchParams,
  pair: ComparisonBondPair,
) {
  const searchParams = new URLSearchParams(currentSearchParams);
  searchParams.set('a', pair[0]);
  searchParams.set('b', pair[1]);
  return `${pathname}?${searchParams.toString()}`;
}
