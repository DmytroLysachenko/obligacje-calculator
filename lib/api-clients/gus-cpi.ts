import { parseISO, startOfMonth } from "date-fns";

export interface GusCpiPoint {
  date: string;
  value: number;
}

const GUS_CPI_ARCHIVE_PAGE_URL =
  "https://stat.gov.pl/obszary-tematyczne/ceny-handel/wskazniki-cen/wskazniki-cen-towarow-i-uslug-konsumpcyjnych-pot-inflacja-/miesieczne-wskazniki-cen-towarow-i-uslug-konsumpcyjnych-od-1982-roku/";

const GUS_CPI_PRESENTATION_LABEL = "Analogiczny miesiac poprzedniego roku = 100";

function normalizePolishText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDecimal(value: string) {
  return Number.parseFloat(value.replace(",", "."));
}

function buildMonthDate(year: string, month: string) {
  return `${year}-${month.padStart(2, "0")}-01`;
}

export function parseGusCpiCsvContent(csvText: string, startDate?: string, endDate?: string): GusCpiPoint[] {
  const start = startDate ? startOfMonth(parseISO(startDate)) : null;
  const end = endDate ? startOfMonth(parseISO(endDate)) : null;
  const rows = csvText.split(/\r?\n/);
  const points: GusCpiPoint[] = [];

  for (const row of rows.slice(1)) {
    if (!row.trim()) continue;

    const parts = row.split(";");
    if (parts.length < 6) continue;

    const presentation = normalizePolishText(parts[2] ?? "");
    const year = (parts[3] ?? "").trim();
    const month = (parts[4] ?? "").trim();
    const rawValue = (parts[5] ?? "").trim();

    if (presentation !== GUS_CPI_PRESENTATION_LABEL) continue;
    if (!year || !month || !rawValue) continue;

    const indexValue = parseDecimal(rawValue);
    if (!Number.isFinite(indexValue)) continue;

    const date = buildMonthDate(year, month);
    const monthDate = startOfMonth(parseISO(date));

    if (start && monthDate < start) continue;
    if (end && monthDate > end) continue;

    // GUS publishes CPI here as an index where the same month of the previous year = 100.
    // The app expects an annual inflation rate in percentage points, e.g. 103.2 -> 3.2.
    points.push({
      date,
      value: Number((indexValue - 100).toFixed(2)),
    });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export class GusCpiApiClient {
  static readonly archivePageUrl = GUS_CPI_ARCHIVE_PAGE_URL;

  async fetchHistoricalData(startDate?: string, endDate?: string): Promise<GusCpiPoint[]> {
    const archiveResponse = await fetch(GUS_CPI_ARCHIVE_PAGE_URL, {
      headers: {
        "user-agent": "obligacje-calculator/1.0",
      },
      cache: "no-store",
    });

    if (!archiveResponse.ok) {
      throw new Error(`GUS CPI archive page error: ${archiveResponse.status} ${archiveResponse.statusText}`);
    }

    const archiveHtml = await archiveResponse.text();
    const csvPathMatch = archiveHtml.match(
      /\/download\/gfx\/[^"'<>]+miesieczne_wskazniki_cen_towarow_i_uslug_konsumpcyjnych_od_1982_roku[^"'<>]*\.csv/i,
    );

    if (!csvPathMatch) {
      throw new Error("Could not locate official GUS CPI CSV link on archive page.");
    }

    const csvUrl = new URL(csvPathMatch[0], GUS_CPI_ARCHIVE_PAGE_URL).toString();
    const csvResponse = await fetch(csvUrl, {
      headers: {
        "user-agent": "obligacje-calculator/1.0",
      },
      cache: "no-store",
    });

    if (!csvResponse.ok) {
      throw new Error(`GUS CPI CSV error: ${csvResponse.status} ${csvResponse.statusText}`);
    }

    const buffer = await csvResponse.arrayBuffer();
    const decoder = new TextDecoder("windows-1250");
    const csvText = decoder.decode(buffer);

    return parseGusCpiCsvContent(csvText, startDate, endDate);
  }
}
