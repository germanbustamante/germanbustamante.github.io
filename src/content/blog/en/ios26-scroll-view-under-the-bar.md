---
title: "The Invisible Chips: an iOS 26 Bug Fixed by One Point of Padding"
description: "Fuelvo's fuel filters were laid out, tappable and invisible on most launches on iOS 26. The fix was one point of padding; finding it took measuring across dozens of clean installs."
pubDate: 2026-10-16
hero: "~/assets/projects/fuelvo_ios_list.png"
heroAlt: "Fuelvo's station list on iOS, with the row of fuel filter chips under the search field"
tags: ["iOS", "SwiftUI", "iOS 26", "Liquid Glass", "Debugging"]
language: "en"
project: "fuelvo"
---

# The Invisible Chips: an iOS 26 Bug Fixed by One Point of Padding

On the station list of [Fuelvo](https://fuelvo.app)'s iOS app, under the search field, there's a
row of chips: *Open now* and one per fuel type. It's how you switch from diesel to petrol. On
iOS 26, on most launches, that row wasn't there.

It hadn't been removed. The chips were laid out, they responded to taps, and the UI tests found
them. They just weren't drawn. I didn't find it through a crash report or a failing test, but by
looking at my own App Store screenshots: the row was blank in every screenshot of the list. Version
1.1.0 had passed App Review and was live with the bug.

## The layout

The row is a horizontal `ScrollView` inside a header that the list pins under the navigation bar
with `safeAreaInset`:

```swift
List { /* stations */ }
    .safeAreaInset(edge: .top, spacing: 0) {
        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: FuelvoSpacing.sm) { /* Open now + one chip per fuel */ }
                    .padding(.horizontal, FuelvoSpacing.md)
            }
        }
        .padding(.bottom, FuelvoSpacing.sm)
        .background(.bar)
    }
```

This is standard SwiftUI: a header that stays put while the list scrolls under it. It worked on
iOS 18 and it works on iOS 27. It failed on iOS 26.5.

## First fix: plausible, tested once, and wrong

iOS 26 introduced Liquid Glass and, with it, the *scroll edge effect*: content that scrolls under
a bar fades out. The chips' row sat right under the bar, so the obvious suspect was that the system
was fading the whole row. iOS 26 has a modifier to opt out, `scrollEdgeEffectHidden`, and wrapping
the row in it made the chips show up on the next launch. The ticket (`FUEA-123`) was closed, with
a screenshot of before and after.

Later that day, preparing version 1.1.1, I asked a different question: on how many launches does
it show up? I counted clean installs (delete the app, install it, launch it, check the row) on the
iPhone 17 simulator with iOS 26.5:

| | Launches where the chips were drawn |
|---|---|
| Without the fix | 6 of 32 |
| With `scrollEdgeEffectHidden` | 19 of 38 |

The fix had raised the rate from about one in five to about one in two. It hadn't fixed anything:
my first test had happened to land on a good launch. Another detail made the bug worse: **a row
that started blank stayed blank** for the whole session.

## Diagnosis by elimination

With a rate instead of a yes/no, each hypothesis could be tested properly: change one thing, then
run enough clean installs to see whether the rate moved.

- **The same row without a `ScrollView`**: drawn on 10 of 10 launches. So the scroll view was
  part of the problem, not the chips or the bar's material.
- **`safeAreaBar`** instead of `safeAreaInset`, **hiding or hardening the edge effect** on the
  list, **dropping the `.bar` background**, and **rebuilding the row**: none of these moved the
  rate meaningfully.
- **Moving the row out of the `safeAreaInset`** drew it every time, but broke something else:
  after switching tabs, pulling the list down no longer revealed the search field. Not acceptable.

Looking at the scroll view's frame showed what was going on. The scroll view's frame didn't start under the bar
where it appeared to be. It started **at the top of the screen**, and the chips occupied the last
44 points of a frame that extended up under the navigation bar. A scroll view that touches the
top safe area extends into it, and on iOS 26 what a scroll view holds in that region often isn't
drawn.

## The fix

```swift
ScrollView(.horizontal, showsIndicators: false) {
    HStack(spacing: FuelvoSpacing.sm) { /* … */ }
        .padding(.horizontal, FuelvoSpacing.md)
}
// Not a margin: a scroll view that touches the top safe area stretches up under the
// navigation bar, and iOS 26 does not draw what a scroll view holds there. On most
// launches the chips were laid out, tappable and invisible (`FUEA-126`).
.padding(.top, 1)
```

One point of padding keeps the scroll view off that edge, so it no longer extends under the bar.
Result: **56 of 56** launches drawn, with the layout and every behaviour unchanged, the search
field included. The `scrollEdgeEffectHidden` wrapper was removed in the same commit, since it
wasn't the cause.

The comment matters as much as the padding. Without it, a 1-point padding looks like a rounding
error, and the next cleanup removes it.

The fix shipped in iOS 1.1.1, which Apple has approved. It's been checked on the iOS 26.5 and
27.0 simulators. It hasn't been checked on a physical iPhone or on iOS 18.x, and the commit says
so.

## What I took from it

- **An intermittent bug needs a rate, not a screenshot.** One good launch proved nothing about
  `FUEA-123`. "Fixed" now means a number across many clean installs, both before and after the
  change.
- **UI tests check that elements exist, not that they're visible.** XCUITest saw the chips, could
  tap them, and the taps worked. Only a person looking at the screen, or a screenshot, could catch
  this.
- **Turn the finding into a rule.** The project's guidance now says that a scroll view must not
  touch the top safe area under a bar, and that a fix for something that only happens on some
  launches is measured over many clean installs, never judged from one.
- **Look at your store screenshots carefully.** They're the most-viewed images of your app, and
  in this case they were also the bug report.
