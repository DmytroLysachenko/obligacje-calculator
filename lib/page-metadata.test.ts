import {describe, expect, it, vi} from 'vitest';
import {getLocalizedPageMetadata} from '@/lib/page-metadata';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace: string) => {
    if (namespace === 'common') {
      return (key: string) => ({title: 'Bonds Calculator'})[key as 'title'];
    }

    if (namespace === 'metadata.pages.singleCalculator') {
      return (key: string) => ({
        title: 'Single Calculator',
        description: 'Localized page description',
      })[key as 'title' | 'description'];
    }

    throw new Error(`Unexpected namespace: ${namespace}`);
  }),
}));

describe('getLocalizedPageMetadata', () => {
  it('builds localized page title and description', async () => {
    await expect(getLocalizedPageMetadata('singleCalculator')).resolves.toEqual({
      title: 'Single Calculator | Bonds Calculator',
      description: 'Localized page description',
    });
  });
});
