---
title: "Un Mapa de Precios Rápido en Android e iOS"
description: "Cómo el mapa de Fuelvo pasó de una petición y vistas nuevas en cada movimiento de cámara a dibujos en caché y casi ninguna petición, en las dos plataformas, medido con Macrobenchmark."
pubDate: 2026-10-21
hero: "~/assets/projects/fuelvo_android_map.png"
heroAlt: "Mapa de precios de Fuelvo en Android, con las gasolineras como pines de precio coloreados según lo barato que es cada una en su zona"
tags: ["Android", "iOS", "Kotlin Multiplatform", "Rendimiento", "Google Maps", "MapKit"]
language: "es"
project: "fuelvo"
---

# Un Mapa de Precios Rápido en Android e iOS

El mapa es la pantalla de [Fuelvo](https://fuelvo.app) que más se juzga a primera vista. Muestra
hasta 200 gasolineras a la vez, cada una con un pin con su precio, coloreado según lo barato que
es para la zona, y agrupadas en clusters cuando se taparían entre sí. Funcionaba desde la primera
versión, pero no daba sensación de rapidez: moverlo costaba en Android, y en las dos plataformas
el mapa trabajaba más de lo que el usuario veía.

Lo arreglaron tres tickets en octubre: `FUEA-110` en cómo carga los datos, `FUEA-111` en cómo
dibuja los pines Android y `FUEA-112` en cómo lo hace iOS. Este artículo cuenta cuál era el
problema, qué esperan las herramientas de Google y Apple que hagas, qué cambié y qué pueden y qué
no pueden demostrar las mediciones.

## Cómo era el problema

Cada vez que la cámara se paraba pasaban tres cosas:

1. **Una petición.** El `MapViewModel` compartido pedía al backend las gasolineras del recuadro
   visible, escribía la respuesta en la caché local y sustituía los marcadores. Incluso tras mover
   el mapa 50 metros dentro de una zona que acababa de cargar.
2. **Dibujos nuevos en Android.** Cada pin y cada cluster era un Composable. La librería de mapas
   construía una vista por cada uno en el hilo principal y la capturaba a un bitmap. Un solo zoom
   hacia fuera y vuelta creaba entre 156 y 267 de esas vistas.
3. **Un diff en cada cambio de estado en iOS.** El `updateUIView` de MapKit se ejecuta en *cada*
   cambio de estado de la pantalla, incluidos la barra de carga, la etiqueta de frescura y la
   tarjeta de vista previa, y cada vez reconstruía y comparaba las 200 anotaciones.

El primer problema está en código Kotlin compartido, así que un solo arreglo sirve para las dos
apps. Los otros dos son de cada plataforma, y cada uno necesitó su propio arreglo.

## 1. Cargar más de lo que se ve, y volver a pedir solo cuando hace falta

La [guía de optimización de Google Maps](https://developers.google.com/maps/optimization-guide)
está escrita para la API de JavaScript, pero una regla vale para todo: añadir o quitar contenido
solo cuando el usuario deja de mover o hacer zoom. Fuelvo ya lo hacía (un debounce de 350 ms, y un
viewport nuevo cancela la petición anterior). El problema era lo que pasaba *después* de pararse
la cámara: cada parada se trataba como nueva.

El arreglo está en `MapViewModel`, en `:core:presentation`, así que Android e iOS lo recibieron
en el mismo commit:

![El área cargada es la vista más media vista a cada lado; moverse dentro de ella no hace ninguna petición](src/assets/posts/fuelvo_map_viewport_es.svg)

- La primera vista sale sola. A partir de ahí, el ViewModel pide la vista **más media vista a cada
  lado** y guarda la respuesta como `LoadedArea`.
- Una vista posterior dentro de esa área, con el mismo combustible y una respuesta de menos de
  diez minutos, se sirve de memoria, **sin ninguna petición**.
- El backend devuelve como mucho 200 gasolineras, así que el ViewModel solo pide el margen cuando
  el último recuento dice que el área ampliada cabe en una respuesta. Si no, pide un cuarto de
  vista, o ningún margen. Si una respuesta con margen llega cortada a las 200 más baratas, la
  vuelve a pedir sin margen, porque una respuesta cortada podría dejar fuera gasolineras de la
  propia vista.

Hay un detalle fácil de pasar por alto. El pin con el precio más barato en pantalla lleva una
estrella, y tiene que seguir a la cámara, no al área cargada. Por eso `withCheapestIn(viewport)` la
recalcula sobre lo visible, y los colores siguen saliendo de la escala del backend para la zona (la
app nunca clasifica precios contra lo que haya en pantalla en ese momento).

`MapViewModelTest` cubre las secuencias: diez movimientos tras una carga con margen no hacen
ninguna petición, y otro combustible, una respuesta cortada o una respuesta antigua provocan una
nueva.

## 2. Android: un dibujo por contenido, no una vista por pin

### Qué era lento

El mapa de Android usa [android-maps-compose](https://github.com/googlemaps/android-maps-compose)
y su composable `Clustering`. Sus slots `clusterItemContent` y `clusterContent` son cómodos:
escribes un Composable y se convierte en el marcador. Pero por cada elemento la librería crea una
vista, la mide, la coloca, la dibuja y captura el resultado como `BitmapDescriptor`, en el hilo
principal, **aunque muchos pines sean exactamente iguales**.

Los mantenedores de la librería lo saben. La issue
[#272](https://github.com/googlemaps/android-maps-compose/issues/272), abierta desde febrero de
2023, pide una caché para esos bitmaps. Quien la abrió tenía 3.000 puntos pero solo unos 20
marcadores distintos. Sigue abierta, y los mantenedores prefieren buscar una optimización que no
necesite una clave de caché.

Había un segundo problema. La gasolinera seleccionada formaba parte de cada cluster item, así que
tocar un pin le daba a la librería una lista nueva y volvía a agrupar todo el mapa.

### Qué esperan las herramientas de Google

Por debajo de Compose, el clustering es la
[Maps SDK Utility Library](https://developers.google.com/maps/documentation/android-sdk/utility/marker-clustering):
un `ClusterManager`, un algoritmo y un `DefaultClusterRenderer`, que la documentación presenta como
"una buena base de la que partir" para marcadores propios, extendiéndolo. Así que el arreglo se
queda dentro de lo que Google documenta: usar el renderer de la librería y darle bitmaps en lugar
de vistas. La guía de optimización de JavaScript da el mismo consejo: imágenes raster simples para
los marcadores, y clustering cuando hay muchos.

### Lo que construí

![Antes: cluster item, slot de Compose, una vista nueva por pin, un bitmap capturado en el hilo principal. Después: el contenido es la clave de una caché, y un painter sobre Canvas solo dibuja en un fallo](src/assets/posts/fuelvo_map_pins_es.svg)

- **`MapPinContent`** es todo aquello de lo que depende el dibujo de un pin, y nada más: el texto,
  el tramo de precio, si está seleccionado y el tamaño del cluster. Dos pines con el mismo
  contenido son el mismo dibujo.

  ```kotlin
  internal data class MapPinContent(
      val text: String,
      val tier: PriceTier,
      val isSelected: Boolean = false,
      val clusterSize: Int = 0,
  )
  ```

- **`MapPinCache`** es un `LruCache` con `MapPinContent` como clave. Un mapa de 200 gasolineras
  tiene unas decenas de dibujos distintos, así que la mayoría de pines son aciertos de caché.
- **`MapPinPainter`** dibuja el pin directamente en un `Canvas`, con los colores del tema y la
  tipografía de los precios, resueltos una vez por tema. Cada dibujo va dentro de una sección de
  trace `MapPin:render` para que el benchmark lo pueda medir.
- **`StationClusterRenderer`** extiende `DefaultClusterRenderer` y pone esos bitmaps como iconos
  de los marcadores. La selección ya no forma parte de los elementos: previsualizar una gasolinera
  cambia **dos iconos** (el anterior y el nuevo) en lugar de darle a la librería una lista nueva.

`MapPinScreenshotTest` es el golden de los pines (Roborazzi), porque ningún screenshot de pantalla
completa los muestra.

### Los números, y lo que no pueden enseñar

Lo medí con un Macrobenchmark (`MapBenchmark`) sobre la build de release contra producción: mover
el mapa a zoom de ciudad, alejarse hasta la vista más amplia y volver, y moverlo ahí. Las cifras
son del recorrido de zoom, en un emulador:

| | Antes | Después |
|---|---|---|
| Vistas de Compose creadas para pines | 156–267 | 0 |
| Tiempo del hilo principal haciendo pines | 289–533 ms | 134–216 ms |
| Frames de más de 16,7 ms | más o menos igual | más o menos igual |

Las dos primeras filas son el trabajo que la app ya no hace: ninguna vista, y más o menos la mitad
del tiempo del hilo principal dedicado a producir pines. La tercera fila sale igual antes y
después, y la razón importa. En un emulador de 2 núcleos, los frames lentos vienen del pipeline de
GPU del emulador (`eglSwapBuffers`), no de la app, así que los tiempos de frame no pueden enseñar
esta mejora. Me queda pendiente una medición en un móvil de gama baja real, y no voy a dar una
cifra de mejora en frames hasta hacerla.

## 3. iOS: MapKit lo hacía bien, el código de alrededor no

MapKit ya hace las dos cosas que necesita un mapa con muchos marcadores: reutiliza las vistas de
las anotaciones (`dequeueReusableAnnotationView`) y trae el clustering integrado mediante
`clusteringIdentifier`. El desperdicio estaba en mi código alrededor:

- `updateUIView` hacía un diff completo en cada cambio de estado, aunque los marcadores no
  hubieran cambiado.
- Cuando cambiaba el contenido de una gasolinera (por ejemplo, la estrella pasando a otra), su
  anotación se quitaba y se volvía a poner, lo que además la reagrupaba y la animaba otra vez.
- Cada pin era un árbol de vistas: etiquetas sobre una capa redondeada con borde, y etiquetas con
  máscara en los clusters.

![En cada updateUIView, MapAnnotationDiff devuelve nil si los marcadores son la misma lista; si no, los separa en añadidos, quitados y cambiados, y a los cambiados solo se les redibuja la imagen](src/assets/posts/fuelvo_map_ios_es.svg)

- **`MapAnnotationDiff`** devuelve `nil` cuando los marcadores son la misma lista que ya muestra el
  mapa, así que la barra de carga o la tarjeta ya no tocan los pines. Si no, devuelve los
  añadidos, los quitados y los cambiados. Una gasolinera que cambia **conserva su anotación** y
  solo se redibuja su vista.
- **`MapPinImages`** dibuja cada `MapPinContent` (el equivalente en Swift del tipo de Kotlin) una
  vez por apariencia y tamaño de texto con `UIGraphicsImageRenderer`, y lo guarda. Los pines siguen
  Dynamic Type hasta 1,4×. 200 gasolineras que muestran 12 cosas distintas ocupan ahora 12 imágenes
  en lugar de 200 árboles de vistas.
- **Un bug de clustering arreglado por el camino:** el `clusteringIdentifier` se asignaba una vez
  en el `init`, pero las vistas reutilizadas reciben anotaciones nuevas. Al alejar el mapa a mano
  sobre Sevilla, algunos pines reutilizados se quedaban fuera de los clusters, amontonados unos
  encima de otros. Ahora se asigna cada vez que la vista recibe una anotación.

En iOS tampoco he medido aún tiempos de frame: el simulador tiene los mismos límites que el
emulador. Los cambios se cuentan con tests (`MapPinTests`), y el siguiente paso es una sesión de
Instruments en un iPhone físico con la plantilla Animation Hitches.

## Lo que sirvió en las dos plataformas

La misma idea resolvió el problema en las dos: **un pin es un dibujo de su contenido, y el
contenido es la clave de la caché**. Todo lo demás sale de ahí. Las librerías de clustering pueden
conservar sus marcadores, la selección cambia dos dibujos en lugar de todos los datos, y el trabajo
crece con el número de pines *distintos*, no con el de gasolineras.

Lo que le diría a otro equipo que vaya a hacer esto:

- **Arregla la carga de datos antes que el dibujo.** El pin más barato es el que nunca tienes
  que sustituir, y si esa lógica vive en Kotlin compartido, las dos apps la reciben en un commit.
- **Saca el estado transitorio de la UI de los elementos agrupados.** Con la selección en la
  lista de elementos, cada toque reagrupa el mapa.
- **Pon secciones de trace alrededor de tu propio trabajo.** `MapPin:render` y su signpost en iOS
  miden el trabajo de la app aunque los tiempos de frame del emulador no puedan.
- **Ten claro qué puede demostrar cada número.** El emulador demostró que la app hace menos
  trabajo; no demostró que el mapa vaya más fluido en un dispositivo real, y el artículo lo dice.
