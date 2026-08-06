import { BondInputs, BondType, CalculationResult } from '@/features/bond-core/types';
import { ScenarioKind, SingleBondCalculationEnvelope } from '@/features/bond-core/types/scenarios';
import type { Language } from '@/i18n/config';
import { bondSeriesClient } from '@/shared/lib/bond-series-client';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { logClientError } from '@/shared/lib/client-logger';
import { portfolioClient } from '@/shared/lib/portfolio-client';
import { scenarioShareClient } from '@/shared/lib/scenario-share-client';
import { buildSharedSingleScenarioPayload } from '@/shared/lib/single-scenario-share';
import {
  getStoredCurrentPortfolioId,
  setStoredCurrentPortfolioId,
} from '@/shared/lib/workspace/current-portfolio';
import { getWorkspaceSaveTarget } from '@/shared/lib/workspace/portfolio-selection';

import { createSavedScenario, saveScenarioRecord } from './scenario-storage';
import {
  buildSavedSingleScenarioMeta,
  buildSingleReportFilename,
} from './single-calculator-container-model';
import {
  applyReverseSavingsGoal,
  getReverseCalculationTestInputs,
} from './single-calculator-state';

type PostCalculation = <TResponse>(
  endpoint: string,
  payload: unknown,
  options?: { preferWorker?: boolean },
) => Promise<TResponse>;

export function isCalculationAbort(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message === 'Calculation aborted')
  );
}

export async function runSingleBondCalculation({
  inputs,
  post,
}: {
  inputs: BondInputs;
  post: PostCalculation;
}) {
  let finalInputs = { ...inputs };

  if (inputs.calculatorMode === 'reverse' && inputs.savingsGoal) {
    const simulatedEnvelope = await post<SingleBondCalculationEnvelope>(
      getCalculationEndpoint(ScenarioKind.SINGLE_BOND),
      getReverseCalculationTestInputs(inputs),
    );
    finalInputs = applyReverseSavingsGoal(inputs, simulatedEnvelope.result.netPayoutValue);
  }

  const envelope = await post<SingleBondCalculationEnvelope>(
    getCalculationEndpoint(ScenarioKind.SINGLE_BOND),
    finalInputs,
  );

  return { envelope, finalInputs };
}

export function fetchBondSeriesForSymbol(symbol: BondType) {
  return bondSeriesClient.listBySymbol(symbol);
}

type Translate = (key: string, values?: Record<string, string | number>) => string;
type StatusTone = 'success' | 'error';

export interface SingleCalculatorActionDependencies {
  inputs: BondInputs;
  results: CalculationResult | null;
  lastCommittedInputs: BondInputs | null;
  selectedSeriesId: string | null | undefined;
  language: Language;
  canManageWorkspace: boolean;
  t: Translate;
  setStatus: (tone: StatusTone, message: string) => void;
}

/**
 * Owns effects initiated from the single-calculator result controls. The
 * container remains responsible for rendering and calculation state only.
 */
export function createSingleCalculatorActions({
  inputs,
  results,
  lastCommittedInputs,
  selectedSeriesId,
  language,
  canManageWorkspace,
  t,
  setStatus,
}: SingleCalculatorActionDependencies) {
  return {
    async addToNotebook() {
      if (!results || !canManageWorkspace) return;

      try {
        const portfolioList = await portfolioClient.listPortfolios();
        const saveTarget = getWorkspaceSaveTarget(getStoredCurrentPortfolioId(), portfolioList);
        let portfolioId: string | undefined = saveTarget.portfolioId ?? undefined;
        let portfolioName: string | null = saveTarget.portfolioName;

        if (saveTarget.needsPortfolioCreation) {
          const createdPortfolio = await portfolioClient.createPortfolio({
            name: t('notebook.my_first_portfolio'),
            description: '',
          });
          portfolioId = createdPortfolio?.id;
          portfolioName = createdPortfolio?.name ?? t('notebook.my_first_portfolio');
        }

        if (!portfolioId) throw new Error('Could not resolve a portfolio id for notebook save.');

        setStoredCurrentPortfolioId(portfolioId);
        await portfolioClient.createLot({
          portfolioId,
          bondType: inputs.bondType,
          selectedSeriesId: selectedSeriesId && selectedSeriesId !== 'current' ? selectedSeriesId : null,
          purchaseDate: inputs.purchaseDate,
          amount: Math.floor(inputs.initialInvestment / 100),
          isRebought: inputs.isRebought,
        });
        setStatus(
          'success',
          portfolioName
            ? t('notebook.current_lot_added_to_active', { name: portfolioName })
            : t('notebook.current_lot_added'),
        );
      } catch (error) {
        logClientError('Notebook lot save failed:', error);
        setStatus('error', t('notebook.create_error'));
      }
    },

    saveScenario() {
      try {
        const scenarioMeta = buildSavedSingleScenarioMeta(inputs, results);
        saveScenarioRecord(
          createSavedScenario(inputs, {
            name: scenarioMeta.name,
            description: scenarioMeta.description,
          }),
        );
        setStatus('success', t('bonds.results.scenario_save_success'));
      } catch (error) {
        logClientError('Scenario save failed:', error);
        setStatus('error', t('bonds.results.scenario_save_error'));
      }
    },

    async exportPdf() {
      if (!results) return;

      try {
        const { generateSingleBondReportPdf } = await import('@/shared/lib/pdf-utils');
        await generateSingleBondReportPdf(
          results,
          inputs,
          language,
          buildSingleReportFilename(inputs, language),
        );
        setStatus('success', t('bonds.results.pdf_export_success'));
      } catch (error) {
        logClientError('PDF export failed:', error);
        setStatus('error', t('bonds.results.pdf_export_error'));
      }
    },

    async shareScenario() {
      if (!results || !lastCommittedInputs) return;

      const payload = buildSharedSingleScenarioPayload(
        lastCommittedInputs,
        `Committed single-bond scenario for ${lastCommittedInputs.bondType}.`,
      );
      const shareSnapshot = await scenarioShareClient.createSingleScenario(payload);
      return shareSnapshot.shareUrl;
    },
  };
}
