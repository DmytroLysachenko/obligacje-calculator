import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readSource(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

function getClassLine(source: string, anchor: string) {
  const line = source
    .split('\n')
    .find((candidate) => candidate.includes(anchor));

  expect(line, `Missing source line containing ${anchor}`).toBeTruthy();

  return line ?? '';
}

describe('economic data layout source contracts', () => {
  it('keeps shared tabs oriented by Radix data-orientation attributes', () => {
    const source = readSource('components/ui/tabs.tsx');

    expectContains(source, 'data-[orientation=horizontal]:flex-col');
    expectContains(source, 'data-[orientation=vertical]:flex-row');
    expectContains(source, 'group-data-[orientation=horizontal]/tabs:h-10');
    expectContains(source, 'group-data-[orientation=vertical]/tabs:flex-col');
    expectNotContains(source, 'data-horizontal:flex-col');
    expectNotContains(source, 'group-data-horizontal/tabs');
    expectNotContains(source, 'group-data-vertical/tabs');
  });

  it('keeps the economic page tabs compact instead of full-width empty chrome', () => {
    const source = readSource('app/economic-data/EconomicDataPageClient.tsx');
    const tabsListLine = getClassLine(source, 'TabsList className');

    expect(tabsListLine).toContain('w-fit');
    expect(tabsListLine).toContain('rounded-[1rem]');
    expect(tabsListLine).toContain('p-1');
    expect(tabsListLine).not.toContain('w-full');
    expect(tabsListLine).not.toContain('rounded-[1.5rem]');
    expect(tabsListLine).not.toContain('p-2');
  });

  it('keeps each economic page tab trigger at toolbar scale', () => {
    const source = readSource('app/economic-data/EconomicDataPageClient.tsx');
    const triggerLines = source
      .split('\n')
      .filter((line) => line.includes('TabsTrigger value='));

    expect(triggerLines).toHaveLength(3);

    for (const triggerLine of triggerLines) {
      expect(triggerLine).toContain('h-9');
      expect(triggerLine).toContain('px-3.5');
      expect(triggerLine).toContain('py-2');
      expect(triggerLine).toContain('rounded-[0.8rem]');
      expect(triggerLine).not.toContain('px-4');
      expect(triggerLine).not.toContain('py-2.5');
    }
  });

  it('keeps hero spacing compact for dashboard use', () => {
    const source = readSource('shared/components/reference/ReferenceDashboardHero.tsx');
    const sectionLine = getClassLine(source, '<section className=');
    const gridLine = getClassLine(source, 'xl:grid-cols');

    expect(sectionLine).toContain('rounded-[1.5rem]');
    expect(sectionLine).toContain('px-5');
    expect(sectionLine).toContain('py-5');
    expect(sectionLine).toContain('md:px-6');
    expect(sectionLine).toContain('md:py-6');
    expect(sectionLine).not.toContain('rounded-[2rem]');
    expect(sectionLine).not.toContain('md:px-8');
    expect(sectionLine).not.toContain('md:py-8');

    expect(gridLine).toContain('gap-5');
    expect(gridLine).toContain('minmax(260px,440px)');
    expect(gridLine).not.toContain('gap-6');
    expect(gridLine).not.toContain('minmax(280px,0.8fr)');
  });

  it('keeps hero typography dashboard-sized, not landing-page-sized', () => {
    const source = readSource('shared/components/reference/ReferenceDashboardHero.tsx');
    const titleLine = getClassLine(source, '<h2');
    const descriptionLine = getClassLine(source, '<p className="max-w-3xl');

    expect(titleLine).toContain('text-2xl');
    expect(titleLine).toContain('md:text-3xl');
    expect(titleLine).toContain('leading-tight');
    expect(titleLine).not.toContain('text-4xl');

    expect(descriptionLine).toContain('leading-7');
    expect(descriptionLine).not.toContain('leading-8');
  });

  it('keeps hero metric tiles dense enough for a reference dashboard', () => {
    const source = readSource('shared/components/reference/ReferenceDashboardHero.tsx');
    const metricGridLine = getClassLine(source, 'overflow-hidden rounded-[1.25rem]');
    const tilePaddingLine = getClassLine(source, "'px-4 py-3'");
    const valueLine = getClassLine(source, 'text-lg font-black');

    expect(metricGridLine).toContain('overflow-hidden');
    expect(metricGridLine).toContain('rounded-[1.25rem]');
    expect(metricGridLine).not.toContain('rounded-[1.5rem]');

    expect(tilePaddingLine).toContain('px-4 py-3');
    expect(tilePaddingLine).not.toContain('py-4');

    expect(valueLine).toContain('mt-1.5');
    expect(valueLine).toContain('text-lg');
    expect(valueLine).not.toContain('text-xl');
  });
});
