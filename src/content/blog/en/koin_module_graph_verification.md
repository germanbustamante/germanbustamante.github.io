---
title: "Catch Missing Koin Dependencies Before Runtime"
description: "How to use Koin's verify() API to statically check your DI graph at test time and eliminate entire classes of runtime crashes."
pubDate: 2026-06-12
hero: "~/assets/heros/koin_dependency.png"
heroAlt: "Koin and Kotlin logos"
tags: ["Android", "Koin", "DI", "Testing", "Architecture"]
language: "en"
---

# Catch Missing Koin Dependencies Before Runtime

One of the most frustrating bugs in a Koin app is the one that only appears after the user navigates to a specific screen: `NoBeanDefFoundException`. The DI graph looked fine. Tests passed. CI was green. Then a real device, a real user, a real crash.

The problem is that Koin's default wiring is **lazy**. Modules compile without error even when a dependency has no provider — the framework only fails when it tries to resolve the type at runtime. In a multi-module project that failure can be buried deep in a navigation path you don't exercise in every test run.

There is a better way.

## `verify()` — Static Graph Analysis at Test Time

Since Koin 3.3, the `koin-test` artifact ships a `verify()` extension on `Module`. It performs **static analysis** of the entire module graph: for every `get<T>()` call it finds, it checks that a provider for `T` exists somewhere in the module tree. If not, the test fails immediately — at build time, not at runtime.

```kotlin
// build.gradle.kts (app module)
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

The `extraTypes` list deserves special attention. Some dependencies — Firebase singletons in this case — are provided by a module that is only wired at runtime (the Android `Application`'s `appModule`). From `verify()`'s perspective those types are invisible, so they would cause false positives. Listing them in `extraTypes` tells the static analysis: *"trust that these will be available at runtime"*.

## What It Catches

The check validates the **whole subgraph** you pass to `includes()`:

- A use case that requests a repository interface with no registered implementation → fail.
- A repository that asks for a `CoroutineDispatcher` but only `DispatcherProvider` is registered → fail (unless declared in `extraTypes`).
- A module you forgot to include in the aggregation → fail the moment a downstream dependency tries to resolve it.

What it does **not** catch: circular dependencies (Koin resolves those lazily too) and bindings that are provided by `appModule` and not declared in `extraTypes`. The discipline of listing external types is small and pays dividends.

## Structure That Makes This Easy

The pattern works best when you have a single **composition root** — one module that `includes()` all the others. In Ringtone Manager this is `:bridgeDi`:

```
:app  →  :bridgeDi
              ├── analyticsModule
              ├── remoteModule
              ├── repositoryModule
              └── domainModule
```

Because `:app` is the only module that can see `:bridgeDi`, the test lives in `:app`'s test source set and verifies the entire injectable surface in one call. You don't need one test per module — one test covers the whole graph.

## Running It in CI

The test is a plain JUnit 5 unit test. It runs as part of `./gradlew test` and requires no emulator or device, so it fits naturally in the unit-test step of any CI workflow:

```yaml
- name: Run Unit Tests
  run: ./gradlew test
```

No extra CI step needed. A missing dependency now fails the same build that would have shipped a crash to production.

## The Rule of Thumb

Add `verify()` the moment you have more than two Koin modules. The cost is one test and three lines of `extraTypes` maintenance. The benefit is that an entire class of runtime crash becomes a compile-time error — and that is always a good trade.
