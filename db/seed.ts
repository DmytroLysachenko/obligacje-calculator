import 'dotenv/config';
import {seedBondMetadata, seedSeriesMetadata} from './seed/index';

async function seed() {
  console.log('--- Database Seeding Started ---');

  console.log('Seeding data series metadata...');
  const seriesCount = await seedSeriesMetadata();
  console.log(`Successfully seeded ${seriesCount} data series.`);

  console.log('Seeding polish bonds metadata...');
  const bondCount = await seedBondMetadata();
  console.log(`Successfully seeded ${bondCount} bond types.`);

  console.log('--- Database Seeding Complete ---');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
