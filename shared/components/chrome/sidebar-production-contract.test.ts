import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

describe('sidebar production navigation contract', () => {
  function extractNavSection(source: string, sectionKey: string) {
    const start = source.indexOf(`label: t('${sectionKey}')`);
    const conditionalStart = source.indexOf("label: t('sidebar.sections.conditional')");

    if (start === -1) {
      return '';
    }

    if (sectionKey === 'sidebar.sections.core' && conditionalStart > start) {
      return source.slice(start, conditionalStart);
    }

    return source.slice(start);
  }

  it('keeps comparison beside the primary calculator in core tools', () => {
    const source = read('shared/components/chrome/Sidebar.tsx');
    const coreStart = source.indexOf("label: t('sidebar.sections.core')");
    const conditionalStart = source.indexOf("label: t('sidebar.sections.conditional')");
    const singleIndex = source.indexOf("href: '/single-calculator'");
    const comparisonIndex = source.indexOf("href: '/compare'");
    const economicIndex = source.indexOf("href: '/economic-data'");

    expect(coreStart).toBeGreaterThanOrEqual(0);
    expect(conditionalStart).toBeGreaterThan(coreStart);
    expect(singleIndex).toBeGreaterThan(coreStart);
    expect(comparisonIndex).toBeGreaterThan(singleIndex);
    expect(economicIndex).toBeGreaterThan(comparisonIndex);
    expect(comparisonIndex).toBeLessThan(conditionalStart);
  });

  it('keeps the core tools ordered as education, single calculator, comparison, and data', () => {
    const source = read('shared/components/chrome/Sidebar.tsx');
    const coreSection = extractNavSection(source, 'sidebar.sections.core');
    const expectedOrder = [
      "href: '/education'",
      "href: '/single-calculator'",
      "href: '/compare'",
      "href: '/economic-data'",
    ];
    const indexes = expectedOrder.map((fragment) => coreSection.indexOf(fragment));

    for (const index of indexes) {
      expect(index).toBeGreaterThanOrEqual(0);
    }

    expect(indexes[0]).toBeLessThan(indexes[1]);
    expect(indexes[1]).toBeLessThan(indexes[2]);
    expect(indexes[2]).toBeLessThan(indexes[3]);
  });

  it('keeps secondary strategy pages out of the core group', () => {
    const source = read('shared/components/chrome/Sidebar.tsx');
    const conditionalStart = source.indexOf("label: t('sidebar.sections.conditional')");
    const regularIndex = source.indexOf("href: '/regular-investment'");
    const ladderIndex = source.indexOf("href: '/ladder'");
    const notebookIndex = source.indexOf("href: '/notebook'");

    expect(conditionalStart).toBeGreaterThanOrEqual(0);
    expect(regularIndex).toBeGreaterThan(conditionalStart);
    expect(ladderIndex).toBeGreaterThan(conditionalStart);
    expect(notebookIndex).toBeGreaterThan(conditionalStart);
  });

  it('does not duplicate comparison inside the secondary strategy group', () => {
    const source = read('shared/components/chrome/Sidebar.tsx');
    const coreSection = extractNavSection(source, 'sidebar.sections.core');
    const strategySection = extractNavSection(source, 'sidebar.sections.conditional');
    const comparisonOccurrences = source.match(/href: '\/compare'/g) ?? [];

    expect(comparisonOccurrences).toHaveLength(1);
    expectContains(coreSection, "href: '/compare'");
    expectNotContains(strategySection, "href: '/compare'");
  });

  it('keeps every core navigation item icon-backed after regrouping', () => {
    const source = read('shared/components/chrome/Sidebar.tsx');
    const coreSection = extractNavSection(source, 'sidebar.sections.core');

    expectContains(coreSection, 'icon: BookOpen');
    expectContains(coreSection, 'icon: Calculator');
    expectContains(coreSection, 'icon: Scale');
    expectContains(coreSection, 'icon: BarChart2');
  });

  it('removes unfinished theme switching from the visible settings footer', () => {
    const source = read('shared/components/chrome/SidebarSettingsUtility.tsx');

    expectContains(source, '<SidebarUtilityStack>');
    expectContains(source, "title={t('common.language')}");
    expectContains(source, 'action={<LanguageSwitcher />}');
    expectNotContains(source, 'ThemeToggle');
    expectNotContains(source, 'theme_toggle_hint');
    expectNotContains(source, "title={t('common.theme')}");
  });

  it('does not duplicate the language selector with helper copy', () => {
    const source = read('shared/components/chrome/SidebarSettingsUtility.tsx');

    expectContains(source, 'action={<LanguageSwitcher />}');
    expectNotContains(source, 'description="PL / EN"');
    expectNotContains(source, 'PL / EN');
  });

  it('keeps settings as one quiet utility row rather than multiple cramped rows', () => {
    const source = read('shared/components/chrome/SidebarSettingsUtility.tsx');
    const rowOccurrences = source.match(/<SidebarUtilityRow/g) ?? [];
    const panelOccurrences = source.match(/<SidebarUtilityPanel flush>/g) ?? [];

    expect(rowOccurrences).toHaveLength(1);
    expect(panelOccurrences).toHaveLength(1);
    expectContains(source, '<SidebarUtilityStack>');
  });
});
