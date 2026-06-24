import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  parameter: 'shared/components/results/ParameterSummary.tsx',
  notice: 'shared/components/feedback/Notice.tsx',
  singleFooter: 'features/single-calculator/components/sections/BondSummaryFooter.tsx',
  regularForm: 'features/regular-investment/components/RegularInvestmentInputsForm.tsx',
  singleSummary: 'features/single-calculator/components/BondResultsSummary.tsx',
  referenceFrame: 'shared/components/charts/ReferenceChartFrame.tsx',
} as const;

function read(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

describe('parameter summary and notice contracts', () => {
  it('provides shared key-value and notice primitives', () => {
    const parameter = read(paths.parameter);
    const notice = read(paths.notice);

    expect(parameter).toContain('export function ParameterSummary');
    expect(parameter).toContain("variant?: 'compact' | 'default' | 'inline';");
    expect(parameter).toContain('financial-number');
    expect(parameter).toContain('divide-y divide-border/70');
    expect(notice).toContain('export function Notice');
    expect(notice).toContain("export type NoticeTone = 'info' | 'warning' | 'success' | 'locked';");
    expect(notice).toContain('toneIcon');
  });

  it('migrates repeated summaries and notices to shared primitives', () => {
    const singleFooter = read(paths.singleFooter);
    const regularForm = read(paths.regularForm);
    const singleSummary = read(paths.singleSummary);
    const referenceFrame = read(paths.referenceFrame);

    expect(singleFooter).toContain(
      "import { ParameterSummary } from '@/shared/components/results/ParameterSummary';",
    );
    expect(singleFooter).toContain('<ParameterSummary items={summaryItems} variant="compact" />');
    expect(regularForm).toContain(
      "import { ParameterSummary } from '@/shared/components/results/ParameterSummary';",
    );
    expect(regularForm).toContain('<ParameterSummary');
    expect(singleSummary).toContain(
      "import { Notice } from '@/shared/components/feedback/Notice';",
    );
    expect(singleSummary).toContain('<Notice tone="locked" compact>');
    expect(referenceFrame).toContain(
      "import { Notice } from '@/shared/components/feedback/Notice';",
    );
    expect(referenceFrame).toContain("tone={fallbackTone === 'warning' ? 'warning' : 'success'}");
  });
});
