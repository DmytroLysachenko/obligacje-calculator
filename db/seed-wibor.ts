import 'dotenv/config';
import {seedWiborSeriesMetadata} from './seed/index';

async function main() {
  try {
    await seedWiborSeriesMetadata();
    console.log('Successfully seeded WIBOR 3M and 6M base metadata series.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed WIBOR series:', error);
    process.exit(1);
  }
}

main();
