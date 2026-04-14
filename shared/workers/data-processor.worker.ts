export type WorkerMessage = 
  | { type: 'PARSE_STOOQ_CSV'; payload: { csv: string } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'TRANSFORM_EUROSTAT_JSON'; payload: { json: any } };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  if (type === 'PARSE_STOOQ_CSV') {
    try {
      const csvText = payload.csv;
      const lines = csvText.split('\n');
      const dataPoints = lines.slice(1).map((line: string) => {
        const parts = line.split(',');
        // Typical Stooq format: Date,Open,High,Low,Close,Volume
        const date = parts[0];
        const close = parts[4];
        return { date, value: parseFloat(close) };
      }).filter((p: { date: string, value: number }) => !isNaN(p.value));

      self.postMessage({ type: 'PARSE_SUCCESS', result: dataPoints });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      self.postMessage({ type: 'PARSE_ERROR', error: errorMsg });
    }
  } else if (type === 'TRANSFORM_EUROSTAT_JSON') {
    try {
      const json = payload.json;
      // Eurostat JSON-stat format transformation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataPoints = Object.keys(json.value || {}).map((key: string) => ({
        index: key,
        value: json.value[key]
      }));
      self.postMessage({ type: 'PARSE_SUCCESS', result: dataPoints });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      self.postMessage({ type: 'PARSE_ERROR', error: errorMsg });
    }
  }
};
