---
title: "Protege el classpath de release de cambios silenciosos en dependencias"
description: "Cómo el plugin dependency-guard de Dropbox hace un snapshot de tu árbol de dependencias transitivas y convierte los cambios invisibles en fallos de CI explícitos y revisables."
pubDate: 2026-06-12
hero: "~/assets/heros/android_dependency_transitive.png"
heroAlt: "Herramientas de build de Android"
tags: ["Android", "Gradle", "Dependencies", "CI", "Security"]
language: "es"
---

# Protege el classpath de release de cambios silenciosos en dependencias

Aquí hay un escenario que ocurre más a menudo de lo que debería: subes una librería de `1.4.2` a `1.5.0`, la CI está verde, shippe — y dos semanas después notas que el APK pesa 800 KB más, o que una nueva dependencia transitiva ha empezado a incluir una librería de red que no has revisado.

Nada se rompió. Nada te avisó. El cambio fue silencioso.

Este es el problema de las dependencias transitivas. Cuando dependes de una librería, implícitamente dependes de todo de lo que esa librería depende, y de todo de lo que *esas* librerías dependen. Una actualización de versión que consideras rutinaria puede añadir, eliminar o cambiar la versión de una docena de dependencias transitivas silenciosamente. En un proyecto consciente de la seguridad o del tamaño, eso es inaceptable.

## El plugin Dependency Guard

[`dependency-guard`](https://github.com/dropbox/dependency-guard) — mantenido por Dropbox y usado por el ejemplo Now in Android de Google — resuelve esto con una idea simple: **hacer commit de un snapshot del classpath exacto** que se incluye en tu build de release, y fallar en CI si alguna vez se desvía de ese snapshot sin una actualización explícita y revisada.

### Configuración

```toml
# gradle/libs.versions.toml
[versions]
dependencyGuard = "0.5.0"

[plugins]
dependency-guard = { id = "com.dropbox.dependency-guard", version.ref = "dependencyGuard" }
```

```kotlin
// app/build.gradle.kts
plugins {
    alias(libs.plugins.dependency.guard)
}

dependencyGuard {
    configuration("releaseRuntimeClasspath")
}
```

Ejecuta `./gradlew dependencyGuardBaseline` una vez para generar el snapshot inicial. Haz commit del resultado.

### Cómo es el baseline

El plugin escribe un fichero de texto plano — una dependencia por línea, ordenadas alfabéticamente:

```
androidx.activity:activity-compose:1.12.2
androidx.activity:activity-ktx:1.12.2
androidx.activity:activity:1.12.2
androidx.annotation:annotation-experimental:1.5.1
...
com.google.firebase:firebase-analytics:22.4.0
com.google.firebase:firebase-auth:23.2.1
...
```

Sin DSL, sin JSON, sin formato binario. El diff es legible en cualquier herramienta de code review. Cuando se añade, elimina o actualiza una dependencia, el cambio aparece como un diff de una línea en el archivo baseline — y el revisor tiene que aprobarlo explícitamente.

### Enforcement en CI

```yaml
- name: Verify Dependency Guard
  run: ./gradlew dependencyGuard
```

`dependencyGuard` (sin `Baseline`) compara el classpath actual con el snapshot commiteado. Si divergen, la tarea falla con un mensaje claro listando exactamente qué cambió.

```
Dependency Guard Baseline does not match.
  + com.squareup.okhttp3:logging-interceptor:4.12.0
  - com.squareup.okhttp3:okhttp:4.10.0
  + com.squareup.okhttp3:okhttp:4.12.0
```

Actualizar es intencional: ejecuta `dependencyGuardBaseline` localmente, revisa el diff, haz commit. Es el mismo flujo que actualizar un baseline de snapshot tests — explícito, trazable y revisable.

## Por qué `releaseRuntimeClasspath`

Podrías también proteger `debugRuntimeClasspath`, pero lo importante es proteger lo que se publica. `releaseRuntimeClasspath` es el conjunto exacto de JARs incluidos en tu APK o AAB de release. Los builds de debug incluyen herramientas extra (LeakCanary, bases de datos de debug) que no son relevantes para el riesgo de supply-chain.

## Qué protege

**Bloat accidental.** Una actualización de librería incluye una nueva dependencia transitiva con gran tamaño. Sin el guard podrías no darte cuenta hasta la próxima auditoría de tamaño.

**Downgrades de versión inesperados.** Dos librerías incluyen versiones diferentes de una transitiva común. La resolución de conflictos de versiones de Gradle elige una silenciosamente. El guard hace visible esa resolución.

**Deriva en la cadena de suministro.** Una librería en la que confías empieza a incluir una nueva subdependencia de un grupo desconocido. Con el guard ese cambio requiere una revisión explícita antes de poder publicarse.

## El flujo en la práctica

La disciplina es ligera: cuando tocas `libs.versions.toml` y actualizas algo, ejecuta `dependencyGuardBaseline`, mira el diff, haz commit junto con la actualización de versión. Ese hábito de dos minutos te da un historial completo de cada cambio transitivo que alguna vez se ha publicado en tu app — gratis, en git.
