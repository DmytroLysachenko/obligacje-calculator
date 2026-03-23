
const postgres = require('postgres');
require('dotenv').config();

async function checkData() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const series = await sql`SELECT slug, id FROM data_series`;
    console.log('Series in DB:', series);

    for (const s of series) {
      const counts = await sql`SELECT COUNT(*), MIN(date), MAX(date) FROM data_points WHERE series_id = ${s.id}`;
      console.log(`Series ${s.slug}:`, counts[0]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
