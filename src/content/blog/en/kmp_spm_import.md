---
title: "Importing Swift Packages into KMP: An Experimental Guide"
description: "Explore the new experimental SwiftPM import feature for Kotlin Multiplatform, enabling direct use of iOS SDKs like Firebase from your shared Kotlin code."
pubDate: 2026-03-29
hero: "~/assets/heros/kmp_spm_import.png"
heroAlt: "Swift Package Manager dependencies flowing into Kotlin Multiplatform"
tags: ["Kotlin", "KMP", "Swift", "SPM", "iOS", "Firebase"]
language: "en"
---

# Importing Swift Packages into KMP: An Experimental Guide

> This post is based on the official Kotlin documentation:
> [Adding Swift packages as dependencies to KMP modules](https://kotlinlang.org/docs/multiplatform/multiplatform-spm-import.html)
>
> Full credit to the JetBrains and Kotlin team. I recommend reading the original docs alongside this post.
>
> ⚠️ **This feature is experimental.** It requires a development build of Kotlin (`2.3.20-titan-222`) and is not intended for production use yet. Share feedback in the `#kmp-swift-package-manager` Slack channel.

## 🧠 Introduction: The Missing Piece

Before this feature, using an iOS-specific SDK from shared KMP code was painful. Your options were:

*   Set up CocoaPods integration and use the `cocoapods {}` Gradle block
*   Write cinterop definitions manually — powerful but tedious and brittle
*   Move the iOS-specific code to the iOS module and call it via `expect`/`actual`

None of these feel natural if you are coming from the Swift/Xcode side of the world. Swift Package Manager is how iOS developers manage dependencies, and it has been for years. The `swiftPMDependencies` DSL brings that familiarity to KMP: declare your Swift package dependencies in Gradle the same way you would in a `Package.swift`, and use the imported APIs directly in your `iosMain` Kotlin code.

This is a meaningful step toward making KMP feel native on both sides of the stack — and it changes the calculus for teams evaluating KMP adoption.

## ⚠️ Experimental Status and Limitations

Before going further, the constraints:

*   **Requires Kotlin `2.3.20-titan-222`** — a development build, not a stable release. Production projects should wait.
*   **Export not supported** — if your KMP module uses `swiftPMDependencies`, you cannot yet export it as a Swift package. This is tracked in [KT-84420](https://youtrack.jetbrains.com/issue/KT-84420).
*   **Transitive dependencies are handled automatically** — you don't need to declare them manually for tests or linking.
*   **Feedback channel:** `#kmp-swift-package-manager` on the Kotlin Slack.

With that said, if you are prototyping, exploring KMP adoption, or contributing to the ecosystem — this is genuinely exciting.

## 🔧 Setup

### 1. Configure `settings.gradle.kts`

Add the JetBrains development Maven repository so Gradle can find the experimental plugin:

```kotlin
dependencyResolutionManagement {
    repositories {
        maven("https://packages.jetbrains.team/maven/p/kt/dev")
        mavenCentral()
    }
}

pluginManagement {
    repositories {
        maven("https://packages.jetbrains.team/maven/p/kt/dev")
        mavenCentral()
        gradlePluginPortal()
    }
}
```

### 2. Pin the Kotlin version

In your version catalog (`libs.versions.toml`):

```kotlin
[versions]
kotlin = "2.3.20-titan-222"

[plugins]
kotlin-multiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
```

If you need to force the plugin version in the root `build.gradle.kts`:

```kotlin
buildscript {
    dependencies.constraints {
        "classpath"("org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.20-titan-222")
    }
}
```

### 3. IDE Plugin Setup (optional)

If your team uses the Kotlin Multiplatform IDE plugin, point it to the iOS project path:

```kotlin
kotlin {
    listOf(
        iosArm64(),
        iosSimulatorArm64(),
        iosX64(),
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "Shared"
            isStatic = false
        }
    }

    swiftPMDependencies {
        xcodeProjectPathForKmpIJPlugin.set(
            layout.projectDirectory.file("../iosApp/iosApp.xcodeproj")
        )
    }
}
```

## 📦 Adding SwiftPM Dependencies

Declare your dependencies inside the `swiftPMDependencies` block:

```kotlin
kotlin {
    iosArm64()
    iosSimulatorArm64()
    iosX64()

    swiftPMDependencies {
        swiftPackage(
            url = url("https://github.com/firebase/firebase-ios-sdk.git"),
            version = from("12.5.0"),
            products = listOf(product("FirebaseAnalytics")),
        )

        swiftPackage(
            url = url("https://github.com/apple/swift-protobuf.git"),
            version = exact("1.32.0"),
            products = listOf(),
        )
    }
}
```

### Version Specification Options

The version parameter supports several strategies — pick the one that fits your stability requirements:

```kotlin
version = from("1.0")          // 1.0 or newer (Gradle 'require')
version = exact("2.0")         // exactly 2.0 (Gradle 'strict')
version = branch("main")       // track a branch (unstable — use with care)
version = revision("e74b07...")// pin to a specific commit
```

### Clang Module Discovery

By default, the plugin automatically discovers all Clang modules in the specified products. If you need fine-grained control — for example, when the Clang module name differs from the product name — disable auto-discovery:

```kotlin
swiftPMDependencies {
    discoverClangModulesImplicitly = false

    swiftPackage(
        url = url("https://github.com/firebase/firebase-ios-sdk.git"),
        version = from("12.5.0"),
        products = listOf(
            product("FirebaseAnalytics"),
            product("FirebaseFirestore")
        ),
        importedClangModules = listOf(
            "FirebaseAnalytics",
            "FirebaseFirestoreInternal"  // note: differs from product name
        ),
    )
}
```

## 🌍 Platform Constraints

If your project targets multiple Apple platforms and a dependency only supports iOS, restrict it:

```kotlin
kotlin {
    iosArm64()
    iosSimulatorArm64()
    iosX64()
    macosArm64()

    swiftPMDependencies {
        swiftPackage(
            url = url("https://github.com/googlemaps/ios-maps-sdk.git"),
            version = exact("10.3.0"),
            products = listOf(
                product(
                    "GoogleMaps",
                    platforms = setOf(iOS())
                )
            )
        )
    }
}
```

Without the `platforms` constraint, Gradle would try to link Google Maps against macOS targets and fail.

You can also set minimum deployment targets per platform:

```kotlin
swiftPMDependencies {
    iosMinimumDeploymentTarget.set("16.0")
    macosMinimumDeploymentTarget.set("13.0")
}
```

## 📱 Using Imported APIs in Kotlin

Imported APIs are available under the namespace:

```
swiftPMImport.<gradle-group>.<module-name>.<APIName>
```

If your module's `build.gradle.kts` declares `group = "org.example"` and the module is named `shared`:

```kotlin
// shared/src/iosMain/kotlin/Analytics.kt
import swiftPMImport.org.example.shared.FIRAnalytics
import swiftPMImport.org.example.shared.FIRApp

fun initFirebase() {
    FIRApp.configure()
}

fun logEvent(name: String) {
    FIRAnalytics.logEventWithName(name, parameters: null)
}
```

The Kotlin compiler handles the Objective-C interop layer — you call the Firebase APIs as if they were regular Kotlin functions.

## 📂 Local Swift Packages

You can also import Swift packages from the local filesystem, which is useful for packages your team maintains internally or for prototyping:

```swift
// /path/to/LocalPackage/Package.swift
let package = Package(
    name: "LocalPackage",
    platforms: [.iOS("15.0")],
    products: [
        .library(name: "LocalPackage", targets: ["LocalPackage"]),
    ],
    targets: [
        .target(name: "LocalPackage")
    ]
)
```

```kotlin
// shared/build.gradle.kts
swiftPMDependencies {
    localSwiftPackage(
        directory = project.layout.projectDirectory.dir("/path/to/LocalPackage/"),
        products = listOf("LocalPackage")
    )
}
```

## ⚡ Dynamic vs Static Frameworks

If you're using `isStatic = false` (dynamic framework), you may encounter:

*   `Undefined symbols for architecture ...` — symbol not found at link time
*   `dyld: Symbol not found: ...` — symbol missing at runtime
*   `Class _Foo is implemented in both ...` — two frameworks bundle the same type

These happen because Swift packages can bundle native code that conflicts with your dynamic framework's linkage. The fix is straightforward:

```kotlin
listOf(iosArm64(), iosSimulatorArm64(), iosX64()).forEach { iosTarget ->
    iosTarget.binaries.framework {
        baseName = "Shared"
        isStatic = true  // switch to static
    }
}
```

My recommendation: start with `isStatic = true` unless you have a concrete reason for dynamic linkage. You can always revisit this later.

## 💡 Key Takeaways

*   `swiftPMDependencies` replaces CocoaPods and manual cinterop for iOS SDK dependencies in KMP — a cleaner, more native-feeling approach.
*   The feature is experimental and requires Kotlin `2.3.20-titan-222`. Do not use in production yet.
*   Imported APIs are available under the `swiftPMImport.<group>.<module>` namespace.
*   Use `platforms = setOf(iOS())` to scope dependencies to specific Apple targets.
*   You cannot currently export a KMP module as a Swift package if it uses `swiftPMDependencies` (KT-84420).
*   Prefer `isStatic = true` to avoid symbol conflicts with dynamic frameworks.

## 📚 Further Reading

*   [Adding Swift packages as dependencies to KMP modules](https://kotlinlang.org/docs/multiplatform/multiplatform-spm-import.html) — Official Kotlin documentation
*   [Exporting KMP Modules as Swift Packages for iOS](/en/blog/kmp_spm_export) — Distribute your KMP module as a Swift package
*   [Migrating KMP from CocoaPods to SPM](/en/blog/kmp_cocoapods_to_spm_migration) — Step-by-step migration guide
