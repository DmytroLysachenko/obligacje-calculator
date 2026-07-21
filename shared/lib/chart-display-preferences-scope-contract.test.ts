import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
const root = process.cwd();















const read = (path: string) => readFile(`${root}/${path}`, 'utf8');
describe('chart display preference scope contract', () => {
  it('versions and scopes storage keys', async () => { const s = await read('shared/lib/chart-display-preferences.ts'); expect(s).toContain("STORAGE_KEY_PREFIX = 'obligacje.chart-display-preferences.v2'"); expect(s).toContain("function getStorageKey(scope = 'default')"); expect(s).toContain('return `${STORAGE_KEY_PREFIX}.${scope}`;'); });
  it('loads from the selected scope', async () => { const s = await read('shared/lib/chart-display-preferences.ts'); expect(s).toContain('scope?: string,'); expect(s).toContain('getStorageKey(scope)'); expect(s).toContain('defaultGranularity: ChartStep = \'yearly\''); });
  it('writes to the selected scope', async () => { const s = await read('shared/lib/chart-display-preferences.ts'); expect(s).toContain('saveChartDisplayPreferences(preferences: ChartDisplayPreferences, scope?: string)'); expect(s).toContain('window.localStorage.setItem(getStorageKey(scope), JSON.stringify(preferences));'); });
  it('allows each chart consumer to opt into scoped preferences', async () => { const s = await read('shared/components/charts/BondValueChart.tsx'); expect(s).toContain('preferenceScope?: string;'); expect(s).toContain('preferenceScope,'); expect(s).toContain('loadChartDisplayPreferences(defaultGranularity, preferenceScope)'); });
  it('passes scope through every preference update', async () => { const s = await read('shared/components/charts/BondValueChart.tsx'); const hits = s.split('saveChartDisplayPreferences(next, preferenceScope)').length - 1; expect(hits).toBe(3); });
  it('updates the synchronization effect when its scope changes', async () => { const s = await read('shared/components/charts/BondValueChart.tsx'); expect(s).toContain('[defaultGranularity, granularity, onGranularityChange, preferenceScope]'); });
  it('keeps SSR storage reads safe', async () => { const s = await read('shared/lib/chart-display-preferences.ts'); expect(s).toContain("if (typeof window === 'undefined')"); expect(s).toContain('...defaultPreferences'); });
  it('continues validating stored display steps', async () => { const s = await read('shared/lib/chart-display-preferences.ts'); expect(s).toContain('function isChartStep'); expect(s).toContain('isChartStep(parsed.granularity)'); });

  it('does not share an implicit key between separate chart variants', async () => {
    const source = await read('shared/lib/chart-display-preferences.ts');
    expect(source).toContain("scope = 'default'");
    expect(source).toContain('getStorageKey(scope)');
    expect(source).not.toContain("const STORAGE_KEY = 'obligacje.chart-display-preferences.v1'");
  });

  it('keeps the preference shape intentionally small', async () => {
    const source = await read('shared/lib/chart-display-preferences.ts');
    expect(source).toContain('granularity: ChartStep;');
    expect(source).toContain('showInflationOverlay: boolean;');
    expect(source).toContain('showNbpOverlay: boolean;');
    expect(source).toContain("granularity: 'yearly'");
  });

  it('retains safe fallback defaults after malformed storage', async () => {
    const source = await read('shared/lib/chart-display-preferences.ts');
    expect(source).toContain('try {');
    expect(source).toContain('} catch {');
    expect(source).toContain('granularity: defaultGranularity');
    expect(source).toContain('showInflationOverlay: false');
  });

  it('keeps the chart component responsible only for wiring its scope', async () => {
    const source = await read('shared/components/charts/BondValueChart.tsx');
    expect(source).toContain('const [preferences, setPreferences] = React.useState(() =>');
    expect(source).toContain('const showInflationOverlay = preferences.showInflationOverlay;');
    expect(source).toContain('const showNbpOverlay = preferences.showNbpOverlay;');
    expect(source).toContain('const granularity = preferences.granularity;');
  });

  it('does not duplicate browser-storage handling in the chart component', async () => {
    const source = await read('shared/components/charts/BondValueChart.tsx');
    expect(source).toContain("from '@/shared/lib/chart-display-preferences'");
    expect(source).not.toContain('window.localStorage.getItem');
    expect(source).not.toContain('window.localStorage.setItem');
  });

  it('persists granularity and overlay choices through the same API', async () => {
    const source = await read('shared/components/charts/BondValueChart.tsx');
    expect(source).toContain('const handleGranularityChange = (nextStep: ChartStep) =>');
    expect(source).toContain("key: 'showInflationOverlay' | 'showNbpOverlay'");
    expect(source).toContain('const updateOverlayPreference = (');
    expect(source).toContain('setPreferences((current) => {');
  });
});
