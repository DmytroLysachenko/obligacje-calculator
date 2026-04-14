'use client';

import { useState, useCallback } from 'react';
import { BondInputs } from '@/features/bond-core/types';

export function usePortfolioSimulation() {
  const [isCalculating, setIsCalculating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aggregatedResult, setAggregatedResult] = useState<any | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const calculatePortfolio = useCallback(async (portfolioLots: BondInputs[]) => {
    if (!portfolioLots || portfolioLots.length === 0) return null;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const promises = portfolioLots.map((lot) => {
        return new Promise((resolve, reject) => {
          // Send multiple calculation requests to the worker pool.
          // Using a generic calculation worker path per project conventions.
          const worker = new Worker(new URL('@/shared/workers/calculation.worker.ts', import.meta.url));
          
          worker.onmessage = (e) => {
            resolve(e.data.result);
            worker.terminate(); // Clean up worker per lot
          };
          
          worker.onerror = (err) => {
            reject(new Error(`Worker error: ${err.message}`));
            worker.terminate();
          };
          
          worker.postMessage({ type: 'CALCULATE_SINGLE', payload: lot });
        });
      });

      // Execute all worker calculations in parallel
      const allResults = await Promise.all(promises);
      
      // Aggregate into a 'Total Portfolio View'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aggregated = allResults.reduce((acc: any, curr: any) => {
        if (!curr) return acc;
        
        return {
          totalInvestment: (acc.totalInvestment || 0) + (curr.initialInvestment || 0),
          totalNominalValue: (acc.totalNominalValue || 0) + (curr.finalNominalValue || 0),
          totalRealValue: (acc.totalRealValue || 0) + (curr.finalRealValue || 0),
          totalProfit: (acc.totalProfit || 0) + (curr.totalProfit || 0),
          totalTaxPaid: (acc.totalTaxPaid || 0) + (curr.totalTax || 0),
          totalEarlyWithdrawalFees: (acc.totalEarlyWithdrawalFees || 0) + (curr.totalEarlyWithdrawalFee || 0),
          netPayoutValue: (acc.netPayoutValue || 0) + (curr.netPayoutValue || 0),
        };
      }, {});

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
