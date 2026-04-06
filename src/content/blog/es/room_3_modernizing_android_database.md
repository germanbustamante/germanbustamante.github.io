---
title: "Room 3.0: Una Nueva Era para Bases de Datos en Android"
description: "Room 3.0 elimina SupportSQLite, abraza un diseño coroutines-first y se vuelve totalmente multiplataforma. Qué cambia, por qué importa y cómo empezar a migrar."
pubDate: 2026-03-29
hero: "~/assets/heros/room_3_modernizing_android_database.png"
heroAlt: "Arquitectura de Room 3.0 con targets de Kotlin Multiplatform"
tags: ["Android", "Room", "Kotlin", "KMP", "Base de Datos", "Jetpack"]
language: "es"
---

# Room 3.0: Una Nueva Era para Bases de Datos en Android

> Este post se basa en las fuentes oficiales:
>
> * [Room 3.0 - Modernizing the Room](https://android-developers.googleblog.com/2026/03/room-30-modernizing-room.html) — Android Developers Blog
> * [Room 3.0 Release Notes](https://developer.android.com/jetpack/androidx/releases/room3) — Android Developers
>
> Todo el crédito al equipo de Android en Google. Recomiendo leer ambas para el panorama técnico completo.

## 🧠 Esto No Es una Actualización Incremental

Seamos directos: Room 3.0 no es Room 2.9. Es un replanteamiento desde cero de lo que Room es y a qué plataformas apunta. Los cambios son tan significativos que Google le dio un nuevo grupo Maven (`androidx.room3`) y un nuevo namespace de paquete — una señal clara de que esto está diseñado para coexistir con Room 2.x en lugar de reemplazarlo silenciosamente.

Las features titulares — soporte KMP para JS/WASM, APIs coroutines-first, generación de código solo Kotlin — son emocionantes. Pero lo que me parece más interesante es lo que Google eligió *eliminar*. Room 3.0 quita SupportSQLite, quita KAPT, quita la generación de código Java y quita las funciones DAO bloqueantes. Cada eliminación es una apuesta sobre hacia dónde va el desarrollo Android: Kotlin en todas partes, coroutines en todas partes, multiplataforma en todas partes.

Para equipos que han ido modernizando gradualmente su stack Android, Room 3.0 valida cada decisión que habéis tomado. Para equipos todavía en Java o KAPT — este es el deadline.

## 🔄 Qué Cambió: Los Cuatro Pilares

### 1. SupportSQLite Desaparece

Este es el breaking change más impactante. SupportSQLite era la capa de abstracción de Room sobre las APIs SQLite de Android. Era específica de Android por diseño, lo que hacía imposible ejecutar Room en iOS, desktop o la web.

Room 3.0 lo reemplaza por completo con las APIs de driver `androidx.sqlite` — una abstracción limpia y agnóstica de plataforma que habilita el soporte multiplataforma.

**Antes (Room 2.x):**
```kotlin
roomDatabase.runInTransaction {
    // transacción bloqueante
}

roomDatabase.query("SELECT * FROM Song").use { cursor ->
    while (cursor.moveToNext()) {
        // leer del cursor
    }
}
```

**Después (Room 3.0):**
```kotlin
roomDatabase.withWriteTransaction {
    // transacción suspend
}

roomDatabase.useReaderConnection { connection ->
    connection.usePrepared("SELECT * FROM Song") { stmt ->
        while (stmt.step()) {
            val title = stmt.getText(0)
        }
    }
}
```

Las nuevas APIs son más explícitas e inherentemente asíncronas. El modelo mental cambia de "tengo un handle de base de datos" a "tomo prestada una conexión para una operación específica." Si has usado JDBC u otros sistemas basados en pool de conexiones, esto te resultará familiar.

### 2. Solo Kotlin, Solo KSP

Room 3.0 genera exclusivamente código Kotlin y requiere KSP (Kotlin Symbol Processing). KAPT y el procesamiento de anotaciones Java ya no están soportados.

Esto no es solo una elección filosófica — tiene beneficios prácticos:

*   **Velocidad de build** — KSP es significativamente más rápido que KAPT porque evita el paso de generación de stubs Java.
*   **Mejor soporte de Kotlin** — El código generado puede usar features de Kotlin directamente (sealed classes, inline functions, etc.) en lugar de estar limitado por las restricciones del lenguaje Java.
*   **Codebase más simple** — Un solo camino de generación de código en vez de dos significa menos bugs y desarrollo más rápido de features por parte del equipo de Room.

Si tu proyecto todavía usa KAPT para Room, empieza la migración a KSP ahora con Room 2.x — es un prerrequisito para 3.0.

### 3. Coroutines Son Obligatorias

Cada función DAO en Room 3.0 debe ser una función `suspend` a menos que devuelva un tipo reactivo como `Flow`. Las funciones DAO bloqueantes desaparecen.

```kotlin
@Dao
interface SongDao {
    @Query("SELECT * FROM Song")
    suspend fun getAllSongs(): List<Song>  // debe ser suspend

    @Query("SELECT * FROM Song")
    fun observeSongs(): Flow<List<Song>>   // Flow está bien (inherentemente async)

    @Insert
    suspend fun insertSong(song: Song)     // debe ser suspend
}
```

Esto no es arbitrario — es necesario para el soporte web. JavaScript no tiene concepto de hilos bloqueantes, así que toda la superficie de API tenía que volverse asíncrona. Pero incluso para proyectos solo-Android, es un buen cambio: elimina toda una clase de bugs de "accidentalmente llamado en el hilo principal."

Las APIs a nivel de Room siguen el mismo patrón. `InvalidationTracker` ya no usa observers — expone un `Flow`:

```kotlin
fun getArtistTours(from: Date, to: Date): Flow<Map<Artist, TourState>> {
    return db.invalidationTracker.createFlow("Artist").map { _ ->
        val artists = artistsDao.getAllArtists()
        val tours = tourService.fetchStates(artists.map { it.id })
        associateTours(artists, tours, from, to)
    }
}
```

### 4. Soporte para Plataforma Web (JS + WASM)

Room ahora corre en el navegador. El `WebWorkerSQLiteDriver` ejecuta operaciones de base de datos en un Web Worker y persiste los datos usando el Origin Private File System (OPFS).

```kotlin
fun createDatabase(): MusicDatabase {
    return Room.databaseBuilder<MusicDatabase>("music.db")
        .setDriver(WebWorkerSQLiteDriver(createWorker()))
        .build()
}
```

Esto es fascinante desde una perspectiva de arquitectura. Una única definición de base de datos Room, con sus entidades, DAOs y migraciones, puede ahora apuntar a Android, iOS, JVM desktop, JavaScript y WebAssembly. El código Kotlin es idéntico — solo el driver difiere por plataforma.

## 📦 La Nueva Estructura de Paquetes

Room 3.0 vive bajo `androidx.room3`:

```kotlin
dependencies {
    val roomVersion = "3.0.0-alpha02"
    implementation("androidx.room3:room3-runtime:$roomVersion")
    ksp("androidx.room3:room3-compiler:$roomVersion")

    // Opcional - convertidores de tipo de retorno
    implementation("androidx.room3:room3-paging:$roomVersion")
    implementation("androidx.room3:room3-livedata:$roomVersion")
    implementation("androidx.room3:room3-rxjava3:$roomVersion")
}
```

Las rutas de import cambian de la misma forma:

```kotlin
// Antes
import androidx.room.RoomDatabase
import androidx.room.Entity

// Después
import androidx.room3.RoomDatabase
import androidx.room3.Entity
```

El namespace separado es intencional — previene conflictos con Room 2.x, lo cual es importante porque librerías como WorkManager todavía dependen de Room 2.x transitivamente.

## 🔌 Tipos de Retorno DAO Personalizados

Una de las adiciones más subestimadas: `@DaoReturnTypeConverter` te permite enseñar a Room a devolver tipos personalizados desde los DAOs sin esperar soporte oficial.

Anteriormente, Room tenía soporte hardcodeado para LiveData, Flow, tipos RxJava y PagingSource. En 3.0, incluso estas integraciones built-in usan el mismo mecanismo de converters:

```kotlin
@Dao
@DaoReturnTypeConverters(PagingSourceDaoReturnTypeConverter::class)
interface MusicDao {
    @Query("SELECT * FROM Song")
    fun getSongsPaginated(): PagingSource<Int, Song>
}
```

Puedes escribir tu propio converter para cualquier tipo wrapper. Aquí un converter `Promise` personalizado para targets web:

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

Esta extensibilidad hace a Room mucho más adaptable a diferentes patrones arquitectónicos. Si tu proyecto usa un wrapper `Result` personalizado o un `Either` de Arrow, ahora puedes enseñar a Room a devolver esos tipos directamente.

## 🆚 Room 3.0 vs SQLDelight: ¿Dónde Estamos?

El elefante en la habitación. Durante años, SQLDelight fue la única opción seria para acceso a base de datos multiplataforma en Kotlin. Ahora Room es un competidor genuino. ¿Cómo se comparan?

| | Room 3.0 | SQLDelight |
|---|---|---|
| **Enfoque** | Kotlin-first (anotaciones) | SQL-first (archivos .sq) |
| **Targets KMP** | Android, iOS, JVM, JS, WASM | Android, iOS, JVM, JS, native |
| **Curva de aprendizaje** | Menor para devs Android | Menor para devs SQL-heavy |
| **Integración Jetpack** | Nativa (Paging, LiveData, etc.) | Requiere adaptadores |
| **Migración desde Room 2.x** | Progresión natural | Reescritura completa |
| **Madurez en KMP** | Alpha (más nuevo) | Estable (años en producción) |

Mi opinión: **si ya estás en Room 2.x, migrar a 3.0 es la elección obvia**. Mantienes tus entidades, tu estructura de DAOs y tu historial de migraciones. Si estás empezando un proyecto KMP nuevo desde cero y tu equipo se siente cómodo escribiendo SQL crudo, SQLDelight sigue siendo excelente. Pero Room 3.0 ha cerrado la brecha significativamente.

## 🗺️ Estrategia de Migración

Room 2.x entra en modo mantenimiento — correcciones de bugs y actualizaciones de dependencias continuarán hasta que 3.0 se estabilice, pero no habrá features nuevas.

La ruta de migración recomendada:

1.  **Ahora:** Migrar de KAPT a KSP si aún no lo has hecho (funciona con Room 2.6+)
2.  **Ahora:** Empezar a usar las APIs de `SQLiteDriver` con Room 2.7+ para familiarizarte con los nuevos patrones
3.  **Cuando sea estable:** Actualizar coordenadas de artefactos de `androidx.room` a `androidx.room3`
4.  **Cuando sea estable:** Reemplazar `runInTransaction` → `withWriteTransaction`, `query()` → `useReaderConnection`, código basado en cursores → código basado en statements
5.  **Cuando sea estable:** Hacer todas las funciones DAO `suspend`
6.  **Cuando sea estable:** Reemplazar `InvalidationTracker.Observer` por `createFlow()`

Si tienes uso de SupportSQLite difícil de migrar inmediatamente, `room3-sqlite-wrapper` proporciona un puente:

```kotlin
// Puente temporal durante la migración
val supportDb = roomDatabase.getSupportWrapper()
```

## ⚠️ Estado Actual

Room 3.0 está en **alpha** (`3.0.0-alpha02` a 25 de marzo de 2026). Esto significa:

*   Las APIs pueden y van a cambiar
*   No recomendado para apps en producción
*   Perfecto para prototipar, evaluar y planificar tu migración
*   Soporte FTS5 acaba de añadirse en alpha02
*   Nuevos targets (tvOS, watchOS) se están añadiendo a room3-paging

No esperes a la versión estable para *empezar* a prepararte. Las migraciones de KAPT → KSP y SupportSQLite → SQLiteDriver pueden hacerse hoy mismo en Room 2.x.

## 💡 Conclusiones Clave

*   Room 3.0 es una ruptura limpia: nuevo grupo Maven (`androidx.room3`), nuevo paquete, nuevas APIs. Coexiste con Room 2.x en lugar de reemplazarlo in-place.
*   SupportSQLite se reemplaza por las APIs de driver `androidx.sqlite` agnósticas de plataforma, habilitando verdadero soporte KMP.
*   Todas las funciones DAO deben ser `suspend` o devolver tipos reactivos. Las operaciones bloqueantes desaparecen.
*   Room ahora apunta a Android, iOS, JVM desktop, JavaScript y WebAssembly desde un único codebase.
*   `@DaoReturnTypeConverter` abre la puerta a tipos de retorno DAO personalizados — LiveData, PagingSource y RxJava ahora usan este mismo mecanismo.
*   Para proyectos existentes con Room 2.x, empieza a migrar a KSP y SQLiteDriver ahora. La transición a 3.0 será mucho más suave.
*   Room 3.0 cierra la brecha con SQLDelight para KMP, pero todavía está en alpha. Planifica tu migración, pero no lo pongas en producción todavía.

## 📚 Lectura Adicional

*   [Room 3.0 - Modernizing the Room](https://android-developers.googleblog.com/2026/03/room-30-modernizing-room.html) — Android Developers Blog
*   [Room 3.0 Release Notes](https://developer.android.com/jetpack/androidx/releases/room3) — Notas de release oficiales
*   [Room 3.0: The Major KMP Revolution](https://callmeryan.medium.com/roomdb-3-0-the-end-of-the-android-first-era-60b0cdd077e9) — Análisis de Ryan W
*   [Set up Room Database for KMP](https://developer.android.com/kotlin/multiplatform/room) — Guía oficial de KMP
*   [Database Solutions for KMP: SQLDelight vs Room](https://medium.com/@muralivitt/database-solutions-for-kmp-cmp-sqldelight-vs-room-ea9a52c7bce7) — Artículo comparativo
