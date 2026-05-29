import { describe, expect, it } from 'vitest';
import {
  getWorkspaceSaveTarget,
  getWorkspaceSelectionLabel,
  resolveWorkspacePortfolioSelection,
  shouldPersistWorkspaceSelection,
  WorkspacePortfolioOption,
} from './portfolio-selection';

function portfolio(id: string, name = `Portfolio ${id}`): WorkspacePortfolioOption {
  return { id, name };
}

describe('workspace portfolio selection model', () => {
  it('uses an explicitly selected portfolio when it exists', () => {
    const selection = resolveWorkspacePortfolioSelection('b', [
      portfolio('a'),
      portfolio('b'),
    ]);

    expect(selection).toEqual({
      portfolio: portfolio('b'),
      portfolioId: 'b',
      source: 'explicit',
    });
    expect(shouldPersistWorkspaceSelection(selection)).toBe(true);
  });

  it('falls back to the first available portfolio when selection is absent', () => {
    const selection = resolveWorkspacePortfolioSelection(null, [
      portfolio('fresh'),
      portfolio('older'),
    ]);

    expect(selection.portfolioId).toBe('fresh');
    expect(selection.portfolio?.name).toBe('Portfolio fresh');
    expect(selection.source).toBe('fallback');
    expect(shouldPersistWorkspaceSelection(selection)).toBe(true);
  });

  it('falls back when a stored portfolio id no longer exists', () => {
    const selection = resolveWorkspacePortfolioSelection('deleted', [
      portfolio('remaining'),
    ]);

    expect(selection.portfolioId).toBe('remaining');
    expect(selection.source).toBe('fallback');
  });

  it('represents empty workspace state without inventing a destination', () => {
    const selection = resolveWorkspacePortfolioSelection('missing', []);

    expect(selection.portfolio).toBeNull();
    expect(selection.portfolioId).toBeNull();
    expect(selection.source).toBe('empty');
    expect(shouldPersistWorkspaceSelection(selection)).toBe(false);
  });

  it('builds display labels without leaking nulls into UI copy', () => {
    const empty = resolveWorkspacePortfolioSelection(null, []);
    const selected = resolveWorkspacePortfolioSelection('a', [portfolio('a', 'Long-term bonds')]);

    expect(getWorkspaceSelectionLabel(empty, 'No active portfolio')).toBe('No active portfolio');
    expect(getWorkspaceSelectionLabel(selected, 'No active portfolio')).toBe('Long-term bonds');
  });

  it('marks save target as creation-required when no portfolio exists', () => {
    expect(getWorkspaceSaveTarget(null, [])).toEqual({
      portfolioId: null,
      portfolioName: null,
      needsPortfolioCreation: true,
      shouldPersistSelection: false,
    });
  });

  it('builds save target for explicit active portfolio', () => {
    expect(getWorkspaceSaveTarget('b', [portfolio('a'), portfolio('b', 'Active')])).toEqual({
      portfolioId: 'b',
      portfolioName: 'Active',
      needsPortfolioCreation: false,
      shouldPersistSelection: true,
    });
  });
});
