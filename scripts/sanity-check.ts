import { calculateBondInvestment } from '../features/bond-core/utils/calculations';
import { BondType, TaxStrategy, InterestPayout } from '../features/bond-core/types';
import { generateAdvisorTips } from '../features/bond-core/utils/advisor-rules';

async function runSanityCheck() {
  console.log('🧪 Running Final Logic & UX Sanity Check...');

  // Edge Case 1: Negative Inflation (Deflation) on COI bonds
  const coiInputs = {
    bondType: BondType.COI,
    initialInvestment: 10000,
    firstYearRate: 6.5,
    margin: 1.25,
    expectedInflation: -2.0, // Extreme edge case: Deflation!
    expectedNbpRate: 5.25,
    actualDuration: 4,
    earlyWithdrawalFee: 0.70,
    taxStrategy: TaxStrategy.STANDARD,
    isCapitalized: false,
    payoutFrequency: InterestPayout.YEARLY,
    purchaseDate: new Date(),
    withdrawalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 4)),
    isRebought: false,
    rebuyDiscount: 0,
    historicalData: {},
  };

  const coiResult = calculateBondInvestment(coiInputs);
  
  // @ts-ignore
  if (coiResult.mathWarning) {
    console.error('❌ Math Guard failed for negative inflation.');
    process.exit(1);
  }
  
  console.log(\`✅ COI Calculation with deflation succeeded. Final Value: \${coiResult.netPayoutValue.toFixed(2)} PLN\`);

  // UX Verification: Advisor Tips
  const tips = generateAdvisorTips(BondType.COI, coiResult, -2.0, 5.25);
  console.log(\`✅ Generated \${tips.length} Advisor tips for UX.\`);
  tips.forEach(t => console.log(\`   💡 [\${t.type}] \${t.title}: \${t.message}\`));

  console.log('\\n🎉 All High-Level Logic & UX Sanity Checks passed!');
}

runSanityCheck().catch(console.error);
