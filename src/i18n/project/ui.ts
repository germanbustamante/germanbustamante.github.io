import { defaultLanguage as defaultLang } from "../home/ui";

export const projectTranslationKeys = {
  en: {
    "project.title": "Featured Projects",
    "project.description":
      "Projects that showcase my expertise in Android architecture, Kotlin Multiplatform, and modern mobile development.",

    // Fuelio
    "project.fuelio.name": "Fuelio",
    "project.fuelio.description":
      "A production Kotlin Multiplatform app sharing domain, data and UI logic between Android and iOS via Compose Multiplatform. Real-time fuel-price comparison with geolocation, reactive filtering and a custom design system.",
    "project.fuelio.highlight1":
      "True multiplatform: single codebase for Android + iOS (Compose Multiplatform)",
    "project.fuelio.highlight2":
      "Layered Clean Architecture across 3 KMP modules (domain / data / app)",
    "project.fuelio.highlight3":
      "Per-platform Ktor engines via expect/actual (OkHttp on Android, Darwin on iOS)",
    "project.fuelio.highlight4":
      "Annotation-based Koin DI with platform-specific init (SwiftUI bridge on iOS)",
    "project.fuelio.highlight5":
      "Custom design system: 14 tokenized Material 3 components, accessibility-first",
    "project.fuelio.highlight6":
      "Multiplatform tests with Mokkery + Turbine and the Mother pattern",

    // Ringtone Manager
    "project.ringtone.name": "Ringtone Manager",
    "project.ringtone.description":
      "A production-grade Android app built as an architecture showcase: 10-module Clean Architecture with dependency rules enforced at compile time, offline-first data and a fully gated CI/CD pipeline.",
    "project.ringtone.highlight1":
      "10-module Clean Architecture; dependency rules enforced via module-graph-assert",
    "project.ringtone.highlight2":
      "Functional error handling with Arrow Either over sealed domain errors",
    "project.ringtone.highlight3":
      "Offline-first: Room as single source of truth, async Firestore sync + cursor pagination",
    "project.ringtone.highlight4":
      "Navigation 3 with independent multi-stack back stacks per tab",
    "project.ringtone.highlight5":
      "Koin DI graph verified by a unit test; Kover ≥80% gate, Detekt, Dependency Guard",
    "project.ringtone.highlight6":
      "6 ADRs + GitHub Actions CI (tests, coverage, Paparazzi screenshots, lint, release)",

    // InaDraft
    "project.inadraft.name": "InaDraft",
    "project.inadraft.description":
      "An Android app to create custom templates of your favorite players from the Inazuma Eleven series. Choose a lineup, build your dream team, and compete in the ranking of best teams. Full-stack project: Android app + backend.",
    "project.inadraft.highlight1": "Custom team builder with drag & drop",
    "project.inadraft.highlight2": "Community rankings and leaderboards",
    "project.inadraft.highlight3": "Firebase backend integration",
    "project.inadraft.highlight4": "Full-stack: Android app + backend API",
  },
  es: {
    "project.title": "Proyectos Destacados",
    "project.description":
      "Proyectos que demuestran mi experiencia en arquitectura Android, Kotlin Multiplatform y desarrollo móvil moderno.",

    // Fuelio
    "project.fuelio.name": "Fuelio",
    "project.fuelio.description":
      "App de producción en Kotlin Multiplatform que comparte la lógica de dominio, datos y UI entre Android e iOS con Compose Multiplatform. Comparativa de precios de combustible en tiempo real con geolocalización, filtrado reactivo y design system propio.",
    "project.fuelio.highlight1":
      "Multiplataforma real: un solo código para Android + iOS (Compose Multiplatform)",
    "project.fuelio.highlight2":
      "Clean Architecture por capas en 3 módulos KMP (domain / data / app)",
    "project.fuelio.highlight3":
      "Motores Ktor por plataforma con expect/actual (OkHttp en Android, Darwin en iOS)",
    "project.fuelio.highlight4":
      "Koin con DI por anotaciones e init específico por plataforma (bridge SwiftUI en iOS)",
    "project.fuelio.highlight5":
      "Design system propio: 14 componentes Material 3 tokenizados, accessibility-first",
    "project.fuelio.highlight6":
      "Tests multiplataforma con Mokkery + Turbine y patrón Mother",

    // Ringtone Manager
    "project.ringtone.name": "Ringtone Manager",
    "project.ringtone.description":
      "App Android de nivel producción concebida como escaparate de arquitectura: Clean Architecture de 10 módulos con reglas de dependencia verificadas en compilación, datos offline-first y pipeline CI/CD con gates completos.",
    "project.ringtone.highlight1":
      "Clean Architecture de 10 módulos; reglas de dependencia verificadas con module-graph-assert",
    "project.ringtone.highlight2":
      "Manejo funcional de errores con Arrow Either sobre errores de dominio sellados",
    "project.ringtone.highlight3":
      "Offline-first: Room como única fuente de verdad, sync asíncrono con Firestore + paginación por cursor",
    "project.ringtone.highlight4":
      "Navigation 3 con back stacks multi-pila independientes por pestaña",
    "project.ringtone.highlight5":
      "Grafo de DI de Koin verificado por test unitario; gate de Kover ≥80%, Detekt, Dependency Guard",
    "project.ringtone.highlight6":
      "6 ADRs + CI en GitHub Actions (tests, cobertura, screenshots Paparazzi, lint, release)",

    // InaDraft
    "project.inadraft.name": "InaDraft",
    "project.inadraft.description":
      "Una app Android para crear plantillas personalizadas de tus jugadores favoritos de la serie Inazuma Eleven. Elige una alineación, crea tu equipo ideal y compite en el ranking de mejores equipos. Proyecto full-stack: app Android + backend.",
    "project.inadraft.highlight1": "Constructor de equipos con drag & drop",
    "project.inadraft.highlight2": "Rankings y tablas de clasificación",
    "project.inadraft.highlight3": "Integración con backend Firebase",
    "project.inadraft.highlight4": "Full-stack: app Android + API backend",
  },
};

type TranslationKey = keyof (typeof projectTranslationKeys)[typeof defaultLang];

export function useTranslations(lang: keyof typeof projectTranslationKeys) {
  return function t(key: string) {
    return (
      projectTranslationKeys[lang][key as TranslationKey] ||
      projectTranslationKeys[defaultLang][key as TranslationKey]
    );
  };
}
