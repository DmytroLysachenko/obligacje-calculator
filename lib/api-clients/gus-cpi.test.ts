import { describe, expect, it } from "vitest";
import { parseGusCpiCsvContent } from "./gus-cpi";

describe("parseGusCpiCsvContent", () => {
  it("keeps only year-over-year CPI rows and converts 100-based indexes to percentages", () => {
    const csv = [
      "Nazwa zmiennej;Jednostka terytorialna;Sposob prezentacji;Rok;Miesiac;Wartosc;Flaga;;;",
      "Wskaznik cen towarow i uslug konsumpcyjnych;Polska;Grudzien poprzedniego roku = 100;2026;4;102,7;;;;",
      "Wskaznik cen towarow i uslug konsumpcyjnych;Polska;Analogiczny miesiac poprzedniego roku = 100;2026;3;103,0;;;;",
      "Wskaznik cen towarow i uslug konsumpcyjnych;Polska;Analogiczny miesiac poprzedniego roku = 100;2026;4;103,2;;;;",
      "Wskaznik cen towarow i uslug konsumpcyjnych;Polska;Poprzedni miesiac = 100;2026;4;100,6;;;;",
    ].join("\n");

    expect(parseGusCpiCsvContent(csv)).toEqual([
      { date: "2026-03-01", value: 3 },
      { date: "2026-04-01", value: 3.2 },
    ]);
  });

  it("filters to the requested range", () => {
    const csv = [
      "Nazwa zmiennej;Jednostka terytorialna;Sposob prezentacji;Rok;Miesiac;Wartosc;Flaga;;;",
      "Wskaznik cen towarow i uslug konsumpcyjnych;Polska;Analogiczny miesiac poprzedniego roku = 100;2026;1;102,1;;;;",
      "Wskaznik cen towarow i uslug konsumpcyjnych;Polska;Analogiczny miesiac poprzedniego roku = 100;2026;2;102,1;;;;",
      "Wskaznik cen towarow i uslug konsumpcyjnych;Polska;Analogiczny miesiac poprzedniego roku = 100;2026;3;103,0;;;;",
    ].join("\n");

    expect(parseGusCpiCsvContent(csv, "2026-02-01", "2026-02-28")).toEqual([
      { date: "2026-02-01", value: 2.1 },
    ]);
  });
});
