---
title: "Migrando KMP de CocoaPods a Swift Package Manager"
description: "Guía paso a paso para migrar tu proyecto Kotlin Multiplatform de CocoaPods a SwiftPM, cubriendo build scripts, configuración de Xcode y limpieza."
pubDate: 2026-03-29
hero: "~/assets/heros/kmp_cocoapods_to_spm_migration.png"
heroAlt: "Flecha de migración de CocoaPods a Swift Package Manager"
tags: ["Kotlin", "KMP", "CocoaPods", "SPM", "iOS", "Migración"]
language: "es"
---

# Migrando KMP de CocoaPods a Swift Package Manager

> Este post está basado en la documentación oficial de Kotlin:
> [Switching from CocoaPods to Swift Package Manager dependencies](https://kotlinlang.org/docs/multiplatform/multiplatform-cocoapods-spm-migration.html)
>
> Todo el crédito al equipo de JetBrains y Kotlin. JetBrains también ofrece una herramienta de migración asistida por IA en [kmp-cocoapods-to-spm-migration](https://github.com/Kotlin/kmp-cocoapods-to-spm-migration/blob/master/SKILL.md). Recomiendo leer la documentación original para los detalles más actualizados.

## 🧠 Introducción: ¿Por Qué Migrar?

CocoaPods ha servido bien al ecosistema iOS, pero la tendencia es clara: Apple está invirtiendo en Swift Package Manager como solución nativa de gestión de dependencias, y la comunidad iOS más amplia lo está siguiendo. Para proyectos KMP, esto significa que el bloque Gradle `cocoapods {}` se está convirtiendo en una ruta de integración heredada.

Los costes prácticos de quedarse en CocoaPods:

*   Dependencia de la toolchain de Ruby (`gem install cocoapods`) — un paso de configuración extra para cada desarrollador iOS de tu equipo
*   `pod install` debe ejecutarse después de cada sincronización de Gradle — un paso extra fácil de olvidar
*   El Podfile y el directorio `Pods/` añaden ruido al repositorio
*   CocoaPods muestra una velocidad de desarrollo más lenta mientras SPM recibe mejoras de soporte nativo en Xcode con cada release de Apple

La ruta de integración de SwiftPM para KMP ya es lo suficientemente madura como para que la migración esté bien definida y sea reversible. Esta guía la recorre paso a paso.

## 🗺️ Visión General de la Migración

La migración tiene tres fases, y de forma crítica, **cada fase puede validarse antes de continuar**:

1.  **Actualizar el build script** — añadir dependencias SwiftPM junto a CocoaPods (la coexistencia es intencional aquí)
2.  **Reconfigurar Xcode** — cambiar de la integración con CocoaPods a la integración directa
3.  **Eliminar CocoaPods** — limpiar el Podfile, la configuración de Gradle y los archivos generados

> ⚠️ No saltes al paso 3 antes de completar el paso 2. CocoaPods y la integración directa son mutuamente excluyentes en Xcode. Elimina CocoaPods solo después de que la reconfiguración de Xcode esté completa.

## 📝 Paso 1: Actualizar el Build Script

**Requisito:** Plugin de Gradle de Kotlin Multiplatform versión `2.3.20-titan-222` o posterior.

### Añadir SwiftPM junto a CocoaPods

No elimines el bloque `cocoapods {}` todavía. Añade el bloque `swiftPMDependencies` junto a él:

```kotlin
// projectDir/sharedLogic/build.gradle.kts
kotlin {
    swiftPMDependencies {
        swiftPackage(
            url = url("https://github.com/firebase/firebase-ios-sdk.git"),
            version = from("12.5.0"),
            products = listOf(product("FirebaseAnalytics")),
        )
    }

    cocoapods {
        pod("FirebaseAnalytics") {
            version = "12.5.0"
        }
    }
}
```

Esto duplica temporalmente la dependencia. La coexistencia es intencional — permite actualizar las sentencias de import y verificar la compilación antes de tocar Xcode.

### Actualizar las sentencias de import

```kotlin
// Antes
import cocoapods.FirebaseAnalytics.FIRAnalytics

// Después
import swiftPMImport.org.example.package.FIRAnalytics
```

El nuevo namespace sigue el patrón `swiftPMImport.<gradle-group>.<nombre-modulo>`. Ajusta `org.example.package` para que coincida con la configuración de `group` de tu módulo en `build.gradle.kts`.

### Migrar la configuración del framework

CocoaPods configuraba el framework dentro del bloque `cocoapods {}`. Muévelo a la DSL estándar `binaries.framework {}`:

**Antes:**
```kotlin
kotlin {
    iosArm64()
    iosSimulatorArm64()
    iosX64()
    cocoapods {
        framework {
            baseName = "Shared"
            isStatic = true
        }
    }
}
```

**Después:**
```kotlin
kotlin {
    listOf(
        iosArm64(),
        iosSimulatorArm64(),
        iosX64(),
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "Shared"
            isStatic = true
        }
    }
}
```

Compila y ejecuta tus tests de Kotlin en este punto para verificar que los cambios de import son correctos antes de tocar Xcode.

## 🔨 Paso 2: Reconfigurar Xcode

Este paso cambia el proyecto iOS de la integración con el plugin de Gradle de CocoaPods a la **integración directa**, que es necesaria para que SwiftPM funcione.

### 1. Abre el proyecto en Xcode

```
File | Open Project in Xcode
```

### 2. Lanza una build (fallará — es lo esperado)

```
Product | Build
```

La build fallará con un error. Esto es intencional: la salida del error contiene el comando de integración que necesitas.

### 3. Encuentra el comando en el reporte de build

Ve a **View | Navigators | Report**, filtra por **Errors Only**, y busca un comando similar a:

```bash
XCODEPROJ_PATH='/ruta/al/proyecto/iosApp/iosApp.xcodeproj' \
GRADLE_PROJECT_PATH=':sharedLogic' \
'/ruta/al/proyecto/gradlew' -p '/ruta/al/proyecto' \
':sharedLogic:integrateEmbedAndSign' \
':sharedLogic:integrateLinkagePackage'
```

### 4. Ejecuta ese comando

Ejecútalo desde el directorio `iosApp`. Este comando modifica tu archivo `.xcodeproj` para:

*   Activar `embedAndSignAppleFrameworkForXcode` durante las builds de Xcode
*   Insertar la fase de compilación de Kotlin Multiplatform en el pipeline de build de iOS

### 5. Resuelve las dependencias SwiftPM en IntelliJ IDEA

```
Tools | Swift Package Manager | Resolve Dependencies
```

Lanza la build del proyecto en Xcode de nuevo — ahora debería funcionar correctamente.

## 🧹 Paso 3: Eliminar CocoaPods

Una vez que la build de Xcode pase con la integración directa, CocoaPods puede eliminarse.

### Opción A: Desintegración completa (todas las dependencias migradas)

Desde el directorio `iosApp`:

```bash
pod deintegrate
```

Esto elimina los archivos generados por CocoaPods del proyecto Xcode. Luego borra el directorio `Pods/` y `Podfile.lock`.

### Opción B: Eliminación parcial (quedan otros CocoaPods)

Si todavía tienes pods que no son KMP, edita el `Podfile` para eliminar solo la entrada del módulo KMP:

```ruby
target 'iosApp' do
  # Elimina esta línea — sharedLogic es el nombre de tu módulo KMP
  # pod 'sharedLogic', :path => '../sharedLogic'

  # Mantén otros pods aquí
  pod 'SomeOtherPod'
end
```

Luego ejecuta:

```bash
pod install
```

### Limpiar `build.gradle.kts`

Elimina el bloque `cocoapods {}` por completo:

```kotlin
// ELIMINA ESTE BLOQUE ENTERO
cocoapods {
    // ...
}
```

Si CocoaPods ya no se usa en ningún lugar del proyecto, elimina también las referencias al plugin en los bloques `plugins {}` tanto del `build.gradle.kts` raíz como del módulo compartido.

## ⚠️ Problemas Comunes y Consejos

*   **Compatibilidad de APIs** — Verifica que la versión del Swift package a la que migras expone las mismas APIs que la versión del pod. Normalmente coinciden, pero Firebase y otros SDKs grandes ocasionalmente reestructuran su layout de módulos entre canales de release.
*   **Cambio de namespace** — El namespace de importación cambia de `cocoapods.*` a `swiftPMImport.*`. Haz un reemplazo global en todos tus archivos fuente de `iosMain` antes de compilar.
*   **El orden importa** — Completa la reconfiguración de Xcode (Paso 2) antes de eliminar CocoaPods (Paso 3). Los dos mecanismos de integración son incompatibles; ejecutar `pod deintegrate` antes de configurar la integración directa deja Xcode en un estado roto.
*   **Linkado estático** — Si encuentras errores de `undefined symbols` o `duplicate class` después de la migración, comprueba que `isStatic = true` está configurado en tu configuración de framework. Los frameworks dinámicos tienen problemas conocidos con dependencias transitivas de Swift packages.
*   **La migración es reversible** — Si necesitas deshacer los cambios, vuelve a añadir el bloque `cocoapods {}` y ejecuta `pod install`. El estado de integración de CocoaPods es completamente reconstruible desde el Podfile y la configuración de Kotlin.

## 💡 Conclusiones Clave

*   Migrar de CocoaPods a SPM en KMP es un proceso de tres fases: actualizar Gradle → reconfigurar Xcode → eliminar CocoaPods. Cada fase es verificable de forma independiente.
*   La coexistencia durante la migración es intencional — tanto `swiftPMDependencies` como `cocoapods {}` pueden convivir temporalmente en el mismo `build.gradle.kts`.
*   El paso de reconfiguración de Xcode (obtener el comando de integración del build fallido) es la parte más delicada. No lo saltes.
*   El namespace de importación cambia de `cocoapods.*` a `swiftPMImport.*` — actualiza todos los archivos fuente antes de eliminar CocoaPods.
*   La migración vale la pena: menos tooling, configuración más rápida, resolución SPM nativa y alineación con hacia dónde está llevando Apple el ecosistema.

## 📚 Lectura Adicional

*   [Switching from CocoaPods to SwiftPM](https://kotlinlang.org/docs/multiplatform/multiplatform-cocoapods-spm-migration.html) — Documentación oficial de Kotlin
*   [Herramienta de Migración Asistida por IA](https://github.com/Kotlin/kmp-cocoapods-to-spm-migration/blob/master/SKILL.md) — Skill de JetBrains para migración automatizada
*   [Exportando Módulos KMP como Swift Packages para iOS](/es/blog/kmp_spm_export) — Distribuye tu módulo KMP como un Swift package
*   [Importando Swift Packages en KMP](/es/blog/kmp_spm_import) — Usa SDKs de iOS directamente desde código Kotlin compartido
