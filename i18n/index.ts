export * from "./context";
export * from "./config";

import { createTranslator } from "next-intl";
import en from "./translations/en.json";
import pl from "./translations/pl.json";
import { defaultLocale, type Language } from "./config";

type TranslationVariables = Record<string, string | number>;

const messagesByLocale = {
  en,
  pl,
} as const;

function getTranslator(language: Language = defaultLocale) {
  return createTranslator({
    locale: language,
    messages: messagesByLocale[language],
  });
}

export function t(
  key: string,
  variables?: TranslationVariables,
  lang: Language = defaultLocale,
): string {
  return getTranslator(lang)(key as never, variables as never);
}
