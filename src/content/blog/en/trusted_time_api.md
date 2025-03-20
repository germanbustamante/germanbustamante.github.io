---
title: Exploring the TrustedTime API, Reliable Time in Android
description: Google's TrustedTime API offers reliable timestamps for Android apps. Learn how to implement it and its benefits for accuracy and security.
pubDate: 2025-02-17
hero: "~/assets/heros/trusted_time_api.png"
heroAlt: "Trusted time API logo"
tags: ["Android", "Time", "API", "TrustedTime", "Google Play Services"]
language: "en"
---
# Introducing the TrustedTime API

Time is crucial in many apps, but what happens if the user changes their device's time? Problems! Inconsistent data, security failures...

That's why Google created the TrustedTime API, a solution that leverages its infrastructure to provide us with reliable timestamps.

## How Does It Work? ⚙️

TrustedTime synchronizes with Google's time servers, so you'll always have the most accurate time! It also calculates the device clock drift, which allows us to evaluate the precision of the timestamp.

## What Is It Used For?

This API is great for:

*   **Financial apps:** Secure and accurate transactions!
*   **Games:** No cheating with the clock!
*   **E-commerce:** Orders always in order!
*   **Content licensing:** Time restrictions without problems!
*   **IoT:** Perfect synchronization between devices!

## How to Get Started?

It's very easy to integrate TrustedTime into your Android apps:

1.  Add the dependency: `com.google.android.gms:play-services-time:16.0.1` (or higher) in your `build.gradle` file.
2.  Initialize `TrustedTimeClient`: Do it at the beginning of your app's lifecycle (for example, in the `onCreate()` method of your `Application` class).

## Code Example ⌨️

```kotlin
class MainActivity : AppCompatActivity() {

    private var trustedTimeClient: TrustedTimeClient? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        //....
        TrustedTime.createClient(this).addOnSuccessListener {
            trustedTimeClient = it
        }.addOnFailureListener {
            Log.e("MainActivity", "Failed to create TrustedTimeClient", it)
        }

        Log.i("MainActivity", "Current time in millis: ${getCurrentTimeInMillis()}")
    }

    private fun getCurrentTimeInMillis(): Long =
        trustedTimeClient?.computeCurrentUnixEpochMillis() ?: System.currentTimeMillis() //Use System.currentTimeMillis() as failsafe
}
```

## Going Into More Detail ⏱️

The `createClient()` method returns a `TrustedTimeClient` object. This object is the key to accessing TrustedTime functionalities. You can get more information about `TrustedTimeClient` and its methods [here](https://developers.google.com/android/reference/com/google/android/gms/time/TrustedTimeClient).

The methods of this class provide time information in various forms:

*   **Instant** (also available as Unix epoch time in milliseconds): a point in time closely related to UTC.

*   **TimeSignal**: for more advanced "current time" use cases. `TimeSignal` represents a time synchronization transaction with an external time server.

*   **Ticker and Ticks**: these allow tracking elapsed time without using a specific clock or timekeeping system.