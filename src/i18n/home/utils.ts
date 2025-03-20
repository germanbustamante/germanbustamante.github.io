import { homeTranslationKeys, defaultLanguage as defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in homeTranslationKeys) return lang as keyof typeof homeTranslationKeys;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof homeTranslationKeys) {
  return function t(key: keyof typeof homeTranslationKeys[typeof defaultLang]) {
    return homeTranslationKeys[lang][key] || homeTranslationKeys[defaultLang][key];
  }
}