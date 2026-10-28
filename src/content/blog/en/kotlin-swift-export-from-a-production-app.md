---
title: "Kotlin's Swift Export, Seen from an App in Production"
description: "Swift export is in Alpha, it gained sealed classes in 2.4.20, and JetBrains is dropping Swift editing from its KMP plugin. What that means for Fuelvo, which ships on SKIE and KMP-NativeCoroutines."
pubDate: 2026-10-28
hero: "~/assets/projects/fuelvo_ios_detail.png"
heroAlt: "Fuelvo's station detail screen on iOS, a SwiftUI screen whose state comes from a shared Kotlin ViewModel"
tags: ["Kotlin Multiplatform", "Swift", "iOS", "SKIE", "Swift export"]
language: "en"
project: "fuelvo"
---

# Kotlin's Swift Export, Seen from an App in Production

There's been a lot of news on the Kotlin and Swift side of Kotlin Multiplatform since the summer.
Most write-ups cover it from a sample project. This one covers it from
[Fuelvo](https://fuelvo.app), a KMP app with a native SwiftUI interface that's live on the App
Store, and asks a practical question: can I drop the interop libraries the app depends on today?

## The news, in order

- **Kotlin 2.4.0 (July 2026) promoted Swift export to Alpha.** Swift export generates Swift
  directly from Kotlin, without going through Objective-C headers. In this release, `suspend`
  functions become Swift `async` functions, and `kotlinx.coroutines` flows can be consumed as an
  `AsyncSequence` ([What's new in 2.4.0](https://kotlinlang.org/docs/whatsnew24.html)).
- **Kotlin 2.4.20 (September 2026) added sealed classes.** A sealed hierarchy gets a
  `sealedType()` method that returns a Swift enum, so a `switch` over it is exhaustive. The release
  also added cross-language inheritance (Swift subclassing a Kotlin base class to implement a
  Kotlin interface) and a generated `Package.swift` for XCFrameworks that use SwiftPM packages
  ([What's new in 2.4.20](https://kotlinlang.org/docs/whatsnew2420.html)).
- **In October 2026 JetBrains announced it's removing Swift language support from the KMP
  plugin**, starting with IntelliJ IDEA 2026.3 and Android Studio Rabbit 2 (2026.2.2): no more
  Swift highlighting, completion or cross-language navigation in those IDEs. Swift export, running
  and debugging the iOS app, and importing SwiftPM packages aren't affected. The stated reason is
  that most iOS developers on KMP projects already write Swift in Xcode
  ([JetBrains blog](https://blog.jetbrains.com/kotlin/2026/10/discontinuing-swift-language-ide-support-in-the-kotlin-multiplatform-plugin/)).

The IDE change has no effect on Fuelvo: Swift has always been written in Xcode there, and Kotlin
in Android Studio. Swift export is the one worth looking at closely.

## What Fuelvo uses today, and why

The iOS app consumes the Kotlin `:core:presentation` module (ViewModels, UI state, navigation) as a
framework built by the classic Objective-C exporter. That exporter loses exactly what SwiftUI needs
most, and three libraries make up for it. The project's ADR on this has a table like this one:

| What the Objective-C exporter loses | Covered by |
|---|---|
| `StateFlow<UIState>` arrives as an untyped `StateFlow` | KMP-NativeCoroutines (`@NativeCoroutinesState`) |
| `suspend` becomes a callback whose cancellation never reaches the coroutine | KMP-NativeCoroutines |
| `sealed` becomes a protocol, with no exhaustive `switch` | SKIE (`onEnum(of:)`) |
| Kotlin `enum` becomes an opaque class | SKIE |
| No ViewModel lifetime on iOS (`viewModelScope` is never cancelled) | KMP-ObservableViewModel (`@StateViewModel`) |

It works well. Twelve ViewModel files annotate their state, thirteen SwiftUI views hold a
ViewModel with `@StateViewModel`, and every sealed type is mapped to Swift in a single file, where
a new variant in Kotlin becomes a compile error rather than a silent `default`.

It has a cost, though, and it's the version lock. **All three libraries are pinned to builds made
for Kotlin 2.4.0.** Updating Kotlin means waiting until all three have published a build for the
new version and moving them together. Swift export removes that dependency, because it's part of
the compiler.

## Line by line: what Swift export would cover

Against the official
[Swift export documentation](https://kotlinlang.org/docs/native-swift-export.html):

- **Sealed types and enums: covered.** Since 2.4.20, `sealedType()` does what SKIE's
  `onEnum(of:)` does today. Kotlin packages also become nested Swift enums, so two types with the
  same name in different packages no longer collide. Today, Fuelvo's two `ContentState` types reach
  Swift as `ContentState` and `ContentState_`, and that second name is kept out of the views.
- **`suspend` → `async`: covered.** Whether a Swift `Task`'s cancellation reaches the coroutine is
  something the documentation doesn't say. I'd have to test it before relying on it, because
  that's one of the reasons KMP-NativeCoroutines is in the project.
- **Flows: partly covered.** A flow can be consumed as an `AsyncSequence`, but the documentation
  doesn't mention `StateFlow` or SwiftUI observation. Today `@NativeCoroutinesState` gives each
  ViewModel a typed `state` property that SwiftUI redraws on its own; with Swift export, that
  observation would have to be written by hand.
- **ViewModels: not covered, and this is the blocker.** The documentation says Swift export
  supports "only final classes that directly inherit from `Any`". Fuelvo's ViewModels are final,
  but they inherit from KMP-ObservableViewModel's `ViewModel`. 2.4.20's cross-language inheritance
  covers a different case: a Swift class subclassing an open Kotlin base.
- **ViewModel lifetime: not addressed.** Swift export generates Swift APIs; it doesn't decide who
  cancels `viewModelScope` when a screen closes. That's what `@StateViewModel` does, and whether
  KMP-ObservableViewModel can work on top of Swift export is the first thing I'd check.
- **Project integration: compatible.** Swift export only works with direct integration, which is
  how Fuelvo already builds its framework: an Xcode build phase that calls Gradle. The migration
  would replace `embedAndSignAppleFrameworkForXcode` with `embedSwiftExportForXcode`.

## The decision, for now

Fuelvo stays on the current stack in production. Swift export is in Alpha, the documentation
expects breaking changes, and today it can't export the classes the whole iOS interface depends on.
That's not a criticism: it's the order in which JetBrains is shipping features, and each release
covers more.

What I'm doing in the meantime:

- **Keep the interop in a few places.** Sealed mappings live in one file, and the hand-written
  interop is one Koin factory. A future migration would touch those few places, not every screen.
- **Treat the Kotlin version as a group decision.** Kotlin and the three libraries move together
  or not at all, and the project's guidance says so explicitly, so nobody updates one of them by
  accident.
- **Run a cheap experiment when the time comes.** A branch that switches the build phase to
  `embedSwiftExportForXcode` and lets the compiler list what doesn't export is a one-afternoon job,
  and a better guide than any changelog. I'll do it once Swift export supports classes with a
  superclass, or reaches Beta.

The direction is clear: Kotlin's Swift interop is moving into the compiler, and the JetBrains IDEs
are focusing on Kotlin while Swift stays in Xcode. For an app in production, getting ready means
keeping the interop in a few places and avoiding new dependencies on the Objective-C exporter's
quirks, rather than migrating early.
