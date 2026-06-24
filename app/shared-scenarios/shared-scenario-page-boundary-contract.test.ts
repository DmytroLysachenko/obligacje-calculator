import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');
}

describe('shared scenario page boundary', () => {
  it('keeps shared scenario page reads behind the server service boundary', () => {
    const page = read('app/shared-scenarios/[shareId]/page.tsx');
    const service = read('lib/server/shared-scenarios/service.ts');

    expect(page).toContain("from '@/lib/server/shared-scenarios/service'");
    expect(page).toContain('getSharedSingleScenarioMetadata');
    expect(page).toContain('getSharedSingleScenarioPageData');
    expect(page).not.toContain("from '@/db'");
    expect(page).not.toContain('db.query');
    expect(page).not.toContain('parseSharedSingleScenarioPayload');
    expect(page).toContain('notFound()');

    expect(service).toContain('getSharedSingleScenarioMetadata');
    expect(service).toContain('getSharedSingleScenarioPageData');
    expect(service).toContain('db.query.sharedSingleScenarios.findFirst');
    expect(service).toContain('parseSharedSingleScenarioPayload');
  });
});
