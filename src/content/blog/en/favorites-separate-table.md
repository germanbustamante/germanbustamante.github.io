---
title: "Why Favorites Can't Be a Column on the Gas Station Table"
description: "An offline-first cache that replaces itself wholesale on every refresh will silently delete anything you store alongside it. The fix, and the trade-off it forces you to surface."
pubDate: 2026-09-13
hero: "~/assets/projects/fuelio_android_favorites.png"
heroAlt: "Fuelio's favorites screen on Android, showing a starred station with its cheapest-price badge"
tags: ["Room", "Offline-first", "Android", "Kotlin Multiplatform", "SQL"]
language: "en"
project: "fuelio"
---

# Why Favorites Can't Be a Column on the Gas Station Table

[Fuelio](https://github.com/germanbustamante/Fuelio-KMP) caches gas stations in Room so the list
still works offline and repaints instantly from disk before the network call even returns. The
obvious way to add a "favorite" flag felt like nothing: add `isFavorite: Boolean` to
`GasStationEntity`, flip it on tap, done in an afternoon.

I didn't ship that, and the reason is entirely in how the cache itself gets refreshed.

## The write pattern that makes a column unsafe

`GasStationRepositoryImpl.getGasStationsByLocation` is stale-while-revalidate: it emits whatever's
cached for that province immediately, then fetches the network's current list and replaces the
cache — not merges into it, replaces it:

```kotlin
@Transaction
suspend fun replaceGasStationsByProvince(provinceId: String, gasStations: List<GasStationEntity>) {
    deleteGasStationsByProvince(provinceId)
    insertGasStations(gasStations)
}
```

That's deliberate: stations that closed or that the upstream feed stopped listing shouldn't linger
in the cache forever. But it means every row for that province is destroyed and rebuilt on every
successful refresh — including whatever boolean I'd bolted onto it. Star a station, pull to
refresh a few minutes later, and the star silently vanishes. Not a crash, not an error — just a
user's saved station quietly forgetting it was saved, on a schedule tied to network timing they
have no visibility into.

## The fix: a table that the refresh never touches

Favorites live in their own table, keyed only by the station's ID:

```kotlin
@Entity(tableName = "favorite_stations")
data class FavoriteStationEntity(@PrimaryKey val gasStationId: String, val addedAt: Long)
```

Reading them back is a plain join against whatever's currently cached:

```kotlin
@Query(
    """
    SELECT gs.* FROM GasStationEntity gs
    INNER JOIN favorite_stations f ON gs.id = f.gasStationId
    ORDER BY f.addedAt DESC
    """,
)
fun observeFavoriteStations(): Flow<List<GasStationEntity>>
```

`replaceGasStationsByProvince` can delete and reinsert `GasStationEntity` rows as often as it
wants — `favorite_stations` never gets touched, so the favorite survives every refresh, every
province switch, every app restart.

## The trade-off the join forces you to admit

An `INNER JOIN` only returns rows that exist on both sides. A favorite whose province hasn't been
fetched yet — or whose station has genuinely disappeared from the upstream feed — simply won't
appear. That's correct behavior, but it's a real gap between "you have 5 favorites" and "you can
currently see 5 favorites," and the easy mistake here is to let the join quietly hide that
difference.

I made the gap a first-class value instead of a silent count mismatch:

```kotlin
data class FavoriteStationsResult(val stations: List<GasStationBO>, val totalFavoriteCount: Int) {
    val unresolvedCount: Int get() = (totalFavoriteCount - stations.size).coerceAtLeast(0)
}
```

The favorites screen shows `unresolvedCount` as a banner instead of just rendering a shorter list
and hoping nobody notices they're missing three stations they starred last month. It's the same
instinct that shaped the rest of the repository's error handling here: `GasStationsResult` carries
an explicit `isFromCache` flag rather than making the caller guess, and a failed background
refresh routes to a stale-data banner instead of blanking a screen that already has content on it.
Once you've decided the cache boundary is something the UI should be told about rather than hidden
from, the favorites gap is just one more instance of the same rule, not a special case.

## Takeaways

- A "just add a column" instinct is only safe if you know the full lifecycle of the table you're
  adding it to. `replaceGasStationsByProvince`'s `DELETE`-then-`INSERT` was documented three layers
  away from where I was about to make the mistake — I only caught it by reading the repository
  before touching the entity.
- Separating a piece of user state from a piece of server-mirrored cache isn't over-engineering
  here — it's the only way either one gets to have its own, correct lifecycle: the cache gets
  replaced wholesale, favorites persist across all of it.
- A join that can legitimately return fewer rows than expected is a UX decision waiting to be
  made, not just a query result. Modeling `unresolvedCount` explicitly turned a silent gap into
  something the user is actually told about.
