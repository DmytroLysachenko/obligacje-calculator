import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('notebook guest boundary', () => {
  it('redirects guests to the OAuth login page before rendering notebook data', () => {
    const page = read('app/notebook/page.tsx');

    expect(page).toContain("import { auth } from '@/auth';");
    expect(page).toContain("redirect('/login?callbackUrl=%2Fnotebook');");
    expect(page).toContain('if (!session?.user?.id)');
  });

  it('keeps the private notebook out of guest navigation', () => {
    const navigation = read('shared/components/chrome/SidebarNavigation.tsx');
    const sidebar = read('shared/components/chrome/Sidebar.tsx');

    expect(navigation).toContain("feature.route !== '/notebook' || canManageWorkspace");
    expect(sidebar).toContain('buildSidebarNavSections(t, canManageWorkspace)');
  });
});
