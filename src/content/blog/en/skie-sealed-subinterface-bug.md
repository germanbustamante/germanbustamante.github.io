---
title: "The Sealed Sub-Interface That Broke Deep Linking Silently"
description: "A Swift enum case went dead with zero compiler errors. Here's how SKIE's sealed-to-enum mapping caused it, and the one-property fix that keeps the guarantee intact."
pubDate: 2026-09-13
hero: "~/assets/projects/fuelio_ios_detail.png"
heroAlt: "Fuelio's gas station detail screen on iOS, reached by tapping a station in the list"
tags: ["Kotlin Multiplatform", "SKIE", "Swift", "iOS", "Navigation"]
language: "en"
project: "fuelio"
---

# The Sealed Sub-Interface That Broke Deep Linking Silently

I was adding deep linking to [Fuelio](https://github.com/germanbustamante/Fuelio-KMP), my
Kotlin Multiplatform gas-station app. A link like `fuelio://station/{id}/detail` should drop the
user straight onto the detail screen — but `back` from there needs to land on the list, not exit
the app. So every screen needs a notion of its parent, used to rebuild a synthetic back stack
before the detail screen is shown.

`Destination` in Fuelio is a `sealed interface` exported from `:core:presentation` to iOS via
[SKIE](https://skie.touchlab.co), which turns it into an exhaustive Swift enum
(`onEnum(of: destination)`). That's the whole point of using SKIE here: add a screen in Kotlin,
forget to handle it in Swift, and the compiler stops you — no silent `default:` case swallowing a
new destination.

## The obvious modeling choice

The natural way to express "this screen can be deep-linked to" is a marker sub-interface:

```kotlin
sealed interface Destination {
    data object GasStations : Destination
    data class GasStationDetails(val gasStationId: String) : Destination
    // ...
}

sealed interface DeepLinkDestination : Destination

// GasStationDetails implements both
```

Type-safe, reads well, and it's the kind of thing you'd approve in a Kotlin-only code review
without a second thought.

## The symptom

Once wired up, opening a deep link to a station's detail screen worked — but the `back` button
sometimes acted like the app didn't know where it came from. Worse: a `switch onEnum(of:
destination)` in the router that explicitly matched `.gasStationDetails` had a branch that never
ran, and there was no compiler warning about it. In a language whose entire pitch to me was
"the compiler catches this," that's the failure mode I was trying to avoid in the first place.

## Why the compiler didn't see it

SKIE's rule is: every direct subtype of an exported `sealed` interface becomes a `case` of the
generated Swift enum. I'd read that as "every *concrete* subtype" — but it's every subtype,
sub-interfaces included. `DeepLinkDestination` is itself a direct subtype of `Destination`, so
the generated enum grew a third case alongside the two real screens:

```swift
enum Destination {
    case gasStations
    case gasStationDetails(GasStationDetails)
    case deepLinkDestination(DeepLinkDestination) // ← not a screen, a marker
}
```

And because `GasStationDetails` implements *both* `Destination` and `DeepLinkDestination`, SKIE's
`onEnum(of:)` mapping matched it against `.deepLinkDestination` before it ever reached
`.gasStationDetails` — the concrete case became dead code Swift would never reach for that value,
silently, with no warning.

## The fix: express it as data, not as a type

`DeepLinkDestination` never needed to be a *type* SKIE could see — it needed to answer one
question: "what is this destination's parent in the synthetic back stack?" That's data, and data
doesn't touch the exported sealed hierarchy at all:

```kotlin
internal val Destination.parent: Destination?
    get() = when (this) {
        is Destination.GasStations -> null
        is Destination.GasStationDetails -> Destination.GasStations
        is Destination.Settings -> Destination.GasStations
        is Destination.Favorites -> Destination.GasStations
        is Destination.Map -> Destination.GasStations
    }

fun buildSyntheticBackStack(target: Destination): List<Destination> = buildList {
    add(target)
    var node: Destination? = target.parent
    while (node != null) {
        add(0, node)
        node = node.parent
    }
}
```

An extension property with a `when` that has no `else` branch — so adding a sixth screen without
updating `parent` is still a compile error, the exact guarantee I wanted from the sub-interface in
the first place. `Destination`'s own subtype list, and therefore the enum SKIE generates from it,
never changes.

## The rule I left behind

I wrote this into `Destination.kt` itself and into the project's architecture notes, because the
failure mode is easy to reintroduce the moment someone reaches for "just add a marker interface"
again:

> Never express a cross-cutting property (e.g. "is this destination linkable") as a sealed
> sub-interface over an exported sealed type. Use an extension property or function with an
> exhaustive `when` instead — same compile-time guarantee, no effect on the exported enum.

## Takeaways

- "The compiler will catch it" is only as strong as your model of *what* the compiler is checking.
  I was right that SKIE maps every subtype — I was wrong about which subtypes counted.
- A silent dead `switch` case in generated interop code is worse than a crash: it ships. The only
  way I caught this was by actually exercising the deep link on-device, not by reading the
  generated header.
- When a cross-cutting concern tempts you toward a marker type in a sealed hierarchy that crosses
  a language boundary, ask what it would cost to model it as an extension function instead. Here,
  it cost nothing — and removed a whole class of enum-shadowing bugs from ever recurring.
