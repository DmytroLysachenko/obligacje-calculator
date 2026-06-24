import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('notebook workflow action contract', () => {
  it('keeps notebook mutations behind portfolioClient and local workspace state updates', () => {
    const source = read('features/notebook/hooks/useNotebookWorkspaceActions.ts');

    expect(source).toContain("from '@/shared/lib/portfolio-client'");
    expect(source).toContain('portfolioClient.createPortfolio');
    expect(source).toContain('portfolioClient.createLot');
    expect(source).toContain('portfolioClient.importPortfolio');
    expect(source).toContain('portfolioClient.deletePortfolio');
    expect(source).toContain('mergePortfolioIntoState(created');
    expect(source).toContain('setSelectedPortfolioId(created.id)');
    expect(source).toContain('removePortfolioFromState(portfolio.id)');
  });

  it('keeps active portfolio selection separate from detail navigation', () => {
    const source = read('features/notebook/components/NotebookContainer.tsx');
    const hook = read('features/notebook/hooks/useNotebookWorkspaceActions.ts');

    expect(source).toContain(
      'const [detailPortfolioId, setDetailPortfolioId] = useState<string | null>(null);',
    );
    expect(source).toContain('setSelectedPortfolioId(portfolio.id);');
    expect(source).toContain('persistSelectedPortfolioId(portfolio.id);');
    expect(source).toContain('setDetailPortfolioId(portfolio.id);');
    expect(hook).toContain('clearDetailPortfolio(portfolio.id);');
  });

  it('keeps workspace mutations gated by canManageWorkspace in rendered actions', () => {
    const source = read('features/notebook/components/NotebookContainer.tsx');

    expect(source).toContain('canManageWorkspace={canManageWorkspace}');
    expect(source).toContain('onCreate={canManageWorkspace ? handleCreateDefault : () => {}}');
    expect(source).toContain('onCreateDemo={canManageWorkspace ? handleCreateDemo : () => {}}');
    expect(source).toContain('onImport={canManageWorkspace ? handleImportClick : () => {}}');
  });
});
