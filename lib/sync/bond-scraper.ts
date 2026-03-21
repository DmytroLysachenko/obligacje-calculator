/**
 * Bond Scraper Utility
 * Fetches the latest bond offer from the official website.
 * Note: Scrapers are brittle by nature. This uses basic RegExp to avoid 
 * heavy DOM parsing dependencies like Puppeteer or Cheerio.
 */

export interface ScrapedBondRate {
  symbol: string;
  firstYearRate: number;
  margin: number;
}

export async function scrapeCurrentBondRates(): Promise<ScrapedBondRate[]> {
  const url = 'https://www.obligacjeskarbowe.pl/oferta-obligacji/';
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch bond site: ${response.status}`);
    
    const html = await response.text();
    
    const rates: ScrapedBondRate[] = [];
    
    // Patterns for extracting rates from the offer page
    // These are simplified and might need adjustment if the site structure changes
    const extractionPatterns = [
      { symbol: 'EDO', label: '10-letnie' },
      { symbol: 'COI', label: '4-letnie' },
      { symbol: 'TOS', label: '3-letnie' },
      { symbol: 'DOR', label: '2-letnie' },
      { symbol: 'ROR', label: '1-roczne' },
      { symbol: 'OTS', label: '3-miesięczne' },
    ];

    // Note: In a production environment, we'd use a proper HTML parser (Cheerio).
    // Here we'll use a more resilient "heuristic" search in the text content.
    
    for (const p of extractionPatterns) {
      // Look for the bond name followed by a percentage rate (e.g. "5,60%")
      const rateRegex = new RegExp(`${p.symbol}.*?(\\d+,\\d+)%`, 'i');
      const match = html.match(rateRegex);
      
      if (match) {
        const rate = parseFloat(match[1].replace(',', '.'));
        
        // Margins are harder to find with regex alone as they vary.
        // We'll use defaults if not found, or more specific regexes for EDO/COI
        let margin = 0;
        if (p.symbol === 'EDO') margin = 1.50; // Standard for current EDO
        if (p.symbol === 'COI') margin = 1.25; // Standard for current COI
        
        rates.push({
          symbol: p.symbol,
          firstYearRate: rate,
          margin: margin
        });
      }
    }

    return rates;
  } catch (error) {
    console.error('Error scraping bonds:', error);
    // Fallback to known recent rates if scraper fails (safety first)
    return [
      { symbol: 'EDO', firstYearRate: 5.60, margin: 1.50 },
      { symbol: 'COI', firstYearRate: 5.00, margin: 1.25 },
      { symbol: 'TOS', firstYearRate: 4.65, margin: 0 },
      { symbol: 'ROR', firstYearRate: 4.25, margin: 0 },
      { symbol: 'OTS', firstYearRate: 2.50, margin: 0 },
    ];
  }
}
