import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('bond definition repository contract', () => {
  it('exposes definition reads through a repository interface', () => {
    const source = read('lib/data/bond-definition-data.ts');

    expect(source).toContain('export interface BondDefinitionRepository');
    expect(source).toContain('listDefinitions(): Promise<BondDefinition[]>');
    expect(source).toContain('getDefinitionsMap(): Promise<Record<BondType, BondDefinition>>');
    expect(source).toContain('export const bondDefinitionRepository');
  });

  it('keeps controllers on repositories and services on injectable dependencies', () => {
    const service = read('features/bond-core/application-service.ts');
    const route = read('app/api/bond-definitions/route.ts');

    expect(service).toContain('getDefinitions: getBondDefinitionsMap');
    expect(service).toContain('getDefinitions: () => Promise<Record<BondType, BondDefinition>>');
    expect(route).toContain('bondDefinitionRepository.getDefinitionsMap()');
    expect(route).not.toContain('getBondDefinitionsMap');
  });
});
