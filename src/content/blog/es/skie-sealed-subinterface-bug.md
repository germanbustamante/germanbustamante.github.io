---
title: "La Sub-Interfaz Sellada Que Rompió el Deep Linking en Silencio"
description: "Un case de un enum de Swift quedó muerto sin ningún error de compilación. Cómo el mapeo sealed-a-enum de SKIE lo provocó, y el arreglo de una sola propiedad que mantiene la garantía intacta."
pubDate: 2026-09-13
hero: "~/assets/projects/fuelio_ios_detail.png"
heroAlt: "Pantalla de detalle de una gasolinera en Fuelio para iOS, a la que se llega tocando una estación en la lista"
tags: ["Kotlin Multiplatform", "SKIE", "Swift", "iOS", "Navegación"]
language: "es"
project: "fuelio"
---

# La Sub-Interfaz Sellada Que Rompió el Deep Linking en Silencio

Estaba añadiendo deep linking a [Fuelio](https://github.com/germanbustamante/Fuelio-KMP), mi app
de comparación de precios de combustible en Kotlin Multiplatform. Un enlace del tipo
`fuelio://station/{id}/detail` debía dejar al usuario directamente en la pantalla de detalle —
pero el `back` desde ahí tiene que llevarlo a la lista, no cerrar la app. Así que cada pantalla
necesita una noción de su padre, usada para reconstruir un back stack sintético antes de mostrar
el detalle.

`Destination` en Fuelio es una `sealed interface` exportada desde `:core:presentation` a iOS
mediante [SKIE](https://skie.touchlab.co), que la convierte en un enum de Swift exhaustivo
(`onEnum(of: destination)`). Ese es exactamente el motivo de usar SKIE aquí: añades una pantalla
en Kotlin, te olvidas de manejarla en Swift, y el compilador te para — nada de un `default:`
silencioso tragándose un destino nuevo.

## La modelización obvia

La forma natural de expresar "esta pantalla se puede enlazar por deep link" es una sub-interfaz
marcadora:

```kotlin
sealed interface Destination {
    data object GasStations : Destination
    data class GasStationDetails(val gasStationId: String) : Destination
    // ...
}

sealed interface DeepLinkDestination : Destination

// GasStationDetails implementa ambas
```

Type-safe, se lee bien, y es justo el tipo de cosa que aprobarías en una revisión de código
Kotlin sin pensarlo dos veces.

## El síntoma

Una vez cableado, abrir un deep link a la pantalla de detalle de una estación funcionaba — pero el
botón `back` a veces se comportaba como si la app no supiera de dónde venía. Peor: un `switch
onEnum(of: destination)` en el router que matcheaba explícitamente `.gasStationDetails` tenía una
rama que nunca se ejecutaba, y no había ningún aviso del compilador al respecto. En un lenguaje
cuya promesa entera para mí era "el compilador te lo pilla", ese es justo el fallo que estaba
intentando evitar desde el principio.

## Por qué el compilador no lo vio

La regla de SKIE es: cada subtipo directo de una interfaz `sealed` exportada se convierte en un
`case` del enum de Swift generado. Yo lo había leído como "cada subtipo *concreto*" — pero es cada
subtipo, sub-interfaces incluidas. `DeepLinkDestination` es en sí misma un subtipo directo de
`Destination`, así que el enum generado creció con un tercer case junto a las dos pantallas
reales:

```swift
enum Destination {
    case gasStations
    case gasStationDetails(GasStationDetails)
    case deepLinkDestination(DeepLinkDestination) // ← no es una pantalla, es un marcador
}
```

Y como `GasStationDetails` implementa *ambas* `Destination` y `DeepLinkDestination`, el mapeo
`onEnum(of:)` de SKIE la matcheaba contra `.deepLinkDestination` antes de llegar nunca a
`.gasStationDetails` — el case concreto se convirtió en código muerto que Swift jamás alcanzaría
para ese valor, en silencio, sin ningún aviso.

## El arreglo: expresarlo como datos, no como tipo

`DeepLinkDestination` nunca necesitó ser un *tipo* que SKIE pudiera ver — necesitaba responder una
pregunta: "¿cuál es el padre de este destino en el back stack sintético?" Eso son datos, y los
datos no tocan para nada la jerarquía sellada exportada:

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

Una extension property con un `when` sin rama `else` — así que añadir una sexta pantalla sin
actualizar `parent` sigue siendo un error de compilación, exactamente la garantía que quería de la
sub-interfaz en primer lugar. La lista de subtipos de `Destination`, y por tanto el enum que SKIE
genera a partir de ella, no cambia nunca.

## La regla que dejé escrita

Lo dejé escrito en el propio `Destination.kt` y en las notas de arquitectura del proyecto, porque
es un fallo fácil de reintroducir en cuanto alguien vuelva a recurrir a "simplemente añado una
interfaz marcadora":

> Nunca expreses una propiedad transversal (p. ej. "¿este destino se puede enlazar?") como una
> sub-interfaz sellada sobre un tipo sellado exportado. Usa en su lugar una extension property o
> función con un `when` exhaustivo — misma garantía en tiempo de compilación, sin efecto sobre el
> enum exportado.

## Conclusiones

- "El compilador te lo pilla" solo es tan fuerte como tu modelo de *qué* está comprobando el
  compilador. Yo acerté en que SKIE mapea cada subtipo — me equivoqué en cuáles subtipos contaban.
- Un case muerto y silencioso en código de interop generado es peor que un crash: se publica. La
  única forma en que lo detecté fue ejecutando el deep link de verdad en el dispositivo, no leyendo
  la cabecera generada.
- Cuando una preocupación transversal te tiente hacia un tipo marcador dentro de una jerarquía
  sellada que cruza una frontera de lenguaje, pregúntate qué costaría modelarlo como una función de
  extensión en su lugar. Aquí no costó nada — y eliminó de raíz toda una clase de bugs de
  sombreado de enum.
