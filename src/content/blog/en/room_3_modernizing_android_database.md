---
title: "Room 3.0: A New Era for Android Database Development"
description: "Room 3.0 drops SupportSQLite, embraces coroutines-first design, and goes fully multiplatform. Here is what changes, why it matters, and how to start migrating."
pubDate: 2026-03-29
hero: "~/assets/heros/room_3_modernizing_android_database.png"
heroAlt: "Room 3.0 database architecture with Kotlin Multiplatform targets"
tags: ["Android", "Room", "Kotlin", "KMP", "Database", "Jetpack"]
language: "en"
---

# Room 3.0: A New Era for Android Database Development

> This post draws from the official sources:
>
> * [Room 3.0 - Modernizing the Room](https://android-developers.googleblog.com/2026/03/room-30-modernizing-room.html) — Android Developers Blog
> * [Room 3.0 Release Notes](https://developer.android.com/jetpack/androidx/releases/room3) — Android Developers
>
> Full credit to the Android team at Google. I recommend reading both for the complete technical picture.

## 🧠 This Is Not an Incremental Update

Let me be upfront: Room 3.0 is not Room 2.9. It is a ground-up rethinking of what Room is and what platforms it targets. The changes are significant enough that Google gave it a new Maven group (`androidx.room3`) and a new package namespace — a clear signal that this is meant to coexist with Room 2.x rather than silently replace it.

The headline features — KMP support for JS/WASM, coroutines-first APIs, Kotlin-only codegen — are exciting. But what I find most interesting is what Google chose to *remove*. Room 3.0 drops SupportSQLite, drops KAPT, drops Java code generation, and drops blocking DAO functions. Every removal is a bet on where Android development is going: Kotlin everywhere, coroutines everywhere, multiplatform everywhere.

For teams that have been gradually modernizing their Android stack, Room 3.0 validates every decision you have made. For teams still on Java or KAPT — this is the deadline.

## 🔄 What Changed: The Four Pillars

### 1. SupportSQLite Is Gone

This is the most impactful breaking change. SupportSQLite was Room's abstraction layer over Android's SQLite APIs. It was Android-specific by design, which made it impossible to run Room on iOS, desktop, or the web.

Room 3.0 replaces it entirely with the `androidx.sqlite` driver APIs — a clean, platform-agnostic abstraction that enables multiplatform support.

**Before (Room 2.x):**
```kotlin
roomDatabase.runInTransaction {
    // blocking transaction
}

roomDatabase.query("SELECT * FROM Song").use { cursor ->
    while (cursor.moveToNext()) {
        // read from cursor
    }
}
```

**After (Room 3.0):**
```kotlin
roomDatabase.withWriteTransaction {
    // suspend transaction
}

roomDatabase.useReaderConnection { connection ->
    connection.usePrepared("SELECT * FROM Song") { stmt ->
        while (stmt.step()) {
            val title = stmt.getText(0)
        }
    }
}
```

The new APIs are more explicit and inherently asynchronous. The mental model shifts from "I have a database handle" to "I borrow a connection for a specific operation." If you have used JDBC or other connection-pool-based systems, this will feel familiar.

### 2. Kotlin-Only, KSP-Only

Room 3.0 generates exclusively Kotlin code and requires KSP (Kotlin Symbol Processing). KAPT and Java annotation processing are no longer supported.

This is not just a philosophical choice — it has practical benefits:

*   **Build speed** — KSP is significantly faster than KAPT because it avoids the Java stub generation step.
*   **Better Kotlin support** — Generated code can use Kotlin features directly (sealed classes, inline functions, etc.) instead of being limited by Java language constraints.
*   **Simpler codebase** — One code generation path instead of two means fewer bugs and faster feature development from the Room team.

If your project still uses KAPT for Room, start the KSP migration now with Room 2.x — it is a prerequisite for 3.0.

### 3. Coroutines Are Mandatory

Every DAO function in Room 3.0 must be a `suspend` function unless it returns a reactive type like `Flow`. Blocking DAO functions are gone.

```kotlin
@Dao
interface SongDao {
    @Query("SELECT * FROM Song")
    suspend fun getAllSongs(): List<Song>  // must be suspend

    @Query("SELECT * FROM Song")
    fun observeSongs(): Flow<List<Song>>   // Flow is fine (inherently async)

    @Insert
    suspend fun insertSong(song: Song)     // must be suspend
}
```

This is not arbitrary — it is required for web platform support. JavaScript has no concept of blocking threads, so the entire API surface had to become asynchronous. But even for Android-only projects, this is a good change: it eliminates an entire class of "accidentally called on the main thread" bugs.

Room-level APIs follow the same pattern. `InvalidationTracker` no longer uses observers — it exposes a `Flow`:

```kotlin
fun getArtistTours(from: Date, to: Date): Flow<Map<Artist, TourState>> {
    return db.invalidationTracker.createFlow("Artist").map { _ ->
        val artists = artistsDao.getAllArtists()
        val tours = tourService.fetchStates(artists.map { it.id })
        associateTours(artists, tours, from, to)
    }
}
```

### 4. Web Platform Support (JS + WASM)

Room now runs in the browser. The `WebWorkerSQLiteDriver` executes database operations in a Web Worker and persists data using the Origin Private File System (OPFS).

```kotlin
fun createDatabase(): MusicDatabase {
    return Room.databaseBuilder<MusicDatabase>("music.db")
        .setDriver(WebWorkerSQLiteDriver(createWorker()))
        .build()
}
```

This is fascinating from an architecture perspective. A single Room database definition, with its entities, DAOs, and migrations, can now target Android, iOS, JVM desktop, JavaScript, and WebAssembly. The Kotlin code is identical — only the driver differs per platform.

## 📦 The New Package Structure

Room 3.0 lives under `androidx.room3`:

```kotlin
dependencies {
    val roomVersion = "3.0.0-alpha02"
    implementation("androidx.room3:room3-runtime:$roomVersion")
    ksp("androidx.room3:room3-compiler:$roomVersion")

    // Optional - return type converters
    implementation("androidx.room3:room3-paging:$roomVersion")
    implementation("androidx.room3:room3-livedata:$roomVersion")
    implementation("androidx.room3:room3-rxjava3:$roomVersion")
}
```

Import paths change accordingly:

```kotlin
// Before
import androidx.room.RoomDatabase
import androidx.room.Entity

// After
import androidx.room3.RoomDatabase
import androidx.room3.Entity
```

The separate namespace is intentional — it prevents conflicts with Room 2.x, which is important because libraries like WorkManager still depend on Room 2.x transitively.

## 🔌 Custom DAO Return Types

One of the more underrated additions: `@DaoReturnTypeConverter` lets you teach Room to return custom types from DAOs without waiting for official support.

Previously, Room had hardcoded support for LiveData, Flow, RxJava types, and PagingSource. In 3.0, even these built-in integrations use the same converter mechanism:

```kotlin
@Dao
@DaoReturnTypeConverters(PagingSourceDaoReturnTypeConverter::class)
interface MusicDao {
    @Query("SELECT * FROM Song")
    fun getSongsPaginated(): PagingSource<Int, Song>
}
```

You can write your own converter for any wrapper type. Here is a custom `Promise` converter for web targets:

```kotlin
object PromiseDaoReturnTypeConverter {
    @DaoReturnTypeConverter([OperationType.READ, OperationType.WRITE])
    fun <T> convert(
        db: RoomDatabase,
        executeAndConvert: suspend () -> T
    ): Promise<T> {
        return db.getCoroutineScope().promise { executeAndConvert() }
    }
}
```

This extensibility makes Room much more adaptable to different architectural patterns. If your project uses a custom `Result` wrapper or an Arrow `Either`, you can now teach Room to return those directly.

## 🆚 Room 3.0 vs SQLDelight: Where Do We Stand?

The elephant in the room. For years, SQLDelight was the only serious option for multiplatform database access in Kotlin. Now Room is a genuine competitor. How do they compare?

| | Room 3.0 | SQLDelight |
|---|---|---|
| **Approach** | Kotlin-first (annotations) | SQL-first (.sq files) |
| **KMP Targets** | Android, iOS, JVM, JS, WASM | Android, iOS, JVM, JS, native |
| **Learning Curve** | Lower for Android devs | Lower for SQL-heavy devs |
| **Jetpack Integration** | Native (Paging, LiveData, etc.) | Requires adapters |
| **Migration from Room 2.x** | Natural progression | Full rewrite |
| **Maturity on KMP** | Alpha (newer) | Stable (years of production use) |

My take: **if you are already on Room 2.x, migrating to 3.0 is the obvious choice**. You keep your entities, your DAO structure, and your migration history. If you are starting a new KMP project from scratch and your team is comfortable writing raw SQL, SQLDelight remains excellent. But Room 3.0 has closed the gap significantly.

## 🗺️ Migration Strategy

Room 2.x is entering maintenance mode — bug fixes and dependency updates will continue until 3.0 stabilizes, but no new features.

The recommended migration path:

1.  **Now:** Migrate from KAPT to KSP if you have not already (works with Room 2.6+)
2.  **Now:** Start using `SQLiteDriver` APIs with Room 2.7+ to get familiar with the new patterns
3.  **When stable:** Update artifact coordinates from `androidx.room` to `androidx.room3`
4.  **When stable:** Replace `runInTransaction` → `withWriteTransaction`, `query()` → `useReaderConnection`, cursor-based code → statement-based code
5.  **When stable:** Make all DAO functions `suspend`
6.  **When stable:** Replace `InvalidationTracker.Observer` with `createFlow()`

If you have SupportSQLite usage that is hard to migrate immediately, `room3-sqlite-wrapper` provides a bridge:

```kotlin
// Temporary bridge during migration
val supportDb = roomDatabase.getSupportWrapper()
```

## ⚠️ Current Status

Room 3.0 is in **alpha** (`3.0.0-alpha02` as of March 25, 2026). This means:

*   APIs can and will change
*   Not recommended for production apps
*   Perfect for prototyping, evaluating, and planning your migration
*   FTS5 support was just added in alpha02
*   New targets (tvOS, watchOS) are being added to room3-paging

Do not wait for stable to *start* preparing. The KAPT → KSP and SupportSQLite → SQLiteDriver migrations can happen today on Room 2.x.

## 💡 Key Takeaways

*   Room 3.0 is a clean break: new Maven group (`androidx.room3`), new package, new APIs. It coexists with Room 2.x rather than replacing it in-place.
*   SupportSQLite is replaced by the platform-agnostic `androidx.sqlite` driver APIs, enabling true KMP support.
*   All DAO functions must be `suspend` or return reactive types. Blocking operations are gone.
*   Room now targets Android, iOS, JVM desktop, JavaScript, and WebAssembly from a single codebase.
*   `@DaoReturnTypeConverter` opens the door for custom DAO return types — LiveData, PagingSource, and RxJava now use this same mechanism.
*   For existing Room 2.x projects, start migrating to KSP and SQLiteDriver now. The transition to 3.0 will be much smoother.
*   Room 3.0 closes the gap with SQLDelight for KMP, but it is still in alpha. Plan your migration, but do not ship it in production yet.

## 📚 Further Reading

*   [Room 3.0 - Modernizing the Room](https://android-developers.googleblog.com/2026/03/room-30-modernizing-room.html) — Android Developers Blog
*   [Room 3.0 Release Notes](https://developer.android.com/jetpack/androidx/releases/room3) — Official release notes
*   [Room 3.0: The Major KMP Revolution](https://callmeryan.medium.com/roomdb-3-0-the-end-of-the-android-first-era-60b0cdd077e9) — Ryan W's analysis
*   [Set up Room Database for KMP](https://developer.android.com/kotlin/multiplatform/room) — Official KMP guide
*   [Database Solutions for KMP: SQLDelight vs Room](https://medium.com/@muralivitt/database-solutions-for-kmp-cmp-sqldelight-vs-room-ea9a52c7bce7) — Comparison article
