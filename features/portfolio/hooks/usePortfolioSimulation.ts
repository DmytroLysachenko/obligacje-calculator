'use client';

import { useState, useCallback } from 'react';
import { BondInputs, CalculationResult } from '@/features/bond-core/types';
import { reducePortfolioResults, PortfolioSummary } from '../utils/portfolio-reducer';

export function usePortfolioSimulation() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [aggregatedResult, setAggregatedResult] = useState<PortfolioSummary | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const calculatePortfolio = useCallback(async (portfolioLots: BondInputs[]) => {
    if (!portfolioLots || portfolioLots.length === 0) return null;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const promises = portfolioLots.map((lot) => {
        return new Promise<CalculationResult>((resolve, reject) => {
          const worker = new Worker(new URL('@/shared/workers/calculation.worker.ts', import.meta.url));
          
          worker.onmessage = (e) => {
            resolve(e.data.result as CalculationResult);
            worker.terminate();
          };
          
          worker.onerror = (err) => {
            reject(new Error(`Worker error: ${err.message}`));
            worker.terminate();
          };
          
          worker.postMessage({ type: 'CALCULATE_SINGLE', payload: lot });
        });
      });

      const allResults = await Promise.all(promises);
      const aggregated = reducePortfolioResults(allResults);

      setAggregatedResult(aggregated);
      return aggregated;
    } catch (err) {
      console.error('Portfolio simulation failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return { calculatePortfolio, isCalculating, aggregatedResult, error };
}
