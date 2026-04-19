import { FinancialDataGateway } from '../lib/sync/data-gateway';

async function updateData() {
  console.log('🚀 Starting Financial Data Update...');

  try {
    // 1. Fetch Inflation from GUS
    console.log('📥 Fetching CPI from Statistics Poland (GUS)...');
    const gusData = await FinancialDataGateway.fetchInflationFromGUS();
    console.log('✅ Successfully fetched GUS data from ' + gusData.source + ' at ' + gusData.timestamp);

    // 2. Fetch NBP Rates
    console.log('📥 Fetching Exchange Rates from NBP...');
    const nbpData = await FinancialDataGateway.fetchRatesFromNBP();
    console.log('✅ Successfully fetched NBP data from ' + nbpData.source + ' at ' + nbpData.timestamp);

    console.log('\n✨ All updates completed successfully!');
  } catch (error) {
    console.error('❌ Data update failed:', error);
    process.exit(1);
  }
}

updateData();
