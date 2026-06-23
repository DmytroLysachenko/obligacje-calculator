'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addYears } from 'date-fns';
import { BondType, TaxStrategy } from '@/features/bond-core/types';
import { BondComparisonCalculationEnvelope, ScenarioKind } from '@/features/bond-core/types/scenarios';
import { useAppI18n } from '@/i18n/client';
import { useCurrencyFormatter } from '@/shared/hooks/useLocalizedFormatters';
import { useBondDefinitions } from '@/shared/context/BondDefinitionsContext';
import { useMacroAssumptionDefaults } from '@/shared/hooks/useMacroAssumptionDefaults';
import { useCalculationRequest } from '@/shared/hooks/useCalculationRequest';
import { getCalculationEndpoint } from '@/shared/lib/calculation-endpoints';
import { buildComparisonChartData, getLeadingComparisonResult } from '@/features/comparison-engine/components/bond-comparison/display-model';
import { ComparisonConfigurationPanel } from '@/features/comparison-engine/components/bond-comparison/ComparisonConfigurationPanel';
import { ComparisonResultsDashboard } from '@/features/comparison-engine/components/bond-comparison/ComparisonResultsDashboard';

export const BondComparisonContainer = () => {
    const { locale: language } = useAppI18n();
    const currencyFormatter = useCurrencyFormatter(language, {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    });
    const { definitions } = useBondDefinitions();
    const { defaults: macroDefaults } = useMacroAssumptionDefaults();
    const [initialInvestment, setInitialInvestment] = useState(10000);
    const [expectedInflation, setExpectedInflation] = useState(3.5);
    const [expectedNbpRate, setExpectedNbpRate] = useState(5.25);
    const [customInflation, setCustomInflation] = useState<number[] | undefined>(undefined);
    const [customNbpRate, setCustomNbpRate] = useState<number[] | undefined>(undefined);
    const [inflationScenario, setInflationScenario] = useState<'low' | 'base' | 'high'>('base');
    const [duration, setDuration] = useState(10);
    const [selectedBonds, setSelectedBonds] = useState<BondType[]>([
        BondType.EDO,
        BondType.COI,
        BondType.ROR,
    ]);
    const [envelope, setEnvelope] = useState<BondComparisonCalculationEnvelope | null>(null);
    const { isCalculating, post } = useCalculationRequest();
    const [showRealValue, setShowRealValue] = useState(false);
    const [isDirty, setIsDirty] = useState(true);
    const hasTouchedMacroAssumptions = React.useRef(false);
    useEffect(() => {
        if (!customInflation) {
            return;
        }
        const nextLength = Math.max(1, Math.round(duration));
        if (customInflation.length === nextLength) {
            return;
        }
        const timer = window.setTimeout(() => {
            setCustomInflation(Array.from({ length: nextLength }, (_, index) => customInflation[index] ?? expectedInflation));
        }, 0);

        return () => window.clearTimeout(timer);
    }, [customInflation, duration, expectedInflation]);
    useEffect(() => {
        if (!customNbpRate) {
            return;
        }
        const nextLength = Math.max(1, Math.round(duration));
        if (customNbpRate.length === nextLength) {
            return;
        }
        const timer = window.setTimeout(() => {
            setCustomNbpRate(Array.from({ length: nextLength }, (_, index) => customNbpRate[index] ?? expectedNbpRate));
        }, 0);

        return () => window.clearTimeout(timer);
    }, [customNbpRate, duration, expectedNbpRate]);
    useEffect(() => {
        if (!macroDefaults || hasTouchedMacroAssumptions.current) {
            return;
        }
        const timer = window.setTimeout(() => {
            setExpectedInflation(macroDefaults.expectedInflation);
            setExpectedNbpRate(macroDefaults.expectedNbpRate);
        }, 0);

        return () => window.clearTimeout(timer);
    }, [macroDefaults]);
    const results = useMemo(() => (Array.isArray(envelope?.result) ? envelope.result : []), [envelope]);
    const purchaseDate = new Date().toISOString().split('T')[0];
    const withdrawalDate = addYears(new Date(purchaseDate), duration)
        .toISOString()
        .split('T')[0];
    const calculateComparison = useCallback(async () => {
        if (selectedBonds.length === 0) {
            return;
        }
        setIsDirty(false);
        try {
            const nextEnvelope = await post<BondComparisonCalculationEnvelope>(
                getCalculationEndpoint(ScenarioKind.BOND_COMPARISON),
                {
                    mode: 'normalized',
                    bondTypes: selectedBonds,
                    initialInvestment,
                    purchaseDate,
                    withdrawalDate,
                    expectedInflation,
                    expectedNbpRate,
                    customInflation,
                    customNbpRate,
                    inflationScenario,
                    taxStrategy: TaxStrategy.STANDARD,
                },
            );
            setEnvelope(nextEnvelope);
        }
        catch (error) {
            console.error('Comparison failed:', error);
        }
    }, [
        customInflation,
        customNbpRate,
        expectedInflation,
        expectedNbpRate,
        inflationScenario,
        initialInvestment,
        purchaseDate,
        post,
        selectedBonds,
        withdrawalDate,
    ]);
    const onUpdateAssumption = (key: string, value: unknown) => {
        setIsDirty(true);
        hasTouchedMacroAssumptions.current = true;
        if (key === 'expectedInflation')
            setExpectedInflation(value as number);
        if (key === 'expectedNbpRate')
            setExpectedNbpRate(value as number);
        if (key === 'customInflation') {
            const nextPath = value as number[] | undefined;
            setCustomInflation(nextPath
                ? Array.from({ length: Math.max(1, Math.round(duration)) }, (_, index) => nextPath[index] ?? expectedInflation)
                : undefined);
        }
        if (key === 'customNbpRate') {
            const nextPath = value as number[] | undefined;
            setCustomNbpRate(nextPath
                ? Array.from({ length: Math.max(1, Math.round(duration)) }, (_, index) => nextPath[index] ?? expectedNbpRate)
                : undefined);
        }
        if (key === 'inflationScenario')
            setInflationScenario(value as 'low' | 'base' | 'high');
    };
    const toggleBond = (type: BondType) => {
        setIsDirty(true);
        setSelectedBonds((prev) => prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]);
    };
    const chartData = useMemo(() => buildComparisonChartData(results, showRealValue), [results, showRealValue]);
    const formatCurrency = (value: number) => currencyFormatter.format(value);
    const leadingResult = useMemo(() => getLeadingComparisonResult(results), [results]);
    return (<div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ComparisonConfigurationPanel
          initialInvestment={initialInvestment}
          onInitialInvestmentChange={(value) => {
            setInitialInvestment(value);
            setIsDirty(true);
          }}
          duration={duration}
          onDurationChange={(value) => {
            setDuration(value);
            setIsDirty(true);
          }}
          expectedInflation={expectedInflation}
          expectedNbpRate={expectedNbpRate}
          customInflation={customInflation}
          customNbpRate={customNbpRate}
          onUpdateAssumption={onUpdateAssumption}
          selectedBonds={selectedBonds}
          onToggleBond={toggleBond}
          showRealValue={showRealValue}
          onShowRealValueChange={setShowRealValue}
        />

        <div className="min-w-0 space-y-8">
          <ComparisonResultsDashboard
            results={results}
            envelope={envelope}
        loading={isCalculating}
            isDirty={isDirty}
            showRealValue={showRealValue}
            formatCurrency={formatCurrency}
            chartData={chartData}
            selectedBonds={selectedBonds}
            leadingResult={leadingResult}
            definitions={definitions}
            language={language}
            onRecalculate={calculateComparison}
          />
        </div>
      </div>
    </div>);
};





