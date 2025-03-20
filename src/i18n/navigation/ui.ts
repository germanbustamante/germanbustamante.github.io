import { defaultLanguage as defaultLang } from '../home/ui';

export const navigationTranslationKeys = {
    'en': {
      'navigation.home': 'Home',
      'navigation.projects': 'Projects',
      'navigation.blog': 'Posts',

    },
    'es': {
      'navigation.home': 'Inicio',
      'navigation.projects': 'Proyectos',
      'navigation.blog': 'Publicaciones',
    }
};

export function useTranslations(lang: keyof typeof navigationTranslationKeys) {
  return function t(key: keyof typeof navigationTranslationKeys[typeof defaultLang]) {
    return navigationTranslationKeys[lang][key] || navigationTranslationKeys[defaultLang][key];
  }
}