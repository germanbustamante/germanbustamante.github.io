---
title: Gestión de Dependencias con Clean Architecture en Koin
description: Explorando los desafíos y soluciones para gestionar dependencias en proyectos Android usando Koin como inyector de dependencias.
pubDate: 2025-02-14
hero: "~/assets/heros/koin_and_kotlin.png"
heroAlt: "Astro logo with a dark background"
tags: ["Kotlin", "Android", "Koin", "Clean Architecture", "Kotlin Multiplatform"]
---

La Clean Architecture en Android promueve la separación de responsabilidades en capas, como `:data`, `:domain` y `:presentation`, para lograr un código modular y mantenible. Cada capa se enfoca en preocupaciones específicas, mejorando la legibilidad y mantenibilidad del código.

## 📘 Introducción 

He trabajado en varios proyectos y he observado diferentes implementaciones de este patrón. Aquí explico cómo dividir estas capas para un mejor contexto.

## Dos Enfoques para la Implementación de Dependencias 🔧

### 🏢 Estilo Plano 

El "**Estilo Plano**" permite que `:presentation` dependa de `:domain`, exponiendo todas las clases públicas de `:data` a `:domain`. Esto puede dificultar la prueba de la lógica de negocio y va en contra del Principio de Inversión de Dependencias.

### 🧩 Enfoque Centrado en el Dominio 

Este enfoque asegura que `:domain` no conozca `:data` directamente, utilizando inyecciones de dependencias a través de interfaces o clases abstractas.

**Beneficios:**

1. **Desacoplamiento:** Cada capa solo conoce las abstracciones de la capa inferior.
2. **Testabilidad:** Facilita las pruebas independientes.
3. **Enfoque en la Capa de Dominio:** La lógica de negocio se mantiene agnóstica a fuentes de datos específicas.
4. **Flexibilidad en las Fuentes de Datos:** Permite cambios sin afectar `:domain`.

![Arquitectura](src/assets/posts/flat_and_domain_centric_arquitechture.webp)

## 🛠️ Implementación en Koin 

Koin es un framework ligero para inyección de dependencias. Se inicializa con `startKoin`, utilizando módulos de Koin para instanciar *singletons* o *factories*. Un **Bridge Module** permite que Koin referencie clases del módulo **Data** sin visibilidad directa.

## 🌉 Solución del Bridge Module 

El módulo `:app` no accede directamente a `:domain` o `:data`, sino que utiliza módulos de Koin en `:bridge`, manteniendo la capa `:domain` aislada y respetando los principios de Clean Architecture.

![Arquitectura Bridge Module](src/assets/posts/arquitechture_bridge_module.webp)

```kotlin
class MyApplication: Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@MyApplication)
            KoinLogger()
            modules(viewModelModule, localModule, remoteModule, domainModule)
        }
    }
}
```

#### Configuración de Gradle

**Bridge Module** en `build.gradle`:
```gradle
dependencies {
    implementation "io.insert-koin:koin-androidx-compose:${libVersions.koin_version}"
    implementation(project(":domain"))
    implementation(project(":data:repository"))
    implementation(project(":data:remote"))
}
```

Para más información, consulta [este artículo](https://medium.com/@StefanoBozzoni/clean-code-multi-module-architecture-with-koin-9a40a96bc58b).