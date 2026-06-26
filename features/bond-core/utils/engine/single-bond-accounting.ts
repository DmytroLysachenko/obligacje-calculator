import { Decimal } from 'decimal.js';

import { BondType, TaxStrategy } from '../../types';

import { calculateRealValue } from './real-return';
import { calculateEarlyWithdrawalFee } from './redemption';
import { calculateTaxAmount, shouldWithholdPeriodicTax } from './tax-settlement';

interface SingleBondCheckpointValuesInput {
  bondType: BondType;
  isEarlyWithdrawal: boolean;
  isWithdrawal: boolean;
  isMaturity: boolean;
  totalInterestEarnedSoFar: Decimal;
  numberOfBonds: Decimal;
  earlyWithdrawalFee: number;
  isCapitalized: boolean;
  currentNominalValue: Decimal;
  nominalStartingValue: Decimal;
  taxStrategy: TaxStrategy;
  taxRate: number;
  periodicTaxPaidSoFar: Decimal;
  cumulativeInflation: Decimal;
  initialInvestment: number;
  leftoverCash: Decimal;
}

export function resolveSingleBondCheckpointValues({
  bondType,
  isEarlyWithdrawal,
  isWithdrawal,
  isMaturity,
  totalInterestEarnedSoFar,
  numberOfBonds,
  earlyWithdrawalFee,
  isCapitalized,
  currentNominalValue,
  nominalStartingValue,
  taxStrategy,
  taxRate,
  periodicTaxPaidSoFar,
  cumulativeInflation,
  initialInvestment,
  leftoverCash,
}: SingleBondCheckpointValuesInput) {
  const currentNominalPrincipal = isCapitalized ? currentNominalValue : nominalStartingValue;
  const currentWithdrawalFee = calculateEarlyWithdrawalFee(
    bondType,
    isEarlyWithdrawal,
    isWithdrawal && isEarlyWithdrawal,
    totalInterestEarnedSoFar,
    numberOfBonds,
    earlyWithdrawalFee,
  );
  const hypotheticalEarlyExitFee = isMaturity
    ? new Decimal(0)
    : calculateEarlyWithdrawalFee(
        bondType,
        true,
        true,
        totalInterestEarnedSoFar,
        numberOfBonds,
        earlyWithdrawalFee,
      );
  const useOfficialRounding = isWithdrawal;
  const currentGrossValue = isCapitalized
    ? currentNominalValue
    : nominalStartingValue.plus(totalInterestEarnedSoFar);
  const currentTaxAtPoint = shouldWithholdPeriodicTax(taxStrategy, isCapitalized)
    ? periodicTaxPaidSoFar
    : calculateTaxAmount(
        Decimal.max(
          0,
          taxStrategy === TaxStrategy.IKZE
            ? currentGrossValue.minus(currentWithdrawalFee)
            : totalInterestEarnedSoFar.minus(currentWithdrawalFee),
        ),
        taxStrategy,
        useOfficialRounding,
        taxRate,
      );
  const liquidationValue = currentGrossValue.minus(currentWithdrawalFee).minus(currentTaxAtPoint);
  const hypotheticalEarlyExitValue = currentGrossValue
    .minus(hypotheticalEarlyExitFee)
    .minus(currentTaxAtPoint);
  const totalValue = liquidationValue.plus(leftoverCash);

  return {
    currentNominalPrincipal,
    currentWithdrawalFee,
    currentGrossValue,
    currentTaxAtPoint,
    liquidationValue,
    hypotheticalEarlyExitValue,
    totalValue,
    realValue: calculateRealValue(totalValue, cumulativeInflation),
    checkpointNetProfit: totalValue.minus(initialInvestment),
  };
}
