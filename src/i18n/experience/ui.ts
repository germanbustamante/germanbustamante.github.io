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
      "Contributed to the ZaraHome Android app (Inditex group), working on feature development and bug fixing within an established team and codebase",
    "experience.alten.bullet2":
      "First exposure to professional CI/CD practices using Jenkins: learned pipeline configuration, build automation, and the full SDLC in a production environment",
    "experience.alten.bullet3":
      "Gained hands-on experience with Agile workflows, code review processes, and contributing to a large-scale commercial Android project as a junior developer",
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
      "Contribuí al desarrollo de la app Android de ZaraHome (grupo Inditex), trabajando en nuevas funcionalidades y resolución de bugs dentro de un equipo y codebase ya establecidos",
    "experience.alten.bullet2":
      "Primera experiencia con CI/CD profesional usando Jenkins: aprendí configuración de pipelines, automatización de builds y el ciclo completo de SDLC en un entorno de producción",
    "experience.alten.bullet3":
      "Adquirí experiencia práctica con flujos de trabajo Agile, procesos de code review y contribución a un proyecto Android comercial a gran escala como desarrollador junior",
  },
};

type TranslationKey =
  keyof (typeof experienceTranslationKeys)[typeof defaultLang];

export function useTranslations(lang: keyof typeof experienceTranslationKeys) {
  return function t(key: string) {
    return (
      experienceTranslationKeys[lang][key as TranslationKey] ||
      experienceTranslationKeys[defaultLang][key as TranslationKey]
    );
  };
}
