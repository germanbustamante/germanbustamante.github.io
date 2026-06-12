---
title: "Detecta dependencias Koin que faltan antes de llegar a producción"
description: "Cómo usar la API verify() de Koin para analizar estáticamente tu grafo de DI en tiempo de test y eliminar clases enteras de crashes en runtime."
pubDate: 2026-06-12
hero: "~/assets/heros/koin_dependency.png"
heroAlt: "Logos de Koin y Kotlin"
tags: ["Android", "Koin", "DI", "Testing", "Architecture"]
language: "es"
---

# Detecta dependencias Koin que faltan antes de llegar a producción

Uno de los bugs más frustrantes en una app con Koin es el que solo aparece cuando el usuario navega a una pantalla concreta: `NoBeanDefFoundException`. El grafo de DI parecía correcto. Los tests pasaban. La CI estaba verde. Luego un dispositivo real, un usuario real, un crash real.

El problema es que el wiring por defecto de Koin es **lazy**. Los módulos compilan sin error aunque una dependencia no tenga proveedor — el framework solo falla cuando intenta resolver el tipo en runtime. En un proyecto multi-módulo ese fallo puede estar enterrado en un flujo de navegación que no ejercitas en cada ejecución de tests.

Hay una forma mejor.

## `verify()` — Análisis estático del grafo en tiempo de test

Desde Koin 3.3, el artefacto `koin-test` incluye una extensión `verify()` sobre `Module`. Realiza **análisis estático** de todo el grafo de módulos: por cada llamada `get<T>()` que encuentra, comprueba que existe un proveedor para `T` en algún lugar del árbol de módulos. Si no, el test falla inmediatamente — en tiempo de build, no en runtime.

```kotlin
// build.gradle.kts (módulo app)
testImplementation(platform(libs.io.insert.koin.bom))
testImplementation(libs.io.insert.koin.test)
```

```kotlin
class KoinModulesCheckTest {

    @Test
    fun `all bridgeDi modules resolve without missing dependencies`() {
        module {
            includes(analyticsModule, remoteModule, repositoryModule, domainModule)
        }.verify(
            extraTypes = listOf(
                FirebaseFirestore::class,
                FirebaseAuth::class,
                FirebaseAnalytics::class,
                DispatcherProvider::class,
            )
        )
    }
}
```

La lista `extraTypes` merece atención especial. Algunas dependencias — los singletons de Firebase en este caso — son proporcionadas por un módulo que solo se conecta en runtime (el `appModule` de la `Application` de Android). Desde la perspectiva de `verify()` esos tipos son invisibles, lo que causaría falsos positivos. Listarlos en `extraTypes` le dice al análisis estático: *"confía en que estos estarán disponibles en runtime"*.

## Qué detecta

El check valida el **subgrafo completo** que pasas a `includes()`:

- Un use case que pide una interfaz de repositorio sin implementación registrada → falla.
- Un repositorio que pide un `CoroutineDispatcher` pero solo está registrado `DispatcherProvider` → falla (salvo que se declare en `extraTypes`).
- Un módulo que olvidaste incluir en la agregación → falla en el momento en que una dependencia downstream intenta resolverlo.

Lo que **no** detecta: dependencias circulares (Koin también las resuelve lazy) y bindings proporcionados por `appModule` que no estén declarados en `extraTypes`. La disciplina de listar los tipos externos es mínima y da buenos resultados.

## La estructura que facilita esto

El patrón funciona mejor cuando tienes una única **raíz de composición** — un módulo que hace `includes()` de todos los demás. En Ringtone Manager este es `:bridgeDi`:

```
:app  →  :bridgeDi
              ├── analyticsModule
              ├── remoteModule
              ├── repositoryModule
              └── domainModule
```

Como `:app` es el único módulo que puede ver `:bridgeDi`, el test vive en el source set de tests de `:app` y verifica toda la superficie injectable en una sola llamada. No necesitas un test por módulo — uno solo cubre todo el grafo.

## Ejecutarlo en CI

El test es un test unitario JUnit 5 normal. Se ejecuta como parte de `./gradlew test` y no requiere emulador ni dispositivo, por lo que encaja de forma natural en el paso de unit tests de cualquier workflow de CI:

```yaml
- name: Run Unit Tests
  run: ./gradlew test
```

No hace falta un paso de CI adicional. Una dependencia que falta ahora falla el mismo build que habría enviado un crash a producción.

## La regla general

Añade `verify()` en el momento en que tengas más de dos módulos Koin. El coste es un test y tres líneas de mantenimiento en `extraTypes`. El beneficio es que toda una clase de crashes en runtime se convierte en un error en tiempo de compilación — y eso siempre es buen negocio.
