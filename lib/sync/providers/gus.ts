import { SyncProvider, SyncRecord } from "../types";

interface GusBdlValue {
  year: string;
  val: number;
  attrId: number;
}

export class GusSyncProvider implements SyncProvider {
  name = "GUS BDL (Polish Economic Data)";
  seriesSlug = "pl-cpi";
  private baseUrl = "https://bdl.stat.gov.pl/api/v1/data/by-variable";

  private indicators = [
    { variableId: '72305', slug: 'pl-unemployment', frequency: 'monthly' }
  ];

  async fetchData(startDate: string, endDate: string): Promise<SyncRecord[]> {
    const results: SyncRecord[] = [];
    const startYear = startDate.substring(0, 4);
    const endYear = endDate.substring(0, 4);

    for (const ind of this.indicators) {
      try {
        const response = await fetch(`${this.baseUrl}/${ind.variableId}?unit-level=2&year=${startYear}&year=${endYear}&format=json`);
        if (!response.ok) continue;
        
        const data = await response.json();
        
        if (data.results && data.results[0]?.values) {
          const values = data.results[0].values as GusBdlValue[];
          results.push(...values.map((v: GusBdlValue) => {
            return {
              seriesSlug: ind.slug,
              date: `${v.year}-${String(results.length % 12 + 1).padStart(2, '0')}-01`,
              value: v.val
            };
          }));
        }
      } catch (error) {
        console.warn(`[GUS Provider] Failed for ${ind.slug}:`, error);
      }
    }

    return results;
  }
}
