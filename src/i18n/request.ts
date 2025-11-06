import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, locales, type Locale } from './config';
import { getMessages } from './messages';

export default getRequestConfig(async ({ locale }) => {
  const normalizedLocale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;

  return {
    locale: normalizedLocale,
    messages: await getMessages(normalizedLocale),
  };
});

