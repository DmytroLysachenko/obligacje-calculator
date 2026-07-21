import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFile(`${root}/${path}`, 'utf8');

describe('calculator control feedback contract', () => {
  it('does not hardcode an accessible toast dismissal label', async () => {
    const toast = await read('shared/components/feedback/AppToast.tsx');
    expect(toast).toContain("import { useAppI18n } from '@/i18n/client';");
    expect(toast).toContain('const { t } = useAppI18n();');
    expect(toast).toContain("aria-label={t('common.dismiss_notification')}");
    expect(toast).not.toContain('aria-label="Dismiss notification"');
  });

  it('keeps the ready-state step group named by its consumer', async () => {
    const panel = await read('shared/components/feedback/ScenarioReadyPanel.tsx');
    const calculator = await read('features/single-calculator/components/BondCalculatorPanels.tsx');
    expect(panel).toContain('stepsLabel?: string;');
    expect(panel).toContain('aria-label={stepsLabel}');
    expect(calculator).toContain("stepsLabel={t('bonds.simulation.ready_steps_label')}");
  });

  it('announces a future purchase date as an actual field error', async () => {
    const timing = await read('features/single-calculator/components/sections/BondTimingSection.tsx');
    expect(timing).toContain('role="alert"');
    expect(timing).toContain('text-xs font-medium text-destructive');
    expect(timing).not.toContain('text-[10px] font-medium text-destructive');
    expect(timing).toContain("{t('bonds.error_future_date')}");
  });

  it('keeps all new labels in both application locales', async () => {
    const [en, pl] = await Promise.all([
      read('i18n/translations/en.json'),
      read('i18n/translations/pl.json'),
    ]);
    for (const translation of [en, pl]) {
      expect(translation).toContain('dismiss_notification');
      expect(translation).toContain('ready_steps_label');
    }
    expect(en).toContain('Dismiss notification');
    expect(pl).toContain('Zamknij powiadomienie');
  });

  it('uses labels instead of color alone for actionable feedback', async () => {
    const toast = await read('shared/components/feedback/AppToast.tsx');
    const timing = await read('features/single-calculator/components/sections/BondTimingSection.tsx');
    expect(toast).toContain('role="status"');
    expect(toast).toContain('aria-live="polite"');
    expect(timing).toContain('<AlertCircle');
    expect(timing).toContain("t('bonds.error_future_date')");
  });

  it('retains a visible icon beside each announced message', async () => {
    const toast = await read('shared/components/feedback/AppToast.tsx');
    const timing = await read('features/single-calculator/components/sections/BondTimingSection.tsx');

    expect(toast).toContain('const Icon = isSuccess ? CheckCircle2 : AlertCircle;');
    expect(toast).toContain('<Icon');
    expect(toast).toContain('text-success');
    expect(toast).toContain('text-destructive');
    expect(timing).toContain('<AlertCircle className="h-3 w-3" />');
  });

  it('leaves the ready state usable without an optional call to action', async () => {
    const panel = await read('shared/components/feedback/ScenarioReadyPanel.tsx');

    expect(panel).toContain('ctaLabel?: string;');
    expect(panel).toContain('onClick?: () => void;');
    expect(panel).toContain('{ctaLabel && onClick ? (');
    expect(panel).toContain('{footerText ? (');
    expect(panel).toContain('<section className="space-y-6 border-t border-border py-6">');
  });

  it('does not introduce a locale-specific string into the calculator panel', async () => {
    const calculator = await read('features/single-calculator/components/BondCalculatorPanels.tsx');

    expect(calculator).toContain('const { t } = useAppI18n();');
    expect(calculator).toContain("t('bonds.simulation.ready')");
    expect(calculator).toContain("t('bonds.simulation.ready_title')");
    expect(calculator).not.toContain('Set up your scenario');
  });
});
