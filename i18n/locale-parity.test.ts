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

function normalizeArrayIndexes(key: string) {
  return key.replace(/\[\d+\]/g, '[]');
}

function getNormalizedNamespaceKeys(messages: Record<string, unknown>, path: string) {
  return flattenMessageKeys(getNodeByPath(messages, path) as Record<string, unknown>)
    .map(normalizeArrayIndexes)
    .sort();
}

describe('locale parity for touched bond and economic helper namespaces', () => {
  it('keeps full English key coverage available in Polish', () => {
    const englishKeys = flattenMessageKeys(enMessages)
      .map(normalizeArrayIndexes)
      .sort();
    const polishKeys = new Set(
      flattenMessageKeys(plMessages).map(normalizeArrayIndexes),
    );

    expect(englishKeys.filter((key) => !polishKeys.has(key))).toEqual([]);
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
});
