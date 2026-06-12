---
title: "Enforcing Clean Architecture con Module Graph Assertions"
description: "Cómo convertir las reglas de dependencias de Clean Architecture de una convención en una restricción en tiempo de compilación usando el plugin de Gradle para aserciones del grafo de módulos."
pubDate: 2026-06-12
hero: "~/assets/heros/dependency_graph_modules.png" 
heroAlt: "Grafo de arquitectura multi-módulo de Android"
tags: ["Android", "Architecture", "Gradle", "CI", "Clean Architecture", "Multi-module"]
language: "es"
---

# Enforcing Clean Architecture con Module Graph Assertions

Clean Architecture define una regla clara: las dependencias deben apuntar hacia adentro. Las capas externas (presentación, datos) dependen de las capas internas (dominio, modelo). Las capas internas no saben nada de las externas.

En un proyecto Android multi-módulo esta regla suele ser una **convención**. La documentas. Se la dices al equipo. Y luego seis meses después alguien añade `implementation(project(":data:remote"))` en `:app` porque era la forma más rápida de acceder a una fuente de datos, el code review no lo detectó, y la arquitectura degeneró silenciosamente.

Las convenciones se deterioran. Las restricciones, no.

## El plugin `module-graph-assertion`

[`com.jraska.module.graph.assertion`](https://github.com/jraska/modules-graph-assert) construye el grafo real de dependencias Gradle de tu proyecto y evalúa un conjunto de reglas sobre él. Las reglas que no se cumplen hacen que `./gradlew assertModuleGraph` falle — y ese task se conecta a CI.

### Configuración

```toml
# gradle/libs.versions.toml
[versions]
moduleGraphAssert = "2.7.1"

[plugins]
module-graph-assert = { id = "com.jraska.module.graph.assertion", version.ref = "moduleGraphAssert" }
```

```kotlin
// build.gradle.kts raíz
plugins {
    alias(libs.plugins.module.graph.assert)
}

moduleGraphAssert {
    configurations = setOf("implementation", "api")
    restricted = arrayOf(
        ":app -X> .*:data:.*",        // la presentación debe pasar por :bridgeDi
        ".*:core:.* -X> .*:data:.*",  // el core puro no debe depender de datos
        ".*:core:.* -X> :app",        // el core no debe depender de la presentación
        ".*:core:.* -X> :bridgeDi",   // el core no debe depender de la raíz de composición
    )
}
```

El ajuste `configurations` le dice al plugin qué configuraciones Gradle trazar. Usar tanto `implementation` como `api` garantiza que se comprueban tanto las dependencias directas como las exportadas.

El operador `-X>` significa *"no debe tener un camino hacia"* — es transitivo. Si `:app` depende de `:feature:home`, y `:feature:home` depende de `:data:remote`, la regla `:app -X> .*:data:.*` igualmente falla, aunque la dependencia directa no sea a un módulo de datos.

### Ejecutarlo

```bash
./gradlew assertModuleGraph
```

Si todas las reglas se cumplen, el task es silencioso. Si se viola una regla, la salida te indica el camino exacto que la rompió:

```
Module graph assertion failed.
:app -X> .*:data:.*
  Violation found: :app -> :feature:home -> :data:remote
```

### Integración en CI

```yaml
- name: Assert Module Graph
  run: ./gradlew assertModuleGraph
```

El task es rápido — solo lee metadatos de Gradle, no compila nada. Añadirlo a CI cuesta segundos.

## Las reglas en Ringtone Manager

El grafo de módulos de Ringtone Manager tiene este aspecto:

```
:app  ──────────────────────►  :bridgeDi
  │                                │
  │                        ┌───────┼──────────────────┐
  │                        ▼       ▼                  ▼
  │                  :data:repo  :data:remote  :analytics
  │                        │       │                  │
  │                        └───────┴──────────────────┘
  │                                │
  ▼                                ▼
:core:domain  ◄────────────────────────────────────────
:core:model   ◄────────────────────────────────────────
```

Las cuatro reglas codifican cuatro invariantes:

1. `:app -X> .*:data:.*` — La presentación nunca alcanza los datos directamente. Todo el wiring pasa por `:bridgeDi`, la raíz de composición única. Esto mantiene los ViewModels desacoplados de los detalles de implementación de la capa de datos.

2. `.*:core:.* -X> .*:data:.*` — Los módulos de dominio y modelo son JVM puro. Definen interfaces; nunca las implementan. Permitirles depender de datos invertiría la dirección de la dependencia y los haría no portables.

3. `.*:core:.* -X> :app` — El dominio nunca depende de la presentación. Esta es la regla más fundamental de Clean Architecture.

4. `.*:core:.* -X> :bridgeDi` — El dominio nunca depende de la raíz de composición. `:bridgeDi` conoce todos los módulos; si `:core:domain` dependiera de `:bridgeDi`, el aislamiento se rompería por completo.

## Por qué las reglas con regex son poderosas

El patrón `.*:core:.*` hace match con cualquier módulo cuyo path contenga `:core:` — hoy eso significa `:core:domain` y `:core:model`, pero el mes que viene podría significar también `:core:network` o `:core:testing`. La regla no necesita actualizarse cuando añades módulos; cubre toda la capa por convención de nombrado.

Este es el insight clave: **nombra tus módulos por capa, y tus aserciones se convierten en reglas de capa, no en reglas por módulo**.

## Convenciones vs. Restricciones

| Enfoque | Se detecta cuando | Esfuerzo para saltárselo |
|---|---|---|
| Code review | Si el revisor lo nota | Un PR aprobado |
| Regla de lint | En la ejecución de lint | Anotación de supresión |
| Module graph assertion | En cada ejecución de CI | Romper un task obligatorio |

El enfoque de aserciones no depende de la atención del revisor ni de la disciplina del desarrollador. Es una barrera dura. La arquitectura se mantiene limpia porque no puede violarse sin un build de CI fallido.

Para esto sirven los Architecture Decision Records a nivel de documentación — y para esto sirven las module graph assertions a nivel de enforcement. Documenta el porqué, automatiza el qué.
