import { defaultLanguage as defaultLang } from "../home/ui";

export const projectTranslationKeys = {
  en: {
    "project.title": "Featured Projects",
    "project.description":
      "Projects that showcase my expertise in Android architecture, Kotlin Multiplatform, and modern mobile development.",
    "project.caseStudy": "Read the case study",

    // Fuelio
    "project.fuelio.name": "Fuelio",
    "project.fuelio.description":
      "A Kotlin Multiplatform gas-station finder sharing domain, data and presentation logic between Android and iOS, with fully native UI on each platform — Jetpack Compose and SwiftUI, not Compose Multiplatform. Real-time fuel-price comparison with geolocation, offline-first persistence and reactive filtering.",
    "project.fuelio.highlight1":
      "Native UI on both platforms over a shared Kotlin presentation layer — migrated off Compose Multiplatform, documented in an ADR",
    "project.fuelio.highlight2":
      "A presentation module with zero Compose dependencies, compiling as both an Android library and a Kotlin/Native framework for Xcode",
    "project.fuelio.highlight3":
      "Offline-first with Room: stale-while-revalidate emits cached data first, and a failed refresh never blanks the screen",
    "project.fuelio.highlight4":
      "Kotlin↔Swift bridge via SKIE, KMP-NativeCoroutines and KMP-ObservableViewModel, replacing a hand-rolled interop layer",
    "project.fuelio.highlight5":
      "450+ tests across Kotlin, Swift Testing and XCUITest, plus Roborazzi screenshot tests with committed goldens",
    "project.fuelio.highlight6":
      "9 ADRs and a release pipeline with a single source of truth for the version: a signed Android build on GitHub Releases and Firebase App Distribution, plus an iOS archive that proves the app packages",
    "project.fuelio.highlight7":
      "One set of design tokens defined in Kotlin and consumed by both Compose and SwiftUI, with a test that fails if the Swift side drifts",

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
    "project.caseStudy": "Lee el caso de estudio",

    // Fuelio
    "project.fuelio.name": "Fuelio",
    "project.fuelio.description":
      "Buscador de gasolineras en Kotlin Multiplatform que comparte lógica de dominio, datos y presentación entre Android e iOS, con UI totalmente nativa en cada plataforma — Jetpack Compose y SwiftUI, no Compose Multiplatform. Comparativa de precios en tiempo real con geolocalización, persistencia offline-first y filtrado reactivo.",
    "project.fuelio.highlight1":
      "UI nativa en ambas plataformas sobre una capa de presentación compartida en Kotlin — migrada desde Compose Multiplatform, documentado en un ADR",
    "project.fuelio.highlight2":
      "Un módulo de presentación sin ninguna dependencia de Compose, que compila a la vez como librería Android y como framework Kotlin/Native para Xcode",
    "project.fuelio.highlight3":
      "Offline-first con Room: stale-while-revalidate emite primero los datos en caché, y un refresh fallido nunca vacía la pantalla",
    "project.fuelio.highlight4":
      "Puente Kotlin↔Swift con SKIE, KMP-NativeCoroutines y KMP-ObservableViewModel, en sustitución de una capa de interop hecha a mano",
    "project.fuelio.highlight5":
      "Más de 450 tests en Kotlin, Swift Testing y XCUITest, además de tests de screenshots con Roborazzi y goldens versionados",
    "project.fuelio.highlight6":
      "9 ADRs y un pipeline de release con la versión como única fuente de verdad: build de Android firmado en GitHub Releases y Firebase App Distribution, y un archive de iOS que demuestra que la app empaqueta",
    "project.fuelio.highlight7":
      "Un único set de design tokens definido en Kotlin y consumido tanto por Compose como por SwiftUI, con un test que falla si el lado Swift se desvía",

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
