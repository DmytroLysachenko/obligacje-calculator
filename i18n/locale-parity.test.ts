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

function flattenMessageValues(node: unknown, prefix = ''): Map<string, unknown> {
  if (Array.isArray(node)) {
    return node.reduce((values, item, index) => {
      for (const [key, value] of flattenMessageValues(item, `${prefix}[${index}]`)) {
        values.set(key, value);
      }
      return values;
    }, new Map<string, unknown>());
  }

  if (node && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>).reduce((values, [key, value]) => {
      for (const [nestedKey, nestedValue] of flattenMessageValues(
        value,
        prefix ? `${prefix}.${key}` : key,
      )) {
        values.set(nestedKey, nestedValue);
      }
      return values;
    }, new Map<string, unknown>());
  }

  return new Map(prefix ? [[prefix, node]] : []);
}

function getPlaceholders(value: string) {
  return Array.from(value.matchAll(/\{([A-Za-z][A-Za-z0-9_-]*)\}/g), ([, name]) => name).sort();
}

const POLISH_ASCII_FALLBACKS =
  /\b(?:biezac|czesc|dlug|dostep|glown|koncow|lacz|miesiecz|najwaz|nastepn|niedostep|odswiez|pel(?:n|ny)|poczat|porown|przyszl|przywroc|roznic|sciez|slu(?:z|ż)|srodk|swiez|szczegol|uzy(?:t|w)|wartos|wczesniejs|wlasn|wplat|wyjsc|wyplat|wyzs|zaloz|zapadalnos|zastep|zglos|zrod)\w*\b/i;

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

function collectDirectTranslationKeys() {
  const roots = ['app', 'features', 'shared'];
  const keys = new Set<string>();

  for (const filePath of roots.flatMap(collectSourceFiles)) {
    const source = readFileSync(filePath, 'utf8');

    if (!source.startsWith("'use client';") && !source.startsWith('"use client";')) {
      continue;
    }

    for (const match of source.matchAll(/\bt\(\s*['"]([A-Za-z0-9_.-]+)['"]/g)) {
      keys.add(match[1]);
    }
  }

  return Array.from(keys).sort();
}

describe('locale parity for touched bond and economic helper namespaces', () => {
  it('keeps message object keys compatible with next-intl namespaces', () => {
    expect(collectKeysContainingDots(enMessages)).toEqual([]);
    expect(collectKeysContainingDots(plMessages)).toEqual([]);
  });

  it('keeps English and Polish message keys identical', () => {
    const englishKeys = flattenMessageKeys(enMessages).map(normalizeArrayIndexes).sort();
    const polishKeys = flattenMessageKeys(plMessages).map(normalizeArrayIndexes).sort();

    expect(polishKeys).toEqual(englishKeys);
  });

  it('keeps leaf values non-empty, type-compatible, and placeholder-compatible', () => {
    const englishValues = flattenMessageValues(enMessages);
    const polishValues = flattenMessageValues(plMessages);

    expect(polishValues.size).toBe(englishValues.size);

    for (const [key, englishValue] of englishValues) {
      const polishValue = polishValues.get(key);
      expect(typeof polishValue, key).toBe(typeof englishValue);

      if (typeof englishValue === 'string' && typeof polishValue === 'string') {
        expect(polishValue.trim(), key).not.toBe('');
        expect(getPlaceholders(polishValue), key).toEqual(getPlaceholders(englishValue));
      }
    }
  });

  it('does not regress to common ASCII substitutes for Polish diacritics', () => {
    const polishValues = flattenMessageValues(plMessages);
    const offenders = Array.from(polishValues.entries()).filter(
      ([, value]) => typeof value === 'string' && POLISH_ASCII_FALLBACKS.test(value),
    );

    expect(offenders).toEqual([]);
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

  it('keeps every literal client translation key resolvable in both locales', () => {
    const usedKeys = collectDirectTranslationKeys();

    expect(usedKeys.filter((key) => getNodeByPath(enMessages, key) === undefined)).toEqual([]);
    expect(usedKeys.filter((key) => getNodeByPath(plMessages, key) === undefined)).toEqual([]);
  });
});
