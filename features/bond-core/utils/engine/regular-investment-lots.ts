import { differenceInMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { Decimal } from 'decimal.js';

import { BondType, LotBreakdown, RegularInvestmentInputs, TaxStrategy } from '../../types';

import { getExpectedInflationForYearIndex } from './inflation';
import { determineInterestRate } from './rate-resolution';
import { calculateEarlyWithdrawalFee } from './redemption';
import {
  calculateTaxAmount,
  settlementPolicyFor,
  shouldWithholdPeriodicTax,
} from './tax-settlement';

export function updateRegularInvestmentLotsForMonth({
  lots,
  currentMonthDate,
  startPurchaseDate,
  bondDuration,
  bondType,
  firstYearRate,
  expectedInflation,
  expectedNbpRate,
  margin,
  isInflationIndexed,
  currentLagInflation,
  currentLagNbp,
  customInflation,
  customNbpRate,
  isCapitalized,
  taxStrategy,
  taxRate,
  bondPrice,
  nominalValue,
  earlyWithdrawalFee,
  redemptionFeeCap,
}: {
  lots: LotBreakdown[];
  currentMonthDate: Date;
  startPurchaseDate: Date;
  bondDuration: number;
  bondType: BondType;
  firstYearRate: number;
  expectedInflation: RegularInvestmentInputs['expectedInflation'];
  expectedNbpRate: number;
  margin: number;
  isInflationIndexed: boolean;
  currentLagInflation?: number;
  currentLagNbp?: number;
  customInflation?: number[];
  customNbpRate?: number[];
  isCapitalized: boolean;
  taxStrategy: TaxStrategy;
  taxRate: number;
  bondPrice: Decimal.Value;
  nominalValue: Decimal.Value;
  earlyWithdrawalFee: number;
  redemptionFeeCap?: 'interest' | 'principal';
}) {
  lots.forEach((lot) => {
    if (lot.settledValue !== undefined) {
      return;
    }
    const lotPurchaseDate = parseISO(lot.purchaseDate);
    const lotMaturityDate = parseISO(lot.maturityDate);

    if (!isAfter(currentMonthDate, lotPurchaseDate)) {
      return;
    }

    const monthsHeld = differenceInMonths(currentMonthDate, lotPurchaseDate);
    const bondDurationMonths = Math.round(bondDuration * 12);
    const dLotGrossValue = new Decimal(lot.grossValue);
    const dLotAccumulatedInterest = new Decimal(lot.accumulatedInterest);
    const dLotTax = new Decimal(lot.tax);
    const shouldWithholdTaxForLot = shouldWithholdPeriodicTax(taxStrategy, isCapitalized);

    if (monthsHeld <= bondDurationMonths) {
      const monthIndex = monthsHeld - 1;
      const globalMonthIndex = Math.max(0, differenceInMonths(currentMonthDate, startPurchaseDate));
      const globalYearIndex = Math.floor(globalMonthIndex / 12);
      const inflationResetYearIndex = Math.max(0, globalYearIndex - 1);
      const projectedInflation = getExpectedInflationForYearIndex(
        expectedInflation,
        customInflation,
        inflationResetYearIndex,
      );
      const currentInterestRate = determineInterestRate(
        bondType,
        monthIndex,
        firstYearRate,
        projectedInflation,
        expectedNbpRate,
        margin,
        isInflationIndexed,
        currentLagInflation,
        currentLagNbp,
        customInflation?.[inflationResetYearIndex],
        customNbpRate?.[globalYearIndex],
      );
      const interestThisMonth = dLotGrossValue.times(
        currentInterestRate.dividedBy(12).dividedBy(100),
      );
      const newAccumulatedInterest = dLotAccumulatedInterest.plus(interestThisMonth);

      if (isCapitalized) {
        // Issuer capitalization is annual for the relevant families. Monthly
        // UI aggregation must not turn that into monthly compounding.
        if (monthsHeld % 12 === 0) {
          lot.grossValue = dLotGrossValue.plus(newAccumulatedInterest).toNumber();
          lot.accumulatedInterest = 0;
        } else {
          lot.accumulatedInterest = newAccumulatedInterest.toNumber();
        }
      } else if (shouldWithholdTaxForLot) {
        lot.accumulatedInterest = newAccumulatedInterest.toNumber();
        const taxThisMonth = calculateTaxAmount(
          interestThisMonth,
          taxStrategy,
          settlementPolicyFor(taxStrategy),
          taxRate,
        );
        lot.tax = dLotTax.plus(taxThisMonth).toNumber();
      } else {
        lot.accumulatedInterest = newAccumulatedInterest.toNumber();
      }
    }

    lot.isMatured = !isBefore(currentMonthDate, lotMaturityDate);

    const dFinalAccumulatedInterest = new Decimal(lot.accumulatedInterest);
    const units = new Decimal(lot.investedAmount).dividedBy(bondPrice).floor();
    const nominalStarting = units.times(nominalValue);
    const isLotEarlyWithdrawal = !lot.isMatured;
    const dFinalFee = calculateEarlyWithdrawalFee(
      bondType,
      isLotEarlyWithdrawal,
      isLotEarlyWithdrawal,
      dFinalAccumulatedInterest,
      units,
      earlyWithdrawalFee,
      redemptionFeeCap,
    );
    lot.earlyWithdrawalFee = dFinalFee.toNumber();

    const currentGrossValue = isCapitalized
      ? new Decimal(lot.grossValue).plus(dFinalAccumulatedInterest)
      : units.times(nominalValue).plus(dFinalAccumulatedInterest);
    const currentTaxPaid = shouldWithholdTaxForLot
      ? new Decimal(lot.tax)
      : calculateTaxAmount(
          Decimal.max(
            0,
            taxStrategy === TaxStrategy.IKZE
              ? currentGrossValue.minus(dFinalFee)
              : (isCapitalized
                  ? currentGrossValue.minus(nominalStarting)
                  : dFinalAccumulatedInterest
                ).minus(dFinalFee),
          ),
          taxStrategy,
          settlementPolicyFor(taxStrategy),
          taxRate,
        );

    lot.netValue = currentGrossValue.minus(currentTaxPaid).minus(dFinalFee).toNumber();
    if (!shouldWithholdTaxForLot) {
      lot.tax = currentTaxPaid.toNumber();
    }
  });
}

export function summarizeRegularInvestmentLots({
  lots,
  bondPrice,
  nominalValue,
  isCapitalized,
}: {
  lots: LotBreakdown[];
  bondPrice: Decimal.Value;
  nominalValue: Decimal.Value;
  isCapitalized: boolean;
}) {
  return lots.reduce(
    (summary, lot) => {
      // A matured lot has been moved to the cash account exactly once. Its
      // immutable history remains available for the lot table but it cannot
      // also be counted as an active holding.
      if (lot.isMatured) {
        return summary;
      }
      const units = new Decimal(lot.investedAmount).dividedBy(bondPrice).floor();
      const nominalStarting = units.times(nominalValue);

      return {
        nominalValue: summary.nominalValue.plus(
          isCapitalized
            ? new Decimal(lot.grossValue).plus(new Decimal(lot.accumulatedInterest))
            : nominalStarting.plus(new Decimal(lot.accumulatedInterest)),
        ),
        profit: summary.profit.plus(new Decimal(lot.netValue).minus(lot.investedAmount)),
        tax: summary.tax.plus(lot.tax),
        fees: summary.fees.plus(lot.earlyWithdrawalFee),
      };
    },
    {
      nominalValue: new Decimal(0),
      profit: new Decimal(0),
      tax: new Decimal(0),
      fees: new Decimal(0),
    },
  );
}
