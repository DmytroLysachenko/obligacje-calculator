import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';

const source = readFileSync('shared/context/BondDefinitionsContext.tsx', 'utf8');

describe('bond definitions provider seam', () => {
  it('owns the context object in one module', () => {
    expect(source).toContain('createContext<BondDefinitionsContextType | undefined>');
    expect(source).toContain('const BondDefinitionsContext');
  });
  it('loads data through the private resource hook', () => {
    expect(source).toContain("useBondDefinitions as useBondDefinitionsHook");
    expect(source).toContain('useBondDefinitionsHook()');
  });
  it('exposes definitions, loading, and errors as the provider interface', () => {
    expect(source).toContain('definitions: Record<BondType, BondDefinition> | null;');
    expect(source).toContain('isLoading: boolean;');
    expect(source).toContain('error: Error | null;');
  });
  it('does not expose the ClientResource implementation to callers', () => {
    expect(source).not.toContain('ClientResource');
    expect(source).not.toContain('apiGet');
    expect(source).not.toContain('/api/bond-definitions');
  });
  it('fails loudly when a UI module is outside the root provider', () => {
    expect(source).toContain('must be used within a BondDefinitionsProvider');
  });

  it('does not make provider callers understand cache lifetime', () => {
    expect(source).not.toContain('maxAgeMs');
    expect(source).not.toContain('staleAfterMs');
    expect(source).not.toContain('refresh');
    expect(source).not.toContain('invalidate');
  });

  it('keeps the provider value deliberately narrow', () => {
    const providedValue = 'value={{ definitions, isLoading, error }}';
    expect(source).toContain(providedValue);
    expect(source).not.toContain('value={{ definitions, isLoading, error,');
  });

  it('does not create a duplicate fetch in the provider body', () => {
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('useEffect(');
    expect(source).not.toContain('useSyncExternalStore');
  });

  it('provides the same context to the whole app subtree', () => {
    expect(source).toContain('<BondDefinitionsContext.Provider');
    expect(source).toContain('{children}');
    expect(source).toContain('</BondDefinitionsContext.Provider>');
  });

  it('keeps the context type private to this seam', () => {
    expect(source).toContain('interface BondDefinitionsContextType');
  });
});
