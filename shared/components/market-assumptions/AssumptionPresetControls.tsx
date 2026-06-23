'use client';

import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';
import {
  getInflationPresetKey,
  getInflationPresetValue,
  getNbpPresetKey,
  getNbpPresetValue,
  type InflationPresetKey,
  type NbpPresetKey,
} from '@/shared/lib/market-assumptions-form-model';

export function InflationPresetControls({
  value,
  labels,
  onSelect,
}: {
  value: number;
  labels: Record<InflationPresetKey, string>;
  onSelect: (value: number) => void;
}) {
  return (
    <SegmentedControl
      value={getInflationPresetKey(value)}
      options={[
        { value: 'stable', label: `${labels.stable} (2.5%)` },
        { value: 'high', label: `${labels.high} (6%)` },
        { value: 'deflation', label: `${labels.deflation} (-1%)` },
      ]}
      onValueChange={(nextValue) => onSelect(getInflationPresetValue(nextValue as InflationPresetKey))}
      className="grid-cols-3"
      itemClassName="text-[11px] tracking-[0.06em]"
    />
  );
}

export function NbpPresetControls({
  value,
  labels,
  onSelect,
}: {
  value?: number;
  labels: Record<NbpPresetKey, string>;
  onSelect: (value: number) => void;
}) {
  return (
    <SegmentedControl
      value={getNbpPresetKey(value)}
      options={[
        { value: 'current', label: `${labels.current} (5.25%)` },
        { value: 'high', label: `${labels.high} (6.75%)` },
        { value: 'low', label: `${labels.low} (3.75%)` },
      ]}
      onValueChange={(nextValue) => onSelect(getNbpPresetValue(nextValue as NbpPresetKey))}
      className="grid-cols-3"
      itemClassName="text-[11px] tracking-[0.06em]"
    />
  );
}
