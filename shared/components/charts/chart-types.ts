export type ChartDatum = Record<string, string | number | null | undefined>;

export type SyncedChartMouseState = {
  activeTooltipIndex?: number;
};

export type TooltipPayloadEntry<TPayload = Record<string, unknown>> = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload: TPayload;
};
