import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const files = {
  recalculate: 'shared/components/feedback/RecalculateButton.tsx',
  confirm: 'shared/components/feedback/ConfirmActionDialog.tsx',
  toast: 'shared/components/feedback/AppToast.tsx',
  designRefactor: 'docs/ui/design-refactor-contract.test.ts',
  accessibility: 'shared/components/accessibility/responsive-accessibility-contract.test.ts',
} as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectContains(source: string, fragment: string) {
  expect(source).toContain(fragment);
}

function expectNotContains(source: string, fragment: string) {
  expect(source).not.toContain(fragment);
}

function expectNoFragments(source: string, fragments: readonly string[]) {
  for (const fragment of fragments) {
    expectNotContains(source, fragment);
  }
}

describe('feedback overlay surface contracts', () => {
  it('keeps the floating recalculation panel flat and action-led', () => {
    const source = read(files.recalculate);

    expectContains(source, 'fixed inset-x-3 bottom-3 z-50');
    expectContains(
      source,
      'border border-border bg-background px-4 py-4 text-foreground shadow-none',
    );
    expectContains(source, 'h-11 w-full rounded-md px-5 text-sm font-semibold');
    expectContains(
      source,
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    );
    expectContains(source, "isInitialRun ? t('common.calculate') : t('common.recalculate')");
    expectContains(source, 'loading || disabled');
    expectContains(source, 'aria-live="polite"');
    expectContains(source, 'role="status"');
    expectContains(source, 'sm:w-[min(22rem,calc(100vw-1.5rem))]');

    expectNoFragments(source, [
      'rounded-lg border border-border bg-background px-4 py-4 text-foreground shadow-lg',
      'shadow-foreground/10',
      'rounded-xl',
      'backdrop-blur',
    ]);
  });

  it('keeps destructive confirmation dialog bordered without a card shell', () => {
    const source = read(files.confirm);

    expectContains(
      source,
      'fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4',
    );
    expectContains(source, 'w-full max-w-md border border-border bg-background p-6 shadow-none');
    expectContains(source, 'border-l-2 border-warning px-3 py-2 text-warning');
    expectContains(source, 'void onConfirm();');
    expectContains(source, 'role="dialog"');
    expectContains(source, 'aria-modal="true"');
    expectContains(source, 'aria-labelledby="confirm-action-dialog-title"');
    expectContains(source, 'aria-describedby="confirm-action-dialog-description"');
    expectContains(source, 'mt-6 flex flex-wrap justify-end gap-3');
    expectContains(
      source,
      'rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90',
    );

    expectNoFragments(source, [
      'w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg',
      'rounded-md bg-warning/10 p-3 text-warning',
      'shadow-lg',
      'bg-card p-6',
    ]);
  });

  it('keeps app toast status visible through a left border instead of a card', () => {
    const source = read(files.toast);

    expectContains(
      source,
      'pointer-events-none fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6',
    );
    expectContains(
      source,
      'pointer-events-auto flex min-w-[280px] max-w-[420px] items-start gap-3 border border-l-2 bg-background px-4 py-3 shadow-none',
    );
    expectContains(source, "? 'border-border border-l-success text-foreground'");
    expectContains(source, ": 'border-border border-l-destructive text-foreground'");
    expectContains(source, 'durationMs = 3200');
    expectContains(source, 'role="status"');
    expectContains(source, 'aria-live="polite"');
    expectContains(source, 'onDismiss');
    expectContains(source, 'window.setTimeout');
    expectContains(source, 'window.clearTimeout');

    expectNoFragments(source, [
      'rounded-lg border px-4 py-3 shadow-lg',
      'border-success/30 bg-card text-foreground',
      'border-destructive/30 bg-card text-foreground',
      'shadow-lg',
    ]);
  });

  it('keeps global visual contracts aware of feedback and accessibility rules', () => {
    const design = read(files.designRefactor);
    const accessibility = read(files.accessibility);

    expectContains(design, 'keeps feedback widgets compact and token-based');
    expectContains(design, 'shared/components/feedback/RecalculateButton.tsx');
    expectContains(design, 'shared/components/feedback/AppToast.tsx');
    expectContains(
      accessibility,
      'keeps chart containers keyboard reachable when they expose summaries',
    );
  });

  it('keeps overlay components explicit about their transient roles', () => {
    const recalculate = read(files.recalculate);
    const confirm = read(files.confirm);
    const toast = read(files.toast);

    expectContains(recalculate, 'calculation_in_progress');
    expectContains(recalculate, 'initial_calculation_hint');
    expectContains(recalculate, 'recalculation_hint');
    expectContains(recalculate, 'common.calculate');
    expectContains(recalculate, 'common.recalculate');

    expectContains(confirm, 'AlertTriangle');
    expectContains(confirm, 'variant="outline"');
    expectContains(confirm, 'bg-destructive');
    expectContains(confirm, 'confirm-action-dialog-title');
    expectContains(confirm, 'confirm-action-dialog-description');
    expectContains(confirm, 'onCancel');

    expectContains(toast, 'CheckCircle2');
    expectContains(toast, 'AlertCircle');
    expectContains(toast, 'X');
    expectContains(toast, 'message: string | null');
    expectContains(toast, "const isSuccess = tone === 'success'");
  });
});
