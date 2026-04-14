import { db } from "../db";
import { dataSeries } from "../db/schema";

async function main() {
  const series = await db.select().from(dataSeries);
  console.log(JSON.stringify(series.map(s => ({ slug: s.slug, name: s.name, lastDataPointDate: s.lastDataPointDate })), null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
