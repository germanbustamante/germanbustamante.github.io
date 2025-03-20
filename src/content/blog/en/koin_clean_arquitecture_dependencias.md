---
title: Dependency Management with Clean Architecture in Koin
description: Exploring the challenges and solutions for managing dependencies in Android projects using Koin as a dependency injector.
pubDate: 2025-02-14
hero: "~/assets/heros/koin_and_kotlin.png"
heroAlt: "Koin with kotlin logo"
tags: [ "Kotlin", "Android", "Koin", "Clean Architecture", "Kotlin Multiplatform" ]
language: "en"
---

Clean Architecture in Android promotes the separation of responsibilities into layers, such as `:data`, `:domain`, and
`:presentation`, to achieve modular and maintainable code. Each layer focuses on specific concerns, improving code
readability and maintainability.

## 📘 Introduction

I have worked on several projects and observed different implementations of this pattern. Here I explain how to divide
these layers for better context.

## Two Approaches for Dependency Implementation 🔧

### 🏢 Flat Style

The "**Flat Style**" allows `:presentation` to depend on `:domain`, exposing all public classes from `:data` to
`:domain`. This can make it difficult to test business logic and goes against the Dependency Inversion Principle.

### 🧩 Domain-Centric Approach

This approach ensures that `:domain` does not directly know `:data`, using dependency injections through interfaces or
abstract classes.

**Benefits:**

1. **Decoupling:** Each layer only knows the abstractions of the lower layer.
2. **Testability:** Facilitates independent testing.
3. **Focus on Domain Layer:** Business logic remains agnostic to specific data sources.
4. **Flexibility in Data Sources:** Allows changes without affecting `:domain`.

![Architecture](src/assets/posts/flat_and_domain_centric_arquitechture.webp)

## 🛠️ Implementation in Koin

Koin is a lightweight framework for dependency injection. It is initialized with `startKoin`, using Koin modules to
instantiate *singletons* or *factories*. A **Bridge Module** allows Koin to reference classes from the **Data** module
without direct visibility.

## 🌉 Bridge Module Solution

The `:app` module does not directly access `:domain` or `:data`, but uses Koin modules in `:bridge`, keeping the
`:domain` layer isolated and respecting the principles of Clean Architecture.

![Bridge Module Architecture](src/assets/posts/arquitechture_bridge_module.webp)

```kotlin
class MyApplication : Application() {
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

#### Gradle Configuration

**Bridge Module** in `build.gradle`:

```gradle
dependencies {
    implementation "io.insert-koin:koin-androidx-compose:${libVersions.koin_version}"
    implementation(project(":domain"))
    implementation(project(":data:repository"))
    implementation(project(":data:remote"))
}
```

For more information, check
out [this article](https://medium.com/@StefanoBozzoni/clean-code-multi-module-architecture-with-koin-9a40a96bc58b).