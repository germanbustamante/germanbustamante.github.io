---
title: "Enforcing Clean Architecture with Module Graph Assertions"
description: "How to turn your Clean Architecture dependency rules from a convention into a compile-time constraint using the module graph assertion Gradle plugin."
pubDate: 2026-06-12
hero: "~/assets/heros/dependency_graph_modules.png" 
heroAlt: "Android multi-module architecture graph"
tags: ["Android", "Architecture", "Gradle", "CI", "Clean Architecture", "Multi-module"]
language: "en"
---

# Enforcing Clean Architecture with Module Graph Assertions

Clean Architecture defines a clear rule: dependencies must point inward. The outer layers (presentation, data) depend on the inner layers (domain, model). The inner layers know nothing about the outer ones.

In a multi-module Android project this rule is usually a **convention**. You document it. You tell the team. And then six months later someone adds `implementation(project(":data:remote"))` to `:app` because it was the fastest way to access a data source, the code review didn't catch it, and the architecture silently degraded.

Conventions rot. Constraints don't.

## The `module-graph-assertion` Plugin

[`com.jraska.module.graph.assertion`](https://github.com/jraska/modules-graph-assert) builds the actual Gradle dependency graph of your project and evaluates a set of rules against it. Rules that fail cause `./gradlew assertModuleGraph` to fail — and you wire that task into CI.

### Setup

```toml
# gradle/libs.versions.toml
[versions]
moduleGraphAssert = "2.7.1"

[plugins]
module-graph-assert = { id = "com.jraska.module.graph.assertion", version.ref = "moduleGraphAssert" }
```

```kotlin
// root build.gradle.kts
plugins {
    alias(libs.plugins.module.graph.assert)
}

moduleGraphAssert {
    configurations = setOf("implementation", "api")
    restricted = arrayOf(
        ":app -X> .*:data:.*",        // presentation must go through :bridgeDi
        ".*:core:.* -X> .*:data:.*",  // pure core must not depend on data
        ".*:core:.* -X> :app",        // core must not depend on presentation
        ".*:core:.* -X> :bridgeDi",   // core must not depend on the composition root
    )
}
```

The `configurations` setting tells the plugin which Gradle configurations to trace. Using both `implementation` and `api` ensures that both direct and exported dependencies are checked.

The `-X>` operator means *"must not have a path to"* — it is transitive. If `:app` depends on `:feature:home`, and `:feature:home` depends on `:data:remote`, the rule `:app -X> .*:data:.*` still fails, even though the direct dependency is not on a data module.

### Running It

```bash
./gradlew assertModuleGraph
```

If all rules pass, the task is silent. If a rule is violated, the output tells you the exact path that broke it:

```
Module graph assertion failed.
:app -X> .*:data:.*
  Violation found: :app -> :feature:home -> :data:remote
```

### CI Integration

```yaml
- name: Assert Module Graph
  run: ./gradlew assertModuleGraph
```

The task is fast — it only reads Gradle metadata, it does not compile anything. Adding it to CI costs seconds.

## The Rules in Ringtone Manager

The module graph for Ringtone Manager looks like this:

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

The four rules encode four invariants:

1. `:app -X> .*:data:.*` — Presentation never reaches data directly. All wiring goes through `:bridgeDi`, the single composition root. This keeps ViewModels decoupled from data-layer implementation details.

2. `.*:core:.* -X> .*:data:.*` — The domain and model modules are pure JVM. They define interfaces; they never implement them. Allowing them to depend on data would invert the dependency direction and make them un-portable.

3. `.*:core:.* -X> :app` — Domain never depends on presentation. This is the most fundamental Clean Architecture rule.

4. `.*:core:.* -X> :bridgeDi` — Domain never depends on the composition root. `:bridgeDi` knows about every module; if `:core:domain` were to depend on `:bridgeDi`, the isolation would be broken entirely.

## Why Regex Rules Are Powerful

The `.*:core:.*` pattern matches any module whose path contains `:core:` — today that means `:core:domain` and `:core:model`, but next month it could also mean `:core:network` or `:core:testing`. The rule does not need updating when you add modules; it covers the entire layer by convention of naming.

This is the key insight: **name your modules by layer, and your assertions become layer rules, not module-specific rules**.

## Conventions vs. Constraints

| Approach | Detected when | Effort to bypass |
|---|---|---|
| Code review | If reviewer notices | One approved PR |
| Lint rule | At lint run | Suppress annotation |
| Module graph assertion | At every CI run | Breaking a required task |

The assertion approach does not rely on reviewer attention or developer discipline. It is a hard gate. The architecture stays clean because it cannot be violated without a failing CI build.

This is what "Architecture Decision Records" are for at the documentation level — and this is what module graph assertions are for at the enforcement level. Document the why, automate the what.
