import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

const paths = {
  button: 'components/ui/button.tsx',
  tabs: 'components/ui/tabs.tsx',
  slider: 'shared/components/CommittedSliderInput.tsx',
} as const;

function readSource(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

describe('control hierarchy contracts', () => {
  it('keeps primary and secondary buttons at readable financial app heights', () => {
    const source = readSource(paths.button);

    expectContains(source, 'text-sm font-medium');
    expectContains(
      source,
      'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2',
    );
    expectContains(source, 'default:\n          "h-9 gap-2 px-3');
    expectContains(source, 'sm: "h-8 gap-1.5 rounded-md px-3 text-xs');
    expectContains(source, 'lg: "h-10 gap-2 px-4');
    expectContains(source, 'icon: "size-9"');

    expectNotContains(source, 'default:\n          "h-8 gap-1.5 px-2.5');
    expectNotContains(source, 'lg: "h-9 gap-1.5 px-2.5');
  });

  it('keeps segmented tabs visibly selectable and keyboard focused', () => {
    const source = readSource(paths.tabs);

    expectContains(source, 'group-data-[orientation=horizontal]/tabs:h-10');
    expectContains(source, 'px-4 py-2 text-xs font-semibold');
    expectContains(
      source,
      'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2',
    );
    expectContains(
      source,
      'data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none',
    );
  });

  it('shows slider context with current value, bounds, and accessible labels', () => {
    const source = readSource(paths.slider);

    expectContains(source, 'label?: string;');
    expectContains(source, 'showBounds?: boolean;');
    expectContains(source, 'valueFormatter?: (value: number) => string;');
    expectContains(source, 'const formatDisplayValue = React.useCallback');
    expectContains(source, '{formatDisplayValue(min)} - {formatDisplayValue(max)}');
    expectContains(source, '{formatDisplayValue(draftValue)}');
    expectContains(source, "aria-label={label ?? unit ?? 'Committed slider input'}");
    expectContains(source, "aria-label={label ?? unit ?? 'Slider value'}");
  });
});
