import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  field: 'shared/components/forms/FormField.tsx',
  select: 'shared/components/forms/FormSelect.tsx',
  segmented: 'shared/components/forms/SegmentedControl.tsx',
  money: 'shared/components/forms/MoneyInput.tsx',
  range: 'shared/components/forms/RangeField.tsx',
  singleTiming: 'features/single-calculator/components/sections/BondTimingSection.tsx',
  regularTiming: 'features/regular-investment/components/inputs/TimingSection.tsx',
  regularContribution: 'features/regular-investment/components/inputs/ContributionPlanSection.tsx',
} as const;

function read(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

describe('shared form control contracts', () => {
  it('provides reusable form field, select, segmented, money, and range primitives', () => {
    const field = read(paths.field);
    const select = read(paths.select);
    const segmented = read(paths.segmented);
    const money = read(paths.money);
    const range = read(paths.range);

    expectContains(field, 'export function FormField');
    expectContains(field, 'tooltip?: React.ReactNode;');
    expectContains(field, 'description?: React.ReactNode;');
    expectContains(select, 'export function FormSelect');
    expectContains(select, '<SelectTrigger');
    expectContains(select, 'id={id}');
    expectContains(select, "'min-h-11 py-2.5 pl-3 pr-10'");
    expectContains(segmented, 'export function SegmentedControl');
    expectContains(segmented, 'grid grid-cols-2 gap-1 border-y border-border py-1');
    expectContains(segmented, 'h-9 min-w-0 px-3 text-xs font-semibold leading-tight');
    expectContains(segmented, '<span className="truncate">{option.label}</span>');
    expectNotContains(segmented, 'rounded-md border border-border bg-card p-1');
    expectNotContains(segmented, 'rounded-md border border-border bg-muted/25 p-1');
    expectContains(money, 'export function MoneyInput');
    expectContains(money, "currency = 'PLN'");
    expectContains(range, 'export function RangeField');
    expectContains(range, '<CommittedSliderInput');
  });

  it('migrates repeated calculator controls to the shared form primitives', () => {
    const singleTiming = read(paths.singleTiming);
    const regularTiming = read(paths.regularTiming);
    const regularContribution = read(paths.regularContribution);

    for (const source of [singleTiming, regularTiming]) {
      expectContains(
        source,
        "import { SegmentedControl } from '@/shared/components/forms/SegmentedControl';",
      );
      expectContains(source, "import { RangeField } from '@/shared/components/forms/RangeField';");
      expectContains(source, '<SegmentedControl');
      expectContains(source, '<RangeField');
    }

    expectContains(
      singleTiming,
      "import { FormSelect } from '@/shared/components/forms/FormSelect';",
    );
    expectContains(singleTiming, '<FormSelect');
    expectContains(
      regularContribution,
      "import { FormSelect } from '@/shared/components/forms/FormSelect';",
    );
    expectContains(
      regularContribution,
      "import { MoneyInput } from '@/shared/components/forms/MoneyInput';",
    );
    expectContains(regularContribution, '<FormSelect');
    expectContains(regularContribution, '<MoneyInput');

    expectNotContains(
      singleTiming,
      "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';",
    );
    expectNotContains(
      regularContribution,
      "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';",
    );
    expectNotContains(
      regularTiming,
      "import { CommittedSliderInput } from '@/shared/components/CommittedSliderInput';",
    );
  });
});
