export interface FinancialDataResponse {
  source: string;
  data: unknown;
  timestamp: string;
}

import { GusCpiApiClient } from "./../api-clients/gus-cpi";

export class FinancialDataGateway {
  /**
   * Fetches official Polish monthly inflation data (CPI) from Statistics Poland (GUS).
   */
  static async fetchInflationFromGUS(): Promise<FinancialDataResponse> {
    try {
      const client = new GusCpiApiClient();
      const data = await client.fetchHistoricalData();
      return { source: 'GUS', data, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to fetch from GUS:', error);
      throw error;
    }
  }

  /**
   * Fetches official current and historical exchange rates / gold from National Bank of Poland (NBP).
   */
  static async fetchRatesFromNBP(): Promise<FinancialDataResponse> {
    const url = 'https://api.nbp.pl/api/exchangerates/tables/A/?format=json';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`NBP API Error: ${response.statusText}`);
      const data = await response.json();
      return { source: 'NBP', data, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to fetch from NBP:', error);
      throw error;
    }
  }

  /**
   * Fetches unofficial WIBOR data from Stooq's CSV export endpoint.
   */
  static async fetchWiborFromStooq(ticker: string = 'plopln3m'): Promise<FinancialDataResponse> {
    const url = `https://stooq.pl/q/d/l/?s=${ticker}&i=d`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Stooq API Error: ${response.statusText}`);
      const data = await response.text(); // CSV format
      return { source: 'Stooq', data, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to fetch from Stooq:', error);
      throw error;
    }
  }

  /**
   * Fetches EU-harmonized inflation (HICP) from Eurostat.
   */
  static async fetchHICPFromEurostat(): Promise<FinancialDataResponse> {
    const url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?format=JSON&geo=PL&coicop=CP00';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Eurostat API Error: ${response.statusText}`);
      const data = await response.json();
      return { source: 'Eurostat', data, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Failed to fetch from Eurostat:', error);
      throw error;
    }
  }
}
