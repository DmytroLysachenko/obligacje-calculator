import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Treasury Ledger dark tokens', () => {
  it('defines semantic dark-theme tokens', () => {
    for (const token of [
      '--canvas: #111315',
      '--surface-1: #171b1e',
      '--surface-2: #1d2327',
      '--ink-strong: #f5f2ea',
      '--ink-muted: #b8b7b0',
      '--trust: #7ca7d8',
      '--positive: #4dba8a',
      '--attention: #d6a85f',
      '--danger: #e3776b',
    ]) {
      expect(css).toContain(token);
    }
  });

  it('keeps body and status text at WCAG AA contrast on raised dark surfaces', () => {
    const surface = '#171b1e';
    expect(contrast('#f5f2ea', surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#b8b7b0', surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#7ca7d8', surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#4dba8a', surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#d6a85f', surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#e3776b', surface)).toBeGreaterThanOrEqual(4.5);
  });
});
