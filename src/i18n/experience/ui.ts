import { defaultLanguage as defaultLang } from "../home/ui";

export const experienceTranslationKeys = {
  en: {
    "experience.ifeel.role": "Android Architect",
    "experience.ifeel.period": "Sept 2023 – Present",
    "experience.ifeel.location": "Remote, Spain",
    "experience.ifeel.type": "Full-time",
    "experience.ifeel.bullet1":
      "Led the architectural modernization of 2 production apps (100K+ users) into a multi-module Clean Architecture of 10 independent modules with explicit dependency boundaries",
    "experience.ifeel.bullet2":
      "Led and architected the full XML → Jetpack Compose migration, building a reusable component library shared by both applications",
    "experience.ifeel.bullet3":
      "Designed scalable UI layer with MVVM/MVI, implementing 20+ domain use cases with functional error handling using Arrow Either pattern",
    "experience.ifeel.bullet4":
      "Built comprehensive CI/CD infrastructure with Bitrise and Fastlane: automated testing, multi-environment builds, Firebase App Distribution, and staged Play Store rollouts",
    "experience.ifeel.bullet5":
      "Established a testing strategy that took code coverage from 0% to 68%, adding Maestro and Espresso E2E tests on top of JUnit 5, MockK and Turbine, with a zero-issue Detekt policy",
    "experience.ifeel.bullet6":
      "Shipped shared Android/iOS business logic to production with Kotlin Multiplatform, keeping behaviour consistent across both clients",
    "experience.ifeel.bullet7":
      "Mentored a team of 4 developers through structured onboarding and architecture-focused code reviews, and set the team's development standards and technical documentation",

    "experience.alten.role": "Android Developer",
    "experience.alten.period": "June 2022 – Sept 2023",
    "experience.alten.location": "Seville, Spain",
    "experience.alten.type": "On-site",
    "experience.alten.bullet1":
      "Worked on the ZaraHome Android app (Inditex group) within an established team and codebase, building core shared libraries reused across several group apps with reusable components designed around SOLID principles",
    "experience.alten.bullet2":
      "Shipped features, bug fixes and performance improvements on apps with millions of users, improving load times and reducing crashes in legacy code",
    "experience.alten.bullet3":
      "Worked with professional CI/CD on Jenkins: pipeline configuration, build automation and the full SDLC in a production environment",
    "experience.alten.bullet4":
      "Contributed to a large-scale commercial Android project in cross-functional Agile (Scrum) teams with Product, Design and Backend, through code reviews and pair programming",
  },
  es: {
    "experience.ifeel.role": "Android Architect",
    "experience.ifeel.period": "Sept 2023 – Presente",
    "experience.ifeel.location": "Remoto, España",
    "experience.ifeel.type": "Jornada completa",
    "experience.ifeel.bullet1":
      "Lideré la modernización arquitectónica de 2 apps en producción (100K+ usuarios) hacia una Clean Architecture multi-módulo de 10 módulos independientes con fronteras de dependencia explícitas",
    "experience.ifeel.bullet2":
      "Lideré y arquitecté la migración completa de XML → Jetpack Compose, construyendo una librería de componentes reutilizables compartida por ambas aplicaciones",
    "experience.ifeel.bullet3":
      "Diseñé capa UI escalable con MVVM/MVI, implementando más de 20 casos de uso de dominio con manejo funcional de errores usando el patrón Arrow Either",
    "experience.ifeel.bullet4":
      "Construí infraestructura CI/CD integral con Bitrise y Fastlane: testing automatizado, builds multi-entorno, Firebase App Distribution y rollouts escalonados en Play Store",
    "experience.ifeel.bullet5":
      "Establecí una estrategia de testing que llevó la cobertura de código de 0% a 68%, sumando tests E2E con Maestro y Espresso a JUnit 5, MockK y Turbine, con una política de cero incidencias en Detekt",
    "experience.ifeel.bullet6":
      "Llevé a producción lógica de negocio compartida entre Android e iOS con Kotlin Multiplatform, manteniendo un comportamiento coherente en ambos clientes",
    "experience.ifeel.bullet7":
      "Mentoricé a un equipo de 4 desarrolladores con un onboarding estructurado y code reviews centradas en arquitectura, y fijé los estándares de desarrollo y la documentación técnica del equipo",

    "experience.alten.role": "Android Developer",
    "experience.alten.period": "Junio 2022 – Sept 2023",
    "experience.alten.location": "Sevilla, España",
    "experience.alten.type": "Presencial",
    "experience.alten.bullet1":
      "Trabajé en la app Android de ZaraHome (grupo Inditex) dentro de un equipo y codebase ya establecidos, desarrollando librerías core compartidas por varias apps del grupo con componentes reutilizables diseñados según los principios SOLID",
    "experience.alten.bullet2":
      "Entregué funcionalidades, corrección de bugs y mejoras de rendimiento en apps con millones de usuarios, reduciendo tiempos de carga y crashes en código legacy",
    "experience.alten.bullet3":
      "Trabajé con CI/CD profesional en Jenkins: configuración de pipelines, automatización de builds y el ciclo completo de SDLC en un entorno de producción",
    "experience.alten.bullet4":
      "Contribuí a un proyecto Android comercial a gran escala en equipos Agile (Scrum) multidisciplinares con Producto, Diseño y Backend, con code reviews y pair programming",
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
