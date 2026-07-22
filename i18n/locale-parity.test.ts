import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import enMessages from './translations/en.json';
import plMessages from './translations/pl.json';

function getNodeByPath(source: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}

function flattenMessageKeys(node: unknown, prefix = ''): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((item, index) => flattenMessageKeys(item, `${prefix}[${index}]`));
  }

  if (node && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
      flattenMessageKeys(value, prefix ? `${prefix}.${key}` : key),
    );
  }

  return prefix ? [prefix] : [];
}

function collectKeysContainingDots(node: unknown): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return [];
  }

  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => [
    ...(key.includes('.') ? [key] : []),
    ...collectKeysContainingDots(value),
  ]);
}

function normalizeArrayIndexes(key: string) {
  return key.replace(/\[\d+\]/g, '[]');
}

function getNormalizedNamespaceKeys(messages: Record<string, unknown>, path: string) {
  return flattenMessageKeys(getNodeByPath(messages, path) as Record<string, unknown>)
    .map(normalizeArrayIndexes)
    .sort();
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(filePath);
    }

    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [filePath] : [];
  });
}

function collectDirectComparisonTranslationKeys() {
  const roots = ['app', 'features', 'shared'];
  const keys = new Set<string>();

  for (const filePath of roots.flatMap(collectSourceFiles)) {
    const source = readFileSync(filePath, 'utf8');

    for (const match of source.matchAll(/t\(['"]comparison\.([A-Za-z0-9_]+)['"]/g)) {
      keys.add(`comparison.${match[1]}`);
    }
  }

  return Array.from(keys).sort();
}

describe('locale parity for touched bond and economic helper namespaces', () => {
  it('keeps message object keys compatible with next-intl namespaces', () => {
    expect(collectKeysContainingDots(enMessages)).toEqual([]);
    expect(collectKeysContainingDots(plMessages)).toEqual([]);
  });

  it('keeps full English key coverage available in Polish', () => {
    const englishKeys = flattenMessageKeys(enMessages).map(normalizeArrayIndexes).sort();
    const polishKeys = new Set(flattenMessageKeys(plMessages).map(normalizeArrayIndexes));

    expect(englishKeys.filter((key) => !polishKeys.has(key))).toEqual([]);
  });

  it('resolves the chart data table date heading in both locales', () => {
    expect(getNodeByPath(enMessages, 'common.date')).toBeTypeOf('string');
    expect(getNodeByPath(plMessages, 'common.date')).toBeTypeOf('string');
  });

  it('keeps economic.reference_copy aligned between English and Polish', () => {
    expect(getNormalizedNamespaceKeys(enMessages, 'economic.reference_copy')).toEqual(
      getNormalizedNamespaceKeys(plMessages, 'economic.reference_copy'),
    );
  });

  it('keeps key bond helper labels aligned between English and Polish', () => {
    for (const path of [
      'bonds.historical_context',
      'bonds.chart_value_note',
      'bonds.filter_events',
      'bonds.projection_start',
      'bonds.tax_deducted',
      'bonds.simulation.ready_steps',
      'bonds.simulation.regular',
      'comparison.page',
      'workspace',
      'notebook.ready_steps',
    ]) {
      expect(getNormalizedNamespaceKeys(enMessages, path)).toEqual(
        getNormalizedNamespaceKeys(plMessages, path),
      );
    }
  });

  it('keeps directly referenced comparison translation keys resolvable in both locales', () => {
    const usedKeys = collectDirectComparisonTranslationKeys();

    expect(usedKeys.filter((key) => getNodeByPath(enMessages, key) === undefined)).toEqual([]);
    expect(usedKeys.filter((key) => getNodeByPath(plMessages, key) === undefined)).toEqual([]);
  });
});
