import { defaultLanguage as defaultLang } from "../home/ui";

export const certificationsTranslationKeys = {
  en: {
    "certifications.arch.name": "Software Architecture, Testing and Quality",
    "certifications.arch.issuer": "DevExperto (Antonio Leiva)",
    "certifications.arch.date": "June 2023",
    "certifications.arch.description":
      "Advanced Android architectures, testing strategies, SOLID principles, and code quality.",

    "certifications.compose.name": "Jetpack Compose Expert",
    "certifications.compose.issuer": "DevExperto (Antonio Leiva)",
    "certifications.compose.date": "June 2023",
    "certifications.compose.description":
      "Advanced Compose: custom components, performance optimization, state management.",
  },
  es: {
    "certifications.arch.name":
      "Arquitectura de Software, Testing y Calidad",
    "certifications.arch.issuer": "DevExperto (Antonio Leiva)",
    "certifications.arch.date": "Junio 2023",
    "certifications.arch.description":
      "Arquitecturas Android avanzadas, estrategias de testing, principios SOLID y calidad de código.",

    "certifications.compose.name": "Jetpack Compose Expert",
    "certifications.compose.issuer": "DevExperto (Antonio Leiva)",
    "certifications.compose.date": "Junio 2023",
    "certifications.compose.description":
      "Compose avanzado: componentes personalizados, optimización de rendimiento, gestión de estado.",
  },
};

type TranslationKey = keyof (typeof certificationsTranslationKeys)[typeof defaultLang];

export function useTranslations(
  lang: keyof typeof certificationsTranslationKeys,
) {
  return function t(key: string) {
    return (
      certificationsTranslationKeys[lang][key as TranslationKey] ||
      certificationsTranslationKeys[defaultLang][key as TranslationKey]
    );
  };
}
