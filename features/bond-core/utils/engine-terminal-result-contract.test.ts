import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CalculationDomainError } from '../errors';
import { BondType, InterestPayout, TaxStrategy } from '../types';
import { calculateBondInvestment, calculateReverseBondInvestment } from './calculations';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expectNotContains(source, fragment);
  }
}

const baseInputs = {
  initialInvestment: 10000,
  firstYearRate: 5,
  expectedInflation: 3,
  expectedNbpRate: 5,
  margin: 2,
  duration: 10,
  earlyWithdrawalFee: 2,
  taxRate: 19,
  bondType: BondType.EDO,
  isCapitalized: true,
  payoutFrequency: InterestPayout.MATURITY,
  purchaseDate: '2026-05-27T00:00:00.000Z',
  withdrawalDate: '2036-05-27T00:00:00.000Z',
  isRebought: false,
  rebuyDiscount: 0.1,
  taxStrategy: TaxStrategy.STANDARD,
};

describe('single-bond terminal result contract', () => {
  it('does not leave fake empty CalculationResult sentinels in the engine', () => {
    const singleBondSource = read('features/bond-core/utils/engine/single-bond-engine.ts');
    const reverseBondSource = read('features/bond-core/utils/engine/reverse-bond-engine.ts');

    expectContains(singleBondSource, 'throw createNumericFaultError');
    expectContains(
      singleBondSource,
      'Single-bond calculation exited without reaching the selected withdrawal date.',
    );
    expectContains(singleBondSource, 'return createFinalSingleBondResult({');
    expectContains(reverseBondSource, 'function assertSingleBondTerminalResult(');
    expectContains(reverseBondSource, 'asserts result is CalculationResult');
    expectContains(reverseBondSource, 'final timeline point is not a withdrawal checkpoint');
    expectContains(reverseBondSource, 'let result: CalculationResult | null = null;');
    expectContains(
      reverseBondSource,
      "assertSingleBondTerminalResult(result, 'Reverse bond calculation');",
    );
    expectNoFragments(`${singleBondSource}\n${reverseBondSource}`, [
      'return {} as CalculationResult',
      'let result: CalculationResult = {} as CalculationResult',
    ]);
  });

  it('rejects a same-day single-bond scenario instead of returning a fake empty object', () => {
    expect(() =>
      calculateBondInvestment({
        ...baseInputs,
        withdrawalDate: baseInputs.purchaseDate,
      }),
    ).toThrow(CalculationDomainError);

    try {
      calculateBondInvestment({
        ...baseInputs,
        withdrawalDate: baseInputs.purchaseDate,
      });
      throw new Error('Expected same-day calculation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationDomainError);
      expect((error as CalculationDomainError).code).toBe('CALCULATION_NUMERIC_FAULT');
      expect((error as CalculationDomainError).message).toContain(
        'without reaching the selected withdrawal date',
      );
      expect((error as CalculationDomainError).details).toMatchObject({
        purchaseDate: baseInputs.purchaseDate,
        withdrawalDate: baseInputs.purchaseDate,
      });
    }
  });

  it('still returns a terminal withdrawal checkpoint for valid single-bond calculations', () => {
    const result = calculateBondInvestment(baseInputs);
    const finalPoint = result.timeline[result.timeline.length - 1];

    expect(result.timeline.length).toBeGreaterThan(1);
    expect(finalPoint.isWithdrawal).toBe(true);
    expect(finalPoint.cycleEndDate).toBe(baseInputs.withdrawalDate);
    expect(result.netPayoutValue).toBeGreaterThan(baseInputs.initialInvestment);
    expect(Number.isFinite(result.finalRealValue)).toBe(true);
  });

  it('keeps reverse calculation terminal and annotates target output after validation', () => {
    const result = calculateReverseBondInvestment({
      ...baseInputs,
      targetNetSum: 15000,
    });
    const finalPoint = result.timeline[result.timeline.length - 1];

    expect(finalPoint.isWithdrawal).toBe(true);
    expect(result.netPayoutValue).toBeGreaterThanOrEqual(15000);
    expect(result.calculationNotes?.join('\n')).toContain('Target net sum: 15000 PLN');
    expect(result.initialInvestment).toBeGreaterThan(0);
    expect(result.initialInvestment % 100).toBe(0);
  });

  it('does not hide invalid reverse scenarios behind a mutated placeholder result', () => {
    try {
      calculateReverseBondInvestment({
        ...baseInputs,
        withdrawalDate: baseInputs.purchaseDate,
        targetNetSum: 12000,
      });
      throw new Error('Expected invalid reverse calculation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationDomainError);
      expect((error as CalculationDomainError).code).toBe('CALCULATION_NUMERIC_FAULT');
      expect((error as CalculationDomainError).message).toContain(
        'without reaching the selected withdrawal date',
      );
    }
  });

  it('keeps terminal result checks narrow to single-bond paths', () => {
    const regularSource = read('features/bond-core/utils/engine/regular-investment-engine.ts');

    expectContains(regularSource, 'export const calculateRegularInvestment = withMathGuard');
    expectContains(
      regularSource,
      'return createRegularInvestmentResult(totalInvested, investmentHorizonMonths / 12, timeline, lots);',
    );
    expectNotContains(
      regularSource,
      "assertSingleBondTerminalResult(result, 'Regular investment calculation')",
    );
  });
});
