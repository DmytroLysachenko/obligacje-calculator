import {db} from '../index';
import {dataSeries} from '../schema';

export async function seedWiborSeriesMetadata() {
  await db.insert(dataSeries).values([
    {
      slug: 'wibor-3m',
      name: 'WIBOR 3M',
      category: 'instrument',
      unit: '%',
      frequency: 'monthly',
      dataSource: 'Stooq',
    },
    {
      slug: 'wibor-6m',
      name: 'WIBOR 6M',
      category: 'instrument',
      unit: '%',
      frequency: 'monthly',
      dataSource: 'Stooq',
    },
  ]).onConflictDoNothing();
}
