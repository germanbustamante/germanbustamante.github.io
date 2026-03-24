import { defaultLanguage as defaultLang } from "../home/ui";

export const navigationTranslationKeys = {
  en: {
    "navigation.home": "Home",
    "navigation.experience": "Experience",
    "navigation.projects": "Projects",
    "navigation.blog": "Blog",
    "navigation.contact": "Contact",
  },
  es: {
    "navigation.home": "Inicio",
    "navigation.experience": "Experiencia",
    "navigation.projects": "Proyectos",
    "navigation.blog": "Blog",
    "navigation.contact": "Contacto",
  },
};

type TranslationKey = keyof (typeof navigationTranslationKeys)[typeof defaultLang];

export function useTranslations(
  lang: keyof typeof navigationTranslationKeys,
) {
  return function t(key: string) {
    return (
      navigationTranslationKeys[lang][key as TranslationKey] ||
      navigationTranslationKeys[defaultLang][key as TranslationKey]
    );
  };
}
