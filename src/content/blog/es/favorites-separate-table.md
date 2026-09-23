---
title: "Por Qué los Favoritos No Pueden Ser una Columna en Gasolineras"
description: "Una caché offline-first que se reemplaza entera en cada refresh borra en silencio cualquier cosa que guardes junto a ella. El arreglo, y el trade-off que te obliga a mostrar."
pubDate: 2026-09-13
hero: "~/assets/projects/fuelio_android_favorites.png"
heroAlt: "Pantalla de favoritos de Fuelio en Android, mostrando una estación marcada con su insignia de precio más barato"
tags: ["Room", "Offline-first", "Android", "Kotlin Multiplatform", "SQL"]
language: "es"
project: "fuelio"
---

# Por Qué los Favoritos No Pueden Ser una Columna en Gasolineras

[Fuelio](https://github.com/germanbustamante/Fuelio-KMP) cachea gasolineras en Room para que la
lista siga funcionando offline y repinte al instante desde disco antes de que la llamada de red
siquiera responda. La forma obvia de añadir un flag de "favorito" parecía trivial: añadir
`isFavorite: Boolean` a `GasStationEntity`, alternarlo al tocar, listo en una tarde.

No lo publiqué así, y el motivo está por completo en cómo se refresca la propia caché.

## El patrón de escritura que hace insegura a una columna

`GasStationRepositoryImpl.getGasStationsByLocation` es stale-while-revalidate: emite lo que haya
en caché para esa provincia de inmediato, y luego pide a la red la lista actual y **reemplaza** la
caché — no la fusiona, la reemplaza:

```kotlin
@Transaction
suspend fun replaceGasStationsByProvince(provinceId: String, gasStations: List<GasStationEntity>) {
    deleteGasStationsByProvince(provinceId)
    insertGasStations(gasStations)
}
```

Es deliberado: las estaciones que cerraron o que el feed de origen dejó de listar no deberían
quedarse para siempre en la caché. Pero significa que cada fila de esa provincia se destruye y
reconstruye en cada refresh exitoso — incluido cualquier booleano que le hubiera atornillado
encima. Marcas una estación como favorita, haces pull-to-refresh unos minutos después, y la
estrella desaparece en silencio. No hay crash, no hay error — solo una estación guardada por el
usuario que olvida en silencio que estaba guardada, con un calendario atado al timing de red del
que el usuario no tiene ninguna visibilidad.

## El arreglo: una tabla que el refresh nunca toca

Los favoritos viven en su propia tabla, indexada solo por el ID de la estación:

```kotlin
@Entity(tableName = "favorite_stations")
data class FavoriteStationEntity(@PrimaryKey val gasStationId: String, val addedAt: Long)
```

Leerlos de vuelta es un simple join contra lo que haya cacheado ahora mismo:

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

`replaceGasStationsByProvince` puede borrar y reinsertar filas de `GasStationEntity` tantas veces
como quiera — `favorite_stations` nunca se toca, así que el favorito sobrevive a cada refresh, cada
cambio de provincia, cada reinicio de la app.

## El trade-off que el join te obliga a admitir

Un `INNER JOIN` solo devuelve filas que existen en ambos lados. Un favorito cuya provincia todavía
no se ha cargado — o cuya estación de verdad ha desaparecido del feed de origen — simplemente no
aparecerá. Ese es el comportamiento correcto, pero es un hueco real entre "tienes 5 favoritos" y
"puedes ver ahora mismo 5 favoritos", y el error fácil aquí es dejar que el join oculte esa
diferencia en silencio.

En vez de eso, convertí el hueco en un valor de primera clase en lugar de un desajuste de conteo
silencioso:

```kotlin
data class FavoriteStationsResult(val stations: List<GasStationBO>, val totalFavoriteCount: Int) {
    val unresolvedCount: Int get() = (totalFavoriteCount - stations.size).coerceAtLeast(0)
}
```

La pantalla de favoritos muestra `unresolvedCount` como un banner en vez de simplemente renderizar
una lista más corta y confiar en que nadie note que faltan tres estaciones que marcó el mes
pasado. Es el mismo instinto que dio forma al resto del manejo de errores de este repositorio:
`GasStationsResult` lleva un flag explícito `isFromCache` en vez de dejar que quien lo consume lo
adivine, y un refresh en segundo plano fallido va a un banner de datos obsoletos en vez de vaciar
una pantalla que ya tiene contenido. Una vez decides que el límite de la caché es algo que hay que
comunicarle a la UI en vez de ocultárselo, el hueco de favoritos es solo una instancia más de la
misma regla, no un caso especial.

## Conclusiones

- El instinto de "simplemente añado una columna" solo es seguro si conoces el ciclo de vida
  completo de la tabla a la que se la añades. El `DELETE`-luego-`INSERT` de
  `replaceGasStationsByProvince` estaba documentado tres capas más allá de donde estaba a punto de
  cometer el error — solo lo detecté leyendo el repositorio antes de tocar la entidad.
- Separar un dato de estado del usuario de un dato de caché espejo del servidor no es
  sobre-ingeniería aquí — es la única forma de que cada uno tenga su propio ciclo de vida correcto:
  la caché se reemplaza entera, los favoritos sobreviven a todo eso.
- Un join que legítimamente puede devolver menos filas de las esperadas es una decisión de UX
  esperando a tomarse, no solo un resultado de consulta. Modelar `unresolvedCount` de forma
  explícita convirtió un hueco silencioso en algo que de verdad se le comunica al usuario.
