---
title: "Los 12 Testers y 14 Días de Google Play, como Desarrollador en Solitario"
description: "Las cuentas personales nuevas de Play necesitan una prueba cerrada de dos semanas con 12 testers antes de producción. Cómo fue con Fuelvo, para qué sirvió de verdad y cómo planificar un lanzamiento con ella."
pubDate: 2026-10-26
hero: "~/assets/heros/fuelvo_feature_graphic.png"
heroAlt: "Gráfico de cabecera de Fuelvo en Google Play: el nombre de la app y su mapa de precios"
tags: ["Android", "Google Play", "Release", "Desarrollo indie"]
language: "es"
project: "fuelvo"
---

# Los 12 Testers y 14 Días de Google Play, como Desarrollador en Solitario

En la App Store, [Fuelvo](https://fuelvo.app) pasó de la subida a estar publicada en pocos días:
una revisión y un lanzamiento manual. En Google Play la misma app necesitó un mes, y la mayor parte
de ese tiempo no fue revisión. Fue una norma por la que tiene que pasar toda cuenta personal de
desarrollador nueva.

## La norma

Desde noviembre de 2023, una cuenta **personal** de desarrollador de Play creada después del 13 de
noviembre de 2023 no puede publicar en producción directamente. Según la
[página de ayuda de Google](https://support.google.com/googleplay/android-developer/answer/14151465),
primero tiene que hacer una prueba cerrada con **al menos 12 testers que hayan estado apuntados sin
interrupción durante al menos 14 días**, y después solicitar el acceso a producción. Los testers
que se apuntan y se van antes de los 14 días no cuentan, y quien sale y vuelve a entrar empieza
sus 14 días de cero.

Las cuentas de organización están exentas. Para un desarrollador en solitario sin empresa no hay
forma de evitarla, así que es mejor planificarla que lamentarla.

## Cómo fue con Fuelvo

| Fecha (2026) | Paso |
|---|---|
| 6 de octubre | 1.0.0 subida a los canales interno y cerrado |
| ~8 de octubre | Empieza la prueba cerrada con amigos y familia |
| 13 de octubre | Mientras tanto, la app de iOS se publica en la App Store |
| 22 de octubre | Se completan los 14 días; se solicita el acceso a producción |
| 25 de octubre | Acceso concedido (Google dice que puede tardar alrededor de una semana) |
| 28 de octubre | La versión 1.1.0 al 100 % en producción, tras un despliegue escalonado 10 → 50 → 100 % |

Unas cuantas decisiones hicieron que la prueba funcionara:

- **Reclutar bastantes más de 12.** Se apuntaron unas 20 personas. Hay testers que dejan de usar la
  app, cambian de móvil o salen de la prueba sin darse cuenta, y si la cifra baja de 12 el reloj
  deja de contar. Con 20, unas pocas bajas no importaron.
- **Usar un canal de feedback que la gente ya use.** El enlace para apuntarse y las instrucciones
  se mandaron por WhatsApp, y por ahí llegó el feedback. Un formulario que nadie abre no da nada que
  contar.
- **Seguir publicando durante la prueba.** La prueba no congeló el desarrollo. La versión 1.1.0,
  con el mapa de precios rehecho, llegó al canal cerrado a mitad de la prueba, así que los testers
  acabaron probando la versión que iba a llegar a producción.
- **Mantener a todo el mundo dentro hasta que Google conteste.** La solicitud pregunta por la
  prueba que ya se ha hecho, pero no hay motivo para dejar que el grupo se disuelva antes de que
  llegue la respuesta.

## Para qué sirvió de verdad la prueba

Empecé tratándola como un trámite. Resultó ser la primera vez que la app de Android funcionaba en
móviles que no eran míos, con ubicaciones reales y redes que no controlo.

- **Android vitals tuvo datos reales**: 0 crashes y 3 ANRs entre unos 20 usuarios. Un ANR es el
  tipo de cosa que un emulador rara vez te enseña.
- **Play señaló algo que yo no había configurado.** En cada subida, la consola avisaba de que el
  bundle tenía código nativo sin símbolos de depuración. Las librerías nativas vienen de
  dependencias (entre ellas el driver empaquetado de SQLite), y sin símbolos un crash nativo
  aparece en Play vitals como direcciones de memoria. El arreglo es una línea en el Android Gradle
  Plugin, y sale con la próxima actualización:

  ```kotlin
  android {
      buildTypes {
          getByName("release") {
              ndk { debugSymbolLevel = "SYMBOL_TABLE" }
          }
      }
  }
  ```

- **Obligó a ensayar el camino completo de una release**: subida, canal, promoción, notas de la
  versión en cada idioma, porcentajes del despliegue. Cuando llegó producción, nada de eso era
  nuevo.

## La solicitud de acceso a producción

El formulario tiene tres secciones: la prueba cerrada, la app y lo preparada que está para
producción. Entre otras cosas, Google pide que resumas el feedback de los testers, cómo lo
recogiste y qué cambiaste por él. Dos cosas ayudaron:

- **Contestar en inglés y con detalle.** Nombrar las versiones que recibieron los testers y qué
  cambió en cada una se lee mejor que las frases generales.
- **Contestar con honestidad sobre el tamaño de la prueba.** Amigos y familia es una fuente
  legítima de testers para un desarrollador en solitario; inventarse una beta más grande no lo es.

La respuesta llegó en tres días.

## Planificar un lanzamiento con esta norma

Para una cuenta personal nueva, el tiempo mínimo hasta producción es:

**14 días de prueba + la revisión de la solicitud (Google habla de hasta una semana) + la revisión
de la versión de producción**, y los 14 días solo empiezan cuando 12 personas se han apuntado.

Eso cambia el plan:

- Abre la prueba cerrada **en cuanto haya una build estable**, no cuando la app esté "terminada".
  El reloj corre mientras sigues desarrollando.
- Si el lanzamiento es en las dos plataformas, **empieza por Android**. La app de iOS de Fuelvo
  llevaba dos semanas publicada en la App Store antes de que la de Android pudiera siquiera pedir
  producción.
- No comprometas una fecha de lanzamiento ni nada de marketing hasta tener el acceso a
  producción. Hasta entonces la fecha no depende de ti.

La norma está pensada claramente para filtrar apps hechas con poco esfuerzo, y a un desarrollador
en solitario le cuesta alrededor de un mes. Pero no es tiempo perdido si se usa como lo que es:
una beta cerrada de verdad, antes de que el público vea la app.
