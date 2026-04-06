---
title: "Exportando Módulos KMP como Swift Packages para iOS"
description: "Aprende a distribuir tus módulos Kotlin Multiplatform como dependencias de Swift Package Manager, desde la generación del XCFramework hasta el Package.swift."
pubDate: 2026-03-29
hero: "~/assets/heros/kmp_spm_export.png"
heroAlt: "Logo de Kotlin Multiplatform con icono de Swift Package Manager"
tags: ["Kotlin", "KMP", "Swift", "SPM", "iOS", "XCFramework"]
language: "es"
---

# Exportando Módulos KMP como Swift Packages para iOS

> Este post está basado en la documentación oficial de Kotlin:
> [Swift Package Export Setup](https://kotlinlang.org/docs/multiplatform/multiplatform-spm-export.html)
>
> Todo el crédito al equipo de JetBrains y Kotlin. Recomiendo leer la documentación original junto a este post.

## 🧠 Introducción: Reduciendo la Fricción de Adopción en iOS

Uno de los desafíos recurrentes de Kotlin Multiplatform es la historia de integración en el lado iOS. Los desarrolladores iOS viven en Xcode, piensan en Swift y quieren añadir dependencias como siempre lo han hecho — a través de Swift Package Manager.

Si tu módulo KMP no puede consumirse como un Swift package, los desarrolladores iOS tienen que adoptar un flujo de trabajo nuevo solo para usar tu código compartido. Esa fricción es real y ralentiza la adopción. La buena noticia es que KMP tiene soporte de primera clase para distribuirse como un XCFramework envuelto en un Swift package, y la configuración es más directa de lo que parece.

En mi experiencia, la inversión en esta configuración se amortiza rápido: una vez que tu módulo KMP es un Swift package correcto, el equipo iOS puede consumirlo exactamente como cualquier otra dependencia — sin necesitar conocimientos de Gradle.

## 📦 Lo Que Necesitas para Distribuir

Un Swift package respaldado por un XCFramework binario requiere dos artefactos:

*   **Un ZIP del XCFramework** — el binario compilado para todos los targets de Apple, comprimido y subido a almacenamiento accesible (GitHub Releases, S3, Maven, etc.)
*   **Un manifiesto `Package.swift`** — el archivo que le dice a SwiftPM dónde encontrar el binario y cómo exponerlo

### Eligiendo la Estructura de Repositorio

Hay tres opciones para ubicar tu `Package.swift`, y la elección importa más de lo que parece:

*   **Repositorios Git separados (recomendado)** — `Package.swift` vive en su propio repo, el código Kotlin en otro. Permite versionado independiente: puedes tagear un nuevo release del Swift package sin tocar el historial de commits del repo Kotlin. Ideal para librerías de consumo externo.
*   **Mismo repositorio que el código Kotlin** — más simple de mantener, pero los tags de Git de SwiftPM entrarán en conflicto con los tags de versión del proyecto. Funciona para proyectos internos donde controlas ambos lados.
*   **Dentro del proyecto consumidor** — evita el versionado por completo, pero crea problemas si múltiples packages dependen de tu módulo y complica la automatización de CI para actualizaciones sincronizadas. Evitar salvo proyectos muy pequeños.

## 🔧 Configurando el Build de Gradle

En tu `shared/build.gradle.kts`, configura el XCFramework:

```kotlin
import org.jetbrains.kotlin.gradle.plugin.mpp.apple.XCFramework

kotlin {
    val xcframeworkName = "Shared"
    val xcf = XCFramework(xcframeworkName)

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64(),
    ).forEach {
        it.binaries.framework {
            baseName = xcframeworkName
            binaryOption("bundleId", "org.example.${xcframeworkName}")
            xcf.add(this)
            isStatic = true
        }
    }
}
```

Algunas cosas que vale la pena destacar:

*   **`binaryOption("bundleId", ...)`** — establece el CFBundleIdentifier, que debe ser único. Sin esto, Xcode puede rechazar el framework.
*   **`isStatic = true`** — usa linkado estático salvo que tengas una razón específica para no hacerlo. Los frameworks dinámicos causan conflictos de símbolos cuando varios frameworks agrupan los mismos Swift packages.
*   Los tres targets (`iosX64`, `iosArm64`, `iosSimulatorArm64`) cubren simuladores y dispositivos físicos.

Luego ejecuta la tarea de ensamblado:

```bash
./gradlew :shared:assembleSharedXCFramework
```

El resultado se genera en `shared/build/XCFrameworks/release/Shared.xcframework`.

Para proyectos de Compose Multiplatform el módulo suele ser `composeApp`:

```bash
./gradlew :composeApp:assembleSharedXCFramework
```

## 📤 Empaquetado y Distribución

### Paso 1: Comprimir y calcular el checksum

```bash
# Comprimir el XCFramework
zip -r Shared.xcframework.zip Shared.xcframework

# Calcular el checksum (requerido para Package.swift)
swift package compute-checksum Shared.xcframework.zip
```

### Paso 2: Subir a GitHub Releases

1.  Ve a tu repositorio → **Releases** → **Create a new release**
2.  Crea un tag de versión semántica (ej: `1.0.0`)
3.  Adjunta el ZIP en el campo **Attach binaries**
4.  Publica el release
5.  Clic derecho en el ZIP bajo **Assets** → **Copiar dirección del enlace**

Verifica que el enlace sea públicamente accesible antes de continuar:

```bash
curl -I <tu-enlace-de-descarga>
# Debe devolver HTTP 200 o un redirect al asset
```

### Paso 3: Crear `Package.swift`

```swift
// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "Shared",
    platforms: [
        .iOS(.v14),
    ],
    products: [
        .library(name: "Shared", targets: ["Shared"])
    ],
    targets: [
        .binaryTarget(
            name: "Shared",
            url: "<enlace al ZIP del XCFramework subido>",
            checksum: "<checksum calculado para el ZIP>"
        )
    ]
)
```

### Paso 4: Validar y publicar

```bash
# Validar el manifiesto
swift package reset && swift package show-dependencies --format json

# Publicar Package.swift en tu repositorio dedicado
git add Package.swift
git commit -m "Release 1.0.0"
git tag 1.0.0
git push origin main --tags
```

## 🏗️ Exportando Múltiples Módulos

Si tu proyecto tiene módulos separados `network` y `database` que quieres exponer como un único Swift package, puedes crear un módulo umbrella.

### Configura el umbrella `together/build.gradle.kts`

```kotlin
kotlin {
    val frameworkName = "together"
    val xcf = XCFramework(frameworkName)

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            export(projects.network)
            export(projects.database)
            baseName = frameworkName
            xcf.add(this)
        }
    }

    sourceSets {
        commonMain.dependencies {
            api(projects.network)
            api(projects.database)
        }
    }
}
```

*   Usa `api()` — no `implementation()` — para las dependencias que quieres exportar. `implementation` las mantiene internas.
*   Usa `export()` dentro del bloque framework para hacer visible la API pública del módulo desde Swift.

### Cada módulo incluido debe declarar targets iOS

```kotlin
// network/build.gradle.kts
kotlin {
    android { }
    iosX64()
    iosArm64()
    iosSimulatorArm64()
}
```

### Workaround: crea un archivo Kotlin vacío

Gradle requiere al menos un archivo fuente para ensamblar el framework. Crea:

```
together/src/commonMain/kotlin/Together.kt
```

Déjalo vacío o añade un comentario — su contenido no importa.

Luego ensambla:

```bash
./gradlew :together:assembleTogetherReleaseXCFramework
```

Los consumidores Swift pueden importar ambos módulos con un único `import together`.

## ✅ Verificando la Integración

En Xcode, ve a **File | Add Package Dependencies**, pega la URL de tu repositorio con `Package.swift`, y añade el package.

Prueba el import con una vista SwiftUI mínima:

```swift
import SwiftUI
import Shared

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Platform: \(Shared.Platform_iosKt.getPlatform().name)")
        }
        .padding()
    }
}
```

Si el preview compila y muestra el nombre de la plataforma, la integración funciona correctamente.

## 💡 Conclusiones Clave

*   Un módulo KMP distribuido como Swift package requiere dos artefactos: un ZIP del XCFramework y un manifiesto `Package.swift`.
*   Usa repositorios Git separados para `Package.swift` y el código Kotlin cuando distribuyas externamente — el versionado independiente vale el esfuerzo extra de configuración.
*   Establece siempre un `bundleId` único mediante `binaryOption` y prefiere `isStatic = true` para evitar conflictos de símbolos.
*   Para exportaciones multi-módulo, usa `api()` + `export()` en un módulo umbrella y crea un archivo fuente vacío como workaround del requisito de build de Gradle.
*   Una vez publicado, el equipo iOS integra tu código KMP exactamente como cualquier otro Swift package — sin necesitar conocimientos de Gradle.

## 📚 Lectura Adicional

*   [Swift Package Export Setup](https://kotlinlang.org/docs/multiplatform/multiplatform-spm-export.html) — Documentación oficial de Kotlin
*   [Importando Swift Packages en KMP](/es/blog/kmp_spm_import) — Usa SDKs de iOS directamente desde código Kotlin compartido
*   [Migrando KMP de CocoaPods a SPM](/es/blog/kmp_cocoapods_to_spm_migration) — Guía de migración paso a paso
