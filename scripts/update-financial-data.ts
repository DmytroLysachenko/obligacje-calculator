import { FinancialDataGateway } from '../lib/sync/data-gateway';

async function updateData() {
  console.log('🔄 Starting Automated Financial Data Sync Pipeline...');

  try {
    // 1. Fetch GUS Inflation (CPI)
    console.log('📥 Fetching CPI from Statistics Poland (GUS)...');
    const gusData = await FinancialDataGateway.fetchInflationFromGUS();
    console.log(\`✅ Successfully fetched GUS data from \${gusData.source} at \${gusData.timestamp}\`);

    // 2. Fetch NBP Exchange Rates
    console.log('📥 Fetching Exchange Rates from NBP...');
    const nbpData = await FinancialDataGateway.fetchRatesFromNBP();
    console.log(\`✅ Successfully fetched NBP data from \${nbpData.source} at \${nbpData.timestamp}\`);

    // 3. Fetch WIBOR from Stooq
    console.log('📥 Fetching WIBOR 3M from Stooq...');
    const wiborData = await FinancialDataGateway.fetchWiborFromStooq('plopln3m');
    console.log(\`✅ Successfully fetched Stooq data from \${wiborData.source} at \${wiborData.timestamp}\`);

    // 4. Fetch Eurostat HICP
    console.log('📥 Fetching Harmonized Inflation (HICP) from Eurostat...');
    const eurostatData = await FinancialDataGateway.fetchHICPFromEurostat();
    console.log(\`✅ Successfully fetched Eurostat data from \${eurostatData.source} at \${eurostatData.timestamp}\`);

    console.log('\\n🎉 All financial data sources successfully synchronized!');
    console.log('Note: Data transformations and DB insertion (upsert) will run via Web Workers in the next pipeline step to protect the main event loop.');

  } catch (err) {
    console.error('❌ Failed to sync financial data pipeline:', err);
    process.exit(1);
  }
}

updateData();
