type TranslateFn = (key: string) => string;

export function buildTimelineExportHeaders(
  t: TranslateFn,
) {
  return {
    period: t('bonds.calculation_trace.header_year'),
    capital: t('bonds.calculation_trace.header_capital'),
    rate: t('bonds.calculation_trace.header_rate'),
    interest: t('bonds.calculation_trace.header_interest'),
    tax: t('bonds.calculation_trace.header_tax'),
    nominalValue: t('bonds.calculation_trace.header_value_after'),
    realValue: t('bonds.inflation.adjusted'),
    cycle: t('bonds.cycle'),
    cadence: t('common.meaning'),
    meaning: t('bonds.how_calculated'),
    projection: t('bonds.projected'),
    rateSource: t('bonds.rate_source'),
    reference: t('common.context_rates'),
    principalValue: t('bonds.base_value'),
    paidOutCash: t('bonds.interest_payment'),
    totalWealth: t('bonds.final_nominal_value'),
    netProfit: t('common.net_profit'),
    earlyExitValue: t('bonds.early_exit_payout'),
    events: t('common.notes'),
  } as const;
}

export function buildLotsExportHeaders(
  t: TranslateFn,
) {
  return {
    purchaseDate: t('bonds.purchase_date'),
    maturityDate: t('bonds.maturity_date'),
    invested: t('bonds.total_invested'),
    interest: t('bonds.interest'),
    tax: t('bonds.tax'),
    fee: t('bonds.early_withdrawal_fee'),
    netValue: t('bonds.net_value'),
  } as const;
}

export function buildComparisonExportHeaders(
  t: TranslateFn,
) {
  return {
    period: t('common.period'),
    scenarioA: `${t('comparison.scenario_a')} ${t('bonds.final_nominal_value')}`,
    scenarioB: `${t('comparison.scenario_b')} ${t('bonds.final_nominal_value')}`,
    leader: t('comparison.table_title'),
    netProfitA: `${t('comparison.scenario_a')} ${t('common.net_profit')}`,
    netProfitB: `${t('comparison.scenario_b')} ${t('common.net_profit')}`,
    projectionA: `${t('comparison.scenario_a')} ${t('bonds.projected')}`,
    projectionB: `${t('comparison.scenario_b')} ${t('bonds.projected')}`,
  } as const;
}
