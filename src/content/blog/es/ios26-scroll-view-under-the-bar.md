---
title: "Los Chips Invisibles: un Bug de iOS 26 Arreglado con un Punto de Padding"
description: "Los filtros de combustible de Fuelvo se podían tocar pero eran invisibles en la mayoría de arranques en iOS 26. El arreglo fue un punto de padding; encontrarlo exigió medir decenas de instalaciones."
pubDate: 2026-10-16
hero: "~/assets/projects/fuelvo_ios_list.png"
heroAlt: "Lista de gasolineras de Fuelvo en iOS, con la fila de chips de combustible bajo el campo de búsqueda"
tags: ["iOS", "SwiftUI", "iOS 26", "Liquid Glass", "Depuración"]
language: "es"
project: "fuelvo"
---

# Los Chips Invisibles: un Bug de iOS 26 Arreglado con un Punto de Padding

En la lista de gasolineras de la app de iOS de [Fuelvo](https://fuelvo.app), bajo el campo de
búsqueda, hay una fila de chips: *Abierta ahora* y uno por combustible. Es la forma de pasar de
diésel a gasolina. En iOS 26, en la mayoría de arranques, esa fila no estaba.

No había desaparecido. Los chips estaban colocados, respondían al toque y los tests de UI los
encontraban. Simplemente no se dibujaban. No lo detecté por un informe de crash ni por un test que
fallara, sino mirando mis propias capturas de la App Store: la fila salía vacía en todas las
capturas de la lista. La versión 1.1.0 había pasado la revisión de Apple y estaba publicada con el
bug.

## El layout

La fila es un `ScrollView` horizontal dentro de una cabecera que la lista fija bajo la barra de
navegación con `safeAreaInset`:

```swift
List { /* gasolineras */ }
    .safeAreaInset(edge: .top, spacing: 0) {
        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: FuelvoSpacing.sm) { /* Abierta ahora + un chip por combustible */ }
                    .padding(.horizontal, FuelvoSpacing.md)
            }
        }
        .padding(.bottom, FuelvoSpacing.sm)
        .background(.bar)
    }
```

Es SwiftUI estándar: una cabecera que se queda fija mientras la lista se desplaza por debajo.
Funcionaba en iOS 18 y funciona en iOS 27. Fallaba en iOS 26.5.

## Primer arreglo: plausible, probado una vez y equivocado

iOS 26 trajo Liquid Glass y, con él, el *scroll edge effect*: el contenido que se desplaza bajo una
barra se desvanece. La fila de chips estaba justo debajo de la barra, así que el sospechoso obvio
era que el sistema la estaba desvaneciendo entera. iOS 26 tiene un modificador para desactivarlo,
`scrollEdgeEffectHidden`, y al aplicarlo a la fila los chips aparecieron en el siguiente arranque.
El ticket (`FUEA-123`) se cerró, con una captura de antes y después.

Ese mismo día, preparando la versión 1.1.1, me hice otra pregunta: ¿en cuántos arranques aparece?
Conté instalaciones limpias (borrar la app, instalarla, abrirla, mirar la fila) en el simulador del
iPhone 17 con iOS 26.5:

| | Arranques en los que se dibujaron los chips |
|---|---|
| Sin el arreglo | 6 de 32 |
| Con `scrollEdgeEffectHidden` | 19 de 38 |

El arreglo había subido la tasa de más o menos uno de cada cinco a uno de cada dos. No había
arreglado nada: mi primera prueba había caído por casualidad en un arranque bueno. Un detalle
empeoraba el bug: **una fila que empezaba vacía seguía vacía** toda la sesión.

## Diagnóstico por descarte

Con una tasa en lugar de un sí o un no, cada hipótesis se podía probar bien: cambiar una cosa y
repetir suficientes instalaciones limpias para ver si la tasa se movía.

- **La misma fila sin `ScrollView`**: se dibujó en 10 de 10 arranques. Así que el scroll view era
  parte del problema, no los chips ni el material de la barra.
- **`safeAreaBar`** en lugar de `safeAreaInset`, **ocultar o endurecer el edge effect** de la
  lista, **quitar el fondo `.bar`** y **reconstruir la fila**: nada de eso movió la tasa de forma
  apreciable.
- **Sacar la fila del `safeAreaInset`** la dibujaba siempre, pero rompía otra cosa: después de
  cambiar de pestaña, tirar de la lista hacia abajo ya no mostraba el campo de búsqueda. No era
  aceptable.

Mirar el frame del scroll view mostró lo que pasaba. No empezaba bajo la barra, donde parecía
estar. Empezaba **en la parte de arriba de la pantalla**, y los chips ocupaban los últimos 44
puntos de un frame que se extendía por debajo de la barra de navegación. Un scroll view que toca
el safe area superior se extiende dentro de él, y en iOS 26 lo que un scroll view tiene en esa
zona muchas veces no se dibuja.

## El arreglo

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

Un punto de padding aparta el scroll view de ese borde, así que ya no se extiende bajo la barra.
Resultado: **56 de 56** arranques dibujados, con el layout y todo el comportamiento igual, campo
de búsqueda incluido. El modificador `scrollEdgeEffectHidden` se quitó en el mismo commit, porque
no era la causa.

El comentario importa tanto como el padding. Sin él, un padding de 1 punto parece un error de
redondeo, y la próxima limpieza lo borra.

El arreglo salió en la versión 1.1.1 de iOS, que Apple ya ha aprobado. Está comprobado en los
simuladores de iOS 26.5 y 27.0. No está comprobado en un iPhone físico ni en iOS 18.x, y el commit
lo dice.

## Lo que me llevo

- **Un bug intermitente necesita una tasa, no una captura.** Un arranque bueno no demostraba nada
  sobre `FUEA-123`. "Arreglado" ahora significa un número sobre muchas instalaciones limpias,
  antes y después del cambio.
- **Los tests de UI comprueban que los elementos existen, no que se vean.** XCUITest veía los
  chips, podía tocarlos y los toques funcionaban. Solo una persona mirando la pantalla, o una
  captura, podía detectarlo.
- **Convierte el hallazgo en una regla.** La guía del proyecto dice ahora que un scroll view no
  debe tocar el safe area superior bajo una barra, y que un arreglo para algo que solo pasa en
  algunos arranques se mide sobre muchas instalaciones limpias, nunca con una.
- **Mira bien tus capturas de la tienda.** Son las imágenes más vistas de tu app, y en este caso
  también fueron el informe del bug.
