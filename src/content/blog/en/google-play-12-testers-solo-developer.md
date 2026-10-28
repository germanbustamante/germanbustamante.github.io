---
title: "Google Play's 12 Testers for 14 Days, as a Solo Developer"
description: "New personal Play accounts need a two-week closed test with 12 testers before production. How it went for Fuelvo, what the test was actually good for, and how to plan a launch around it."
pubDate: 2026-10-26
hero: "~/assets/heros/fuelvo_feature_graphic.png"
heroAlt: "Fuelvo's Google Play feature graphic: the app's name and its price map"
tags: ["Android", "Google Play", "Release", "Indie development"]
language: "en"
project: "fuelvo"
---

# Google Play's 12 Testers for 14 Days, as a Solo Developer

On the App Store, [Fuelvo](https://fuelvo.app) went from upload to public in a few days: one
review and a manual release. On Google Play the same app needed a month, and most of that time
wasn't review. It was a rule that every new personal developer account has to go through.

## The rule

Since November 2023, a **personal** Play developer account created after 13 November 2023 can't
publish to production straight away. According to
[Google's help page](https://support.google.com/googleplay/android-developer/answer/14151465), it
first has to run a closed test with **at least 12 testers who have been opted in continuously for
at least 14 days**, and then apply for production access. Testers who opt in and leave before 14
days don't count, and someone who leaves and rejoins starts their 14 days again.

Organisation accounts are exempt. For a solo developer without a company, there's no way around it,
so it's better to plan for it than to resent it.

## How it went for Fuelvo

| Date (2026) | Step |
|---|---|
| 6 October | 1.0.0 uploaded to the internal and closed tracks |
| ~8 October | Closed test starts with friends and family |
| 13 October | Meanwhile, the iOS app goes live on the App Store |
| 22 October | 14 days complete; production access requested |
| 25 October | Access granted (Google says to allow about a week) |
| 28 October | Version 1.1.0 at 100 % in production, after a 10 → 50 → 100 % staged rollout |

A few decisions made the test work:

- **Recruit well above 12.** About 20 people joined. Some testers stop using the app, change
  phones or leave the test without noticing, and if the count drops below 12 the clock no longer
  counts. With 20, a few drop-outs didn't matter.
- **Use a feedback channel people already use.** The opt-in link and the instructions went out
  over WhatsApp, and that's where the feedback came in. A form nobody opens produces nothing to
  report.
- **Keep shipping during the test.** The test didn't freeze development. Version 1.1.0, with the
  reworked price map, went to the closed track halfway through, so the testers ended up testing the
  version that would reach production.
- **Keep everyone in until Google answers.** The application asks about the test that has already
  happened, but there's no reason to let the group break up before the answer arrives.

## What the test was actually good for

I started out treating it as a formality. It turned out to be the first time the Android app ran
on phones I didn't own, with real fixes from real locations, on networks I don't control.

- **Android vitals had real data**: 0 crashes and 3 ANRs across about 20 users. An ANR is the kind
  of thing an emulator rarely shows you.
- **Play pointed out something I hadn't configured.** On each upload, the Console warned that the
  bundle contained native code without debug symbols. The native libraries come from dependencies
  (SQLite's bundled driver among them), and without symbols a native crash in Play vitals shows up
  as addresses. The fix is one line in the Android Gradle Plugin, and it ships in the next update:

  ```kotlin
  android {
      buildTypes {
          getByName("release") {
              ndk { debugSymbolLevel = "SYMBOL_TABLE" }
          }
      }
  }
  ```

- **It forced a rehearsal of the full release path**: upload, track, promotion, release notes in
  each language, rollout percentages. By the time production arrived, none of it was new.

## The production access application

The form has three sections: the closed test, the app, and how ready it is for production. Among
other things, Google asks you to summarise the testers' feedback, how you collected it, and what
you changed because of it. Two things helped:

- **Answer in English and be specific.** Name the versions the testers received and what
  changed in each one; that reads better than general statements.
- **Answer honestly about the size of the test.** Friends and family is a legitimate source of
  testers for a solo developer; inventing a larger beta programme isn't.

The answer came in three days.

## Planning a launch around it

For a new personal account, the minimum time to production is:

**14 days of testing + the application review (Google says up to about 7) + the review of the
production release**, and the 14 days only start once 12 people have opted in.

That changes the plan:

- Open the closed test **as soon as there's a stable build**, not when the app is "finished". The
  clock runs while you keep building.
- If the launch is on both platforms, **start on Android first**. Fuelvo's iOS app was live on the
  App Store for two weeks before the Android app could even ask for production.
- Don't commit to a launch date or any marketing until production access is granted. Until
  then the date isn't in your hands.

The rule is clearly designed to filter out low-effort apps, and for a solo developer it costs about
a month. But it isn't wasted time if you use it as what it is: a real closed beta, run before the
public sees the app.
