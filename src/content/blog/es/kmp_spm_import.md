---
title: "Importando Swift Packages en KMP: Guía Experimental"
description: "Explora la nueva funcionalidad experimental de importación SwiftPM para Kotlin Multiplatform y usa SDKs de iOS como Firebase desde tu código Kotlin compartido."
pubDate: 2026-03-29
hero: "~/assets/heros/kmp_spm_import.png"
heroAlt: "Dependencias de Swift Package Manager fluyendo hacia Kotlin Multiplatform"
tags: ["Kotlin", "KMP", "Swift", "SPM", "iOS", "Firebase"]
language: "es"
---

# Importando Swift Packages en KMP: Guía Experimental

> Este post está basado en la documentación oficial de Kotlin:
> [Adding Swift packages as dependencies to KMP modules](https://kotlinlang.org/docs/multiplatform/multiplatform-spm-import.html)
>
> Todo el crédito al equipo de JetBrains y Kotlin. Recomiendo leer la documentación original junto a este post.
>
> ⚠️ **Esta funcionalidad es experimental.** Requiere una build de desarrollo de Kotlin (`2.3.20-titan-222`) y no está pensada para uso en producción todavía. Comparte feedback en el canal `#kmp-swift-package-manager` de Slack.

## 🧠 Introducción: La Pieza que Faltaba

Antes de esta funcionalidad, usar un SDK específico de iOS desde código KMP compartido era tedioso. Las opciones eran:

*   Configurar la integración con CocoaPods y usar el bloque Gradle `cocoapods {}`
*   Escribir definiciones cinterop manualmente — potente pero tedioso y frágil
*   Mover el código específico de iOS al módulo iOS y llamarlo vía `expect`/`actual`

Ninguna de estas opciones se siente natural si vienes del lado Swift/Xcode. Swift Package Manager es la forma en que los desarrolladores iOS gestionan dependencias, y lo ha sido durante años. La DSL `swiftPMDependencies` trae esa familiaridad a KMP: declara tus dependencias de Swift packages en Gradle igual que lo harías en un `Package.swift`, y usa las APIs importadas directamente en tu código Kotlin de `iosMain`.

Este es un paso significativo hacia hacer que KMP se sienta nativo en ambos lados del stack — y cambia el cálculo para los equipos que evalúan la adopción de KMP.

## ⚠️ Estado Experimental y Limitaciones

Antes de continuar, las restricciones:

*   **Requiere Kotlin `2.3.20-titan-222`** — una build de desarrollo, no un release estable. Proyectos en producción deberían esperar.
*   **Export no soportado** — si tu módulo KMP usa `swiftPMDependencies`, no puedes exportarlo como Swift package todavía. Esto está rastreado en [KT-84420](https://youtrack.jetbrains.com/issue/KT-84420).
*   **Las dependencias transitivas se gestionan automáticamente** — no necesitas declararlas manualmente para tests o linkado.
*   **Canal de feedback:** `#kmp-swift-package-manager` en el Slack de Kotlin.

Dicho esto, si estás prototipando, explorando la adopción de KMP, o contribuyendo al ecosistema — esto es genuinamente emocionante.

## 🔧 Configuración

### 1. Configurar `settings.gradle.kts`

Añade el repositorio Maven de desarrollo de JetBrains para que Gradle pueda encontrar el plugin experimental:

```kotlin
dependencyResolutionManagement {
    repositories {
        maven("https://packages.jetbrains.team/maven/p/kt/dev")
        mavenCentral()
    }
}

pluginManagement {
    repositories {
        maven("https://packages.jetbrains.team/maven/p/kt/dev")
        mavenCentral()
        gradlePluginPortal()
    }
}
```

### 2. Fijar la versión de Kotlin

En tu catálogo de versiones (`libs.versions.toml`):

```kotlin
[versions]
kotlin = "2.3.20-titan-222"

[plugins]
kotlin-multiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
```

Si necesitas forzar la versión del plugin en el `build.gradle.kts` raíz:

```kotlin
buildscript {
    dependencies.constraints {
        "classpath"("org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.20-titan-222")
    }
}
```

### 3. Configuración del plugin IDE (opcional)

Si tu equipo usa el plugin IDE de Kotlin Multiplatform, apúntalo a la ruta del proyecto iOS:

```kotlin
kotlin {
    listOf(
        iosArm64(),
        iosSimulatorArm64(),
        iosX64(),
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "Shared"
            isStatic = false
        }
    }

    swiftPMDependencies {
        xcodeProjectPathForKmpIJPlugin.set(
            layout.projectDirectory.file("../iosApp/iosApp.xcodeproj")
        )
    }
}
```

## 📦 Añadiendo Dependencias de SwiftPM

Declara tus dependencias dentro del bloque `swiftPMDependencies`:

```kotlin
kotlin {
    iosArm64()
    iosSimulatorArm64()
    iosX64()

    swiftPMDependencies {
        swiftPackage(
            url = url("https://github.com/firebase/firebase-ios-sdk.git"),
            version = from("12.5.0"),
            products = listOf(product("FirebaseAnalytics")),
        )

        swiftPackage(
            url = url("https://github.com/apple/swift-protobuf.git"),
            version = exact("1.32.0"),
            products = listOf(),
        )
    }
}
```

### Opciones de Especificación de Versión

El parámetro `version` soporta varias estrategias — elige la que se ajuste a tus requisitos de estabilidad:

```kotlin
version = from("1.0")          // 1.0 o posterior (Gradle 'require')
version = exact("2.0")         // exactamente 2.0 (Gradle 'strict')
version = branch("main")       // seguir una rama (inestable — usar con cuidado)
version = revision("e74b07...")// fijar a un commit específico
```

### Descubrimiento de Módulos Clang

Por defecto, el plugin descubre automáticamente todos los módulos Clang en los productos especificados. Si necesitas control fino — por ejemplo, cuando el nombre del módulo Clang difiere del nombre del producto — desactiva el descubrimiento automático:

```kotlin
swiftPMDependencies {
    discoverClangModulesImplicitly = false

    swiftPackage(
        url = url("https://github.com/firebase/firebase-ios-sdk.git"),
        version = from("12.5.0"),
        products = listOf(
            product("FirebaseAnalytics"),
            product("FirebaseFirestore")
        ),
        importedClangModules = listOf(
            "FirebaseAnalytics",
            "FirebaseFirestoreInternal"  // nota: difiere del nombre del producto
        ),
    )
}
```

## 🌍 Restricciones de Plataforma

Si tu proyecto apunta a múltiples plataformas Apple y una dependencia solo soporta iOS, restríngela:

```kotlin
kotlin {
    iosArm64()
    iosSimulatorArm64()
    iosX64()
    macosArm64()

    swiftPMDependencies {
        swiftPackage(
            url = url("https://github.com/googlemaps/ios-maps-sdk.git"),
            version = exact("10.3.0"),
            products = listOf(
                product(
                    "GoogleMaps",
                    platforms = setOf(iOS())
                )
            )
        )
    }
}
```

Sin la restricción `platforms`, Gradle intentaría linkear Google Maps contra los targets de macOS y fallaría.

También puedes establecer los targets de deployment mínimo por plataforma:

```kotlin
swiftPMDependencies {
    iosMinimumDeploymentTarget.set("16.0")
    macosMinimumDeploymentTarget.set("13.0")
}
```

## 📱 Usando las APIs Importadas en Kotlin

Las APIs importadas están disponibles bajo el namespace:

```
swiftPMImport.<gradle-group>.<nombre-modulo>.<NombreAPI>
```

Si el `build.gradle.kts` de tu módulo declara `group = "org.example"` y el módulo se llama `shared`:

```kotlin
// shared/src/iosMain/kotlin/Analytics.kt
import swiftPMImport.org.example.shared.FIRAnalytics
import swiftPMImport.org.example.shared.FIRApp

fun initFirebase() {
    FIRApp.configure()
}

fun logEvent(name: String) {
    FIRAnalytics.logEventWithName(name, parameters: null)
}
```

El compilador de Kotlin gestiona la capa de interoperabilidad con Objective-C — llamas a las APIs de Firebase como si fueran funciones Kotlin normales.

## 📂 Swift Packages Locales

También puedes importar Swift packages desde el sistema de archivos local, lo que es útil para packages que tu equipo mantiene internamente o para prototipado:

```swift
// /ruta/a/LocalPackage/Package.swift
let package = Package(
    name: "LocalPackage",
    platforms: [.iOS("15.0")],
    products: [
        .library(name: "LocalPackage", targets: ["LocalPackage"]),
    ],
    targets: [
        .target(name: "LocalPackage")
    ]
)
```

```kotlin
// shared/build.gradle.kts
swiftPMDependencies {
    localSwiftPackage(
        directory = project.layout.projectDirectory.dir("/ruta/a/LocalPackage/"),
        products = listOf("LocalPackage")
    )
}
```

## ⚡ Frameworks Dinámicos vs Estáticos

Si usas `isStatic = false` (framework dinámico), puedes encontrar:

*   `Undefined symbols for architecture ...` — símbolo no encontrado en tiempo de linkado
*   `dyld: Symbol not found: ...` — símbolo faltante en tiempo de ejecución
*   `Class _Foo is implemented in both ...` — dos frameworks agrupan el mismo tipo

Estos ocurren porque los Swift packages pueden agrupar código nativo que conflictúa con el linkado de tu framework dinámico. El fix es directo:

```kotlin
listOf(iosArm64(), iosSimulatorArm64(), iosX64()).forEach { iosTarget ->
    iosTarget.binaries.framework {
        baseName = "Shared"
        isStatic = true  // cambiar a estático
    }
}
```

Mi recomendación: empieza con `isStatic = true` salvo que tengas una razón concreta para el linkado dinámico. Siempre puedes revisarlo más adelante.

## 💡 Conclusiones Clave

*   `swiftPMDependencies` reemplaza a CocoaPods y al cinterop manual para dependencias de SDKs iOS en KMP — un enfoque más limpio y con sabor más nativo.
*   La funcionalidad es experimental y requiere Kotlin `2.3.20-titan-222`. No usar en producción todavía.
*   Las APIs importadas están disponibles bajo el namespace `swiftPMImport.<group>.<modulo>`.
*   Usa `platforms = setOf(iOS())` para restringir dependencias a targets Apple específicos.
*   Actualmente no puedes exportar un módulo KMP como Swift package si usa `swiftPMDependencies` (KT-84420).
*   Prefiere `isStatic = true` para evitar conflictos de símbolos con frameworks dinámicos.

## 📚 Lectura Adicional

*   [Adding Swift packages as dependencies to KMP modules](https://kotlinlang.org/docs/multiplatform/multiplatform-spm-import.html) — Documentación oficial de Kotlin
*   [Exportando Módulos KMP como Swift Packages para iOS](/es/blog/kmp_spm_export) — Distribuye tu módulo KMP como un Swift package
*   [Migrando KMP de CocoaPods a SPM](/es/blog/kmp_cocoapods_to_spm_migration) — Guía de migración paso a paso
