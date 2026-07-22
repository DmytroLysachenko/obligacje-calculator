import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = process.cwd();



const source = () => readFile(`${root}/shared/components/page/CalculatorPageShell.tsx`, 'utf8');

describe('calculator page status error contract', () => {
  it('accepts an error state from calculator routes', async () => {
    const content = await source();
    expect(content).toContain('isError?: boolean;');
    expect(content).toContain('isError = false,');
    expect(content).toContain('isError, t]);');
  });
  it('renders calculation progress ahead of error feedback', async () => {
    const content = await source();
    expect(content.indexOf('if (isCalculating)')).toBeLessThan(content.indexOf('if (isError)'));
    expect(content).toContain("label: t('common.calculating')");
    expect(content).toContain("state: 'loading'");
  });
  it('shows an explicit localized error status', async () => {
    const content = await source();
    expect(content).toContain('if (isError) {');
    expect(content).toContain("label: t('common.error')");
    expect(content).toContain("state: 'idle'");
    expect(content).toContain("tone: 'warning'");
  });
  it('keeps stale-result status available after an error has cleared', async () => {
    const content = await source();
    expect(content).toContain('if (hasResults && isDirty) {');
    expect(content).toContain("label: t('common.recalculation_hint')");
    expect(content).toContain("tone: 'warning'");
  });
  it('keeps current-result status as the final fallback', async () => {
    const content = await source();
    expect(content).toContain('if (hasResults) {');
    expect(content).toContain("label: t('common.results_up_to_date')");
    expect(content).toContain("state: 'complete'");
    expect(content).toContain("tone: 'success'");
  });
  it('does not make header actions depend on status wording', async () => {
    const content = await source();
    expect(content).toContain('const hasShareAction = onShare ? hasResults : showImplicitShare && hasResults;');
    expect(content).toContain('const headerAction =');
    expect(content).toContain("t('comparison.share_scenario')");
  });
  it('keeps the state model explicit for maintainers', async () => {
    const content = await source();
    expect(content).toContain('const status = useMemo<PageHeaderStatus | null>(() => {');
    expect(content).toContain('return null;');
    expect(content).toContain('<PageHeader');
    expect(content).toContain('status={status}');
  });

  it('does not suppress the error status when no result exists yet', async () => {
    const content = await source();
    const errorIndex = content.indexOf('if (isError)');
    const currentIndex = content.indexOf('if (hasResults)');
    expect(errorIndex).toBeGreaterThan(-1);
    expect(currentIndex).toBeGreaterThan(errorIndex);
    expect(content).toContain('hasResults: boolean;');
  });

  it('uses a single status object shape for every branch', async () => {
    const content = await source();
    expect(content).toContain("tone: 'neutral'");
    expect(content).toContain("tone: 'warning'");
    expect(content).toContain("tone: 'success'");
    expect(content).toContain("state: 'loading'");
    expect(content).toContain("state: 'idle'");
    expect(content).toContain("state: 'complete'");
  });

  it('does not show a copied-sharing state as a calculation status', async () => {
    const content = await source();
    expect(content).toContain('const [copied, setCopied] = useState(false);');
    expect(content).toContain('const handleShare = async () => {');
    expect(content).toContain('setCopied(true);');
    expect(content).toContain('setTimeout(() => setCopied(false), 2000);');
  });

  it('passes the resolved status through the common page header', async () => {
    const content = await source();
    expect(content).toContain('title={title}');
    expect(content).toContain('description={description}');
    expect(content).toContain('icon={icon}');
    expect(content).toContain('action={headerAction}');
  });
});
