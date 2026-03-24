import { defaultLanguage as defaultLang } from "../home/ui";

export const projectTranslationKeys = {
  en: {
    "project.title": "Featured Projects",
    "project.description":
      "Projects that showcase my expertise in Android architecture, Kotlin Multiplatform, and modern mobile development.",

    // KMP Notes App
    "project.kmp_notes.name": "KMP Notes App",
    "project.kmp_notes.description":
      "A cross-platform note-taking app built with Kotlin Multiplatform sharing business logic between Android (Jetpack Compose) and iOS (SwiftUI). Demonstrates shared networking, local database, and dependency injection across platforms.",
    "project.kmp_notes.highlight1":
      "Shared KMP module with Ktor + SQLDelight",
    "project.kmp_notes.highlight2":
      "Platform-specific UI (Compose + SwiftUI)",
    "project.kmp_notes.highlight3": "Koin for cross-platform DI",
    "project.kmp_notes.highlight4":
      "Clean Architecture with shared domain layer",
    "project.kmp_notes.highlight5": "Unit tests on shared module",

    // MovieArch
    "project.moviearch.name": "MovieArch",
    "project.moviearch.description":
      "A movie catalog app showcasing production-grade multi-module Clean Architecture with Jetpack Compose. Features modularized layers, comprehensive testing, and CI/CD pipeline.",
    "project.moviearch.highlight1":
      "8+ Gradle modules with Convention Plugins",
    "project.moviearch.highlight2":
      "MVVM + MVI hybrid with Arrow-kt error handling",
    "project.moviearch.highlight3": "Offline-first with Room + Retrofit",
    "project.moviearch.highlight4":
      "Full test coverage: Unit (JUnit5/MockK), UI (Espresso), Integration",
    "project.moviearch.highlight5": "Detekt + JaCoCo integrated",
    "project.moviearch.highlight6": "GitHub Actions CI/CD",

    // Ringtone Manager
    "project.ringtone.name": "Ringtone Manager",
    "project.ringtone.description":
      "A modern ringtone management app with Clean Architecture. Features audio playback with Media3/ExoPlayer, Firebase backend, and Material Design 3 UI.",
    "project.ringtone.highlight1": "Clean Architecture with MVVM",
    "project.ringtone.highlight2": "Media3/ExoPlayer for audio playback",
    "project.ringtone.highlight3": "Firebase (Auth, Firestore, Storage)",
    "project.ringtone.highlight4":
      "Jetpack Compose with Material Design 3",
    "project.ringtone.highlight5": "Hilt DI",

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

    // KMP Notes App
    "project.kmp_notes.name": "KMP Notes App",
    "project.kmp_notes.description":
      "Una app de notas multiplataforma construida con Kotlin Multiplatform compartiendo lógica de negocio entre Android (Jetpack Compose) e iOS (SwiftUI). Demuestra networking compartido, base de datos local e inyección de dependencias entre plataformas.",
    "project.kmp_notes.highlight1":
      "Módulo KMP compartido con Ktor + SQLDelight",
    "project.kmp_notes.highlight2":
      "UI específica por plataforma (Compose + SwiftUI)",
    "project.kmp_notes.highlight3": "Koin para DI multiplataforma",
    "project.kmp_notes.highlight4":
      "Clean Architecture con capa de dominio compartida",
    "project.kmp_notes.highlight5":
      "Tests unitarios en módulo compartido",

    // MovieArch
    "project.moviearch.name": "MovieArch",
    "project.moviearch.description":
      "Una app de catálogo de películas que muestra Clean Architecture multi-módulo de nivel producción con Jetpack Compose. Incluye capas modularizadas, testing integral y pipeline CI/CD.",
    "project.moviearch.highlight1":
      "8+ módulos Gradle con Convention Plugins",
    "project.moviearch.highlight2":
      "Híbrido MVVM + MVI con manejo de errores Arrow-kt",
    "project.moviearch.highlight3":
      "Offline-first con Room + Retrofit",
    "project.moviearch.highlight4":
      "Cobertura de tests completa: Unit (JUnit5/MockK), UI (Espresso), Integration",
    "project.moviearch.highlight5": "Detekt + JaCoCo integrados",
    "project.moviearch.highlight6": "CI/CD con GitHub Actions",

    // Ringtone Manager
    "project.ringtone.name": "Ringtone Manager",
    "project.ringtone.description":
      "Una app moderna de gestión de tonos con Clean Architecture. Incluye reproducción de audio con Media3/ExoPlayer, backend Firebase y UI Material Design 3.",
    "project.ringtone.highlight1": "Clean Architecture con MVVM",
    "project.ringtone.highlight2":
      "Media3/ExoPlayer para reproducción de audio",
    "project.ringtone.highlight3": "Firebase (Auth, Firestore, Storage)",
    "project.ringtone.highlight4":
      "Jetpack Compose con Material Design 3",
    "project.ringtone.highlight5": "Hilt DI",

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

export function useTranslations(
  lang: keyof typeof projectTranslationKeys,
) {
  return function t(key: string) {
    return (
      projectTranslationKeys[lang][key as TranslationKey] ||
      projectTranslationKeys[defaultLang][key as TranslationKey]
    );
  };
}
