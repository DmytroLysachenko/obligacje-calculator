import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const source = () => readFile(`${root}/shared/components/results/ResultActionGrid.tsx`, 'utf8');

describe('result action pending feedback contract', () => {
  it('allows actions to complete asynchronously', async () => {
    const content = await source();
    expect(content).toContain('onClick?: () => void | Promise<void>;');
    expect(content).toContain('const runAction = async (action: ResultAction) =>');
    expect(content).toContain('await action.onClick();');
  });
  it('prevents a second action while the first is pending', async () => {
    const content = await source();
    expect(content).toContain('const [pendingAction, setPendingAction] = React.useState<string | null>(null);');
    expect(content).toContain('if (!action.onClick || pendingAction) return;');
    expect(content).toContain('disabled={action.disabled || Boolean(pendingAction)}');
  });
  it('communicates busy state to assistive technology', async () => {
    const content = await source();
    expect(content).toContain('aria-busy={Boolean(pendingAction)}');
    expect(content).toContain("pendingAction === action.label ? t('common.loading') : action.label");
  });
  it('uses the same feedback path for primary actions', async () => {
    const content = await source();
    expect(content).toContain('onClick={() => runAction(action)}');
    expect(content).toContain("const primaryActions = actions.filter((action) => action.priority !== 'secondary');");
    expect(content).toContain('primaryActions.map((action) => {');
  });
  it('uses the same feedback path for secondary actions', async () => {
    const content = await source();
    expect(content).toContain("const secondaryActions = actions.filter((action) => action.priority === 'secondary');");
    expect(content).toContain('secondaryActions.map((action) => {');
    expect(content).toContain('<details className="col-span-full border-t border-border pt-2">');
  });
  it('clears pending state whether an action succeeds or fails', async () => {
    const content = await source();
    expect(content).toContain('try {');
    expect(content).toContain('} finally {');
    expect(content).toContain('setPendingAction(null);');
  });
  it('preserves disabled-action semantics', async () => {
    const content = await source();
    expect(content).toContain('disabled?: boolean;');
    expect(content).toContain('disabled={action.disabled || Boolean(pendingAction)}');
  });

  it('keeps labels stable before and after an interaction', async () => {
    const content = await source();
    expect(content).toContain('label: string;');
    expect(content).toContain('{action.label}');
    expect(content).toContain("t('bonds.results.actions_label')");
    expect(content).toContain("t('bonds.results.more_actions')");
  });

  it('does not add a separate loading button variant for each action type', async () => {
    const content = await source();
    expect(content).toContain('const kind = action.kind');
    expect(content).toContain("kind === 'primary'");
    expect(content).toContain("kind ?? 'secondary'");
    expect(content).toContain('runAction(action)');
  });
});
