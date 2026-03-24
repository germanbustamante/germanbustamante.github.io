import { defaultLanguage as defaultLang } from "../home/ui";

export const experienceTranslationKeys = {
  en: {
    "experience.ifeel.role": "Android Architect",
    "experience.ifeel.period": "Sept 2023 – Present",
    "experience.ifeel.location": "Remote, Spain",
    "experience.ifeel.type": "Full-time",
    "experience.ifeel.bullet1":
      "Led architectural modernization of 2 production apps (100K+ users): designed multi-module Clean Architecture with 10 independent modules, reducing technical debt by 60%",
    "experience.ifeel.bullet2":
      "Architected complete XML → Jetpack Compose migration, reducing feature development time by 40% and building a reusable component library shared across applications",
    "experience.ifeel.bullet3":
      "Designed scalable UI layer with MVVM/MVI, implementing 20+ domain use cases with functional error handling using Arrow Either pattern",
    "experience.ifeel.bullet4":
      "Built comprehensive CI/CD infrastructure with Bitrise and Fastlane: automated testing, multi-environment builds, Firebase App Distribution, and staged Play Store rollouts",
    "experience.ifeel.bullet5":
      "Established testing strategy increasing code coverage from 0% to 68% with JUnit 5, MockK, and Turbine",

    "experience.alten.role": "Android Developer",
    "experience.alten.period": "June 2022 – Sept 2023",
    "experience.alten.location": "Seville, Spain",
    "experience.alten.type": "On-site",
    "experience.alten.bullet1":
      "Developed core shared libraries for Inditex ecosystem (ZaraHome) used across multiple group apps serving millions of users, implementing reusable UI components and data layers",
    "experience.alten.bullet2":
      "Built CI/CD infrastructure with Bitrise (15 workflows) and Fastlane automation, reducing release errors by 85%",
    "experience.alten.bullet3":
      "Implemented real-time features: WebSocket chat (ActionCable), multi-gateway payments (Stripe/PayPal), Zoom SDK integration",
    "experience.alten.bullet4":
      "Mentored team of 7 developers: designed structured onboarding reducing time-to-productivity by 50%, established coding standards and technical documentation",
  },
  es: {
    "experience.ifeel.role": "Android Architect",
    "experience.ifeel.period": "Sept 2023 – Presente",
    "experience.ifeel.location": "Remoto, España",
    "experience.ifeel.type": "Jornada completa",
    "experience.ifeel.bullet1":
      "Lideré la modernización arquitectónica de 2 apps en producción (100K+ usuarios): diseñé Clean Architecture multi-módulo con 10 módulos independientes, reduciendo la deuda técnica en un 60%",
    "experience.ifeel.bullet2":
      "Arquitecté migración completa de XML → Jetpack Compose, reduciendo el tiempo de desarrollo de features en un 40% y construyendo una librería de componentes reutilizables compartida entre aplicaciones",
    "experience.ifeel.bullet3":
      "Diseñé capa UI escalable con MVVM/MVI, implementando más de 20 casos de uso de dominio con manejo funcional de errores usando el patrón Arrow Either",
    "experience.ifeel.bullet4":
      "Construí infraestructura CI/CD integral con Bitrise y Fastlane: testing automatizado, builds multi-entorno, Firebase App Distribution y rollouts escalonados en Play Store",
    "experience.ifeel.bullet5":
      "Establecí estrategia de testing incrementando la cobertura de código de 0% a 68% con JUnit 5, MockK y Turbine",

    "experience.alten.role": "Android Developer",
    "experience.alten.period": "Junio 2022 – Sept 2023",
    "experience.alten.location": "Sevilla, España",
    "experience.alten.type": "Presencial",
    "experience.alten.bullet1":
      "Desarrollé librerías compartidas core para el ecosistema Inditex (ZaraHome) usadas en múltiples apps del grupo sirviendo a millones de usuarios, implementando componentes UI reutilizables y capas de datos",
    "experience.alten.bullet2":
      "Construí infraestructura CI/CD con Bitrise (15 workflows) y automatización con Fastlane, reduciendo errores en releases en un 85%",
    "experience.alten.bullet3":
      "Implementé funcionalidades en tiempo real: chat WebSocket (ActionCable), pagos multi-pasarela (Stripe/PayPal), integración Zoom SDK",
    "experience.alten.bullet4":
      "Mentoricé equipo de 7 desarrolladores: diseñé onboarding estructurado reduciendo el tiempo hasta productividad en un 50%, establecí estándares de código y documentación técnica",
  },
};

type TranslationKey = keyof (typeof experienceTranslationKeys)[typeof defaultLang];

export function useTranslations(
  lang: keyof typeof experienceTranslationKeys,
) {
  return function t(key: string) {
    return (
      experienceTranslationKeys[lang][key as TranslationKey] ||
      experienceTranslationKeys[defaultLang][key as TranslationKey]
    );
  };
}
