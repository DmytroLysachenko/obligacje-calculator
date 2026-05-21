import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';

export async function getLocalizedPageMetadata(pageKey: string): Promise<Metadata> {
  const common = await getTranslations('common');
  const page = await getTranslations(`metadata.pages.${pageKey}`);

  return {
    title: `${page('title')} | ${common('title')}`,
    description: page('description'),
  };
}
