import {cookies} from 'next/headers';
import {getRequestConfig} from 'next-intl/server';
import {defaultLocale, isSupportedLocale} from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('app-language')?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`./translations/${locale}.json`)).default
  };
});
