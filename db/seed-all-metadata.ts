import { seedAllMetadata } from './seed/index';

async function seed() {
  await seedAllMetadata();
  console.log('All metadata seeding completed.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
