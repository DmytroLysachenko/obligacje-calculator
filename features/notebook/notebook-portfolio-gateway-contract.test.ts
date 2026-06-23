import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

const portfolioGatewayClients = [
  'features/notebook/hooks/useNotebookWorkspaceActions.ts',
  'features/notebook/hooks/usePortfolioDetailsWorkspace.ts',
] as const;

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('notebook portfolio gateway contract', () => {
  it('keeps migrated notebook portfolio clients behind portfolioClient', () => {
    for (const relativePath of portfolioGatewayClients) {
      const source = read(relativePath);

      expect(source, relativePath).toContain("from '@/shared/lib/portfolio-client'");
      expect(source, relativePath).toContain('portfolioClient.');
      expect(source, relativePath).not.toMatch(/fetch\([^)]*\/api\/portfolio/);
      expect(source, relativePath).not.toContain("'/api/portfolio");
      expect(source, relativePath).not.toContain('"/api/portfolio');
    }

    const container = read('features/notebook/components/NotebookContainer.tsx');
    expect(container).toContain("from '@/features/notebook/hooks/useNotebookWorkspaceActions'");
    expect(container).not.toMatch(/fetch\([^)]*\/api\/portfolio/);
    expect(container).not.toContain("'/api/portfolio");
    expect(container).not.toContain('"/api/portfolio');
  });

  it('keeps portfolio endpoint strings centralized in the portfolio client', () => {
    const source = read('shared/lib/portfolio-client.ts');

    expect(source).toContain("apiGet<UserPortfolio[]>('/api/portfolio')");
    expect(source).toContain("apiPost<UserPortfolio>('/api/portfolio', input)");
    expect(source).toContain("apiPost<ImportPortfolioResult>('/api/portfolio/import', input)");
    expect(source).toContain("apiPost<PortfolioSimulationResult>('/api/portfolio/simulate', { portfolioId })");
    expect(source).not.toContain('window.fetch');
  });
});
