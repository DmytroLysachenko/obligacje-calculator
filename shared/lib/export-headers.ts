type TranslateFn = (key: string) => string;

export function buildTimelineExportHeaders(t: TranslateFn) {
  return {
    date: t('common.as_of'),
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

export function buildLotsExportHeaders(t: TranslateFn) {
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

export function buildComparisonExportHeaders(t: TranslateFn) {
  return {
    date: t('common.as_of'),
    period: t('common.period'),
    cycleA: `${t('comparison.scenario_a')} ${t('bonds.cycle')}`,
    cycleB: `${t('comparison.scenario_b')} ${t('bonds.cycle')}`,
    cadenceA: `${t('comparison.scenario_a')} ${t('common.meaning')}`,
    cadenceB: `${t('comparison.scenario_b')} ${t('common.meaning')}`,
    scenarioA: `${t('comparison.scenario_a')} ${t('bonds.final_nominal_value')}`,
    scenarioB: `${t('comparison.scenario_b')} ${t('bonds.final_nominal_value')}`,
    realValueA: `${t('comparison.scenario_a')} ${t('common.real_value')}`,
    realValueB: `${t('comparison.scenario_b')} ${t('common.real_value')}`,
    cashPaidA: `${t('comparison.scenario_a')} ${t('bonds.interest_payment')}`,
    cashPaidB: `${t('comparison.scenario_b')} ${t('bonds.interest_payment')}`,
    leader: t('comparison.table_title'),
    netProfitA: `${t('comparison.scenario_a')} ${t('common.net_profit')}`,
    netProfitB: `${t('comparison.scenario_b')} ${t('common.net_profit')}`,
    projectionA: `${t('comparison.scenario_a')} ${t('bonds.projected')}`,
    projectionB: `${t('comparison.scenario_b')} ${t('bonds.projected')}`,
    rateA: `${t('comparison.scenario_a')} ${t('bonds.rate_source')}`,
    rateB: `${t('comparison.scenario_b')} ${t('bonds.rate_source')}`,
    eventsA: `${t('comparison.scenario_a')} ${t('common.events')}`,
    eventsB: `${t('comparison.scenario_b')} ${t('common.events')}`,
  } as const;
}
