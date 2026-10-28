---
title: "La Swift Export de Kotlin, Vista desde una App en Producción"
description: "La Swift export está en Alpha, en 2.4.20 ganó las clases sealed, y JetBrains quita la edición de Swift de su plugin de KMP. Qué significa para Fuelvo, que se publica sobre SKIE y KMP-NativeCoroutines."
pubDate: 2026-10-28
hero: "~/assets/projects/fuelvo_ios_detail.png"
heroAlt: "Pantalla de detalle de una gasolinera de Fuelvo en iOS, una pantalla SwiftUI cuyo estado viene de un ViewModel de Kotlin compartido"
tags: ["Kotlin Multiplatform", "Swift", "iOS", "SKIE", "Swift export"]
language: "es"
project: "fuelvo"
---

# La Swift Export de Kotlin, Vista desde una App en Producción

Desde el verano ha habido muchas novedades en la parte de Kotlin y Swift de Kotlin Multiplatform.
La mayoría de artículos las cuentan desde un proyecto de ejemplo. Este las cuenta desde
[Fuelvo](https://fuelvo.app), una app KMP con interfaz nativa en SwiftUI publicada en la App
Store, y se hace una pregunta práctica: ¿puedo quitar las librerías de interop de las que depende
hoy la app?

## Las novedades, por orden

- **Kotlin 2.4.0 (julio de 2026) subió la Swift export a Alpha.** La Swift export genera Swift
  directamente desde Kotlin, sin pasar por cabeceras de Objective-C. En esta versión, las funciones
  `suspend` se convierten en funciones `async` de Swift, y los flows de `kotlinx.coroutines` se
  pueden consumir como `AsyncSequence`
  ([Novedades de 2.4.0](https://kotlinlang.org/docs/whatsnew24.html)).
- **Kotlin 2.4.20 (septiembre de 2026) añadió las clases sealed.** Una jerarquía sealed tiene un
  método `sealedType()` que devuelve un enum de Swift, así que un `switch` sobre ella es
  exhaustivo. La versión añadió también la herencia entre lenguajes (una clase de Swift que hereda
  de una base de Kotlin para implementar una interfaz de Kotlin) y un `Package.swift` generado para
  los XCFrameworks que usan paquetes de SwiftPM
  ([Novedades de 2.4.20](https://kotlinlang.org/docs/whatsnew2420.html)).
- **En octubre de 2026 JetBrains anunció que quita el soporte del lenguaje Swift del plugin de
  KMP**, a partir de IntelliJ IDEA 2026.3 y Android Studio Rabbit 2 (2026.2.2): se acabó el
  resaltado, el autocompletado y la navegación entre lenguajes para Swift en esos IDEs. La Swift
  export, ejecutar y depurar la app de iOS e importar paquetes de SwiftPM no se ven afectados. El
  motivo que dan es que la mayoría de desarrolladores iOS en proyectos KMP ya escriben Swift en
  Xcode
  ([blog de JetBrains](https://blog.jetbrains.com/kotlin/2026/10/discontinuing-swift-language-ide-support-in-the-kotlin-multiplatform-plugin/)).

El cambio del IDE no afecta a Fuelvo: ahí el Swift siempre se ha escrito en Xcode, y el Kotlin en
Android Studio. La que merece un análisis detallado es la Swift export.

## Qué usa Fuelvo hoy, y por qué

La app de iOS consume el módulo de Kotlin `:core:presentation` (ViewModels, estado de la UI,
navegación) como un framework generado por el exportador clásico a Objective-C. Ese exportador
pierde justo lo que SwiftUI más necesita, y tres librerías lo compensan. El ADR del proyecto sobre
esto tiene una tabla como esta:

| Lo que pierde el exportador a Objective-C | Lo cubre |
|---|---|
| `StateFlow<UIState>` llega como un `StateFlow` sin tipo | KMP-NativeCoroutines (`@NativeCoroutinesState`) |
| `suspend` se convierte en un callback cuya cancelación nunca llega a la corrutina | KMP-NativeCoroutines |
| `sealed` se convierte en un protocolo, sin `switch` exhaustivo | SKIE (`onEnum(of:)`) |
| Un `enum` de Kotlin se convierte en una clase opaca | SKIE |
| No hay ciclo de vida de ViewModel en iOS (`viewModelScope` nunca se cancela) | KMP-ObservableViewModel (`@StateViewModel`) |

Funciona bien. Doce ficheros de ViewModel anotan su estado, trece vistas de SwiftUI tienen un
ViewModel con `@StateViewModel`, y cada tipo sealed se traduce a Swift en un único fichero, donde
una variante nueva en Kotlin se convierte en un error de compilación y no en un `default`
silencioso.

Pero tiene un coste, y es el bloqueo de versiones. **Las tres librerías están fijadas a builds
hechas para Kotlin 2.4.0.** Actualizar Kotlin significa esperar a que las tres publiquen una build
para la nueva versión y moverlas a la vez. La Swift export quita esa dependencia, porque forma
parte del compilador.

## Punto por punto: qué cubriría la Swift export

Comparado con la
[documentación oficial de la Swift export](https://kotlinlang.org/docs/native-swift-export.html):

- **Tipos sealed y enums: cubiertos.** Desde 2.4.20, `sealedType()` hace lo que hoy hace
  `onEnum(of:)` de SKIE. Además, los paquetes de Kotlin se convierten en enums anidados de Swift,
  así que dos tipos con el mismo nombre en paquetes distintos ya no chocan. Hoy los dos
  `ContentState` de Fuelvo llegan a Swift como `ContentState` y `ContentState_`, y ese segundo
  nombre se mantiene fuera de las vistas.
- **`suspend` → `async`: cubierto.** Si la cancelación de una `Task` de Swift llega a la corrutina
  es algo que la documentación no dice. Tendría que probarlo antes de confiar en ello, porque es
  uno de los motivos por los que KMP-NativeCoroutines está en el proyecto.
- **Flows: cubiertos en parte.** Un flow se puede consumir como `AsyncSequence`, pero la
  documentación no menciona `StateFlow` ni la observación desde SwiftUI. Hoy
  `@NativeCoroutinesState` da a cada ViewModel una propiedad `state` con tipo que SwiftUI redibuja
  sola; con la Swift export, esa observación habría que escribirla a mano.
- **ViewModels: no cubiertos, y esto es lo que lo bloquea.** La documentación dice que la Swift
  export solo admite "clases final que heredan directamente de `Any`". Los ViewModels de Fuelvo son
  final, pero heredan del `ViewModel` de KMP-ObservableViewModel. La herencia entre lenguajes de
  2.4.20 cubre otro caso: una clase de Swift que hereda de una base abierta de Kotlin.
- **Ciclo de vida del ViewModel: no lo aborda.** La Swift export genera APIs de Swift; no decide
  quién cancela el `viewModelScope` cuando se cierra una pantalla. Eso lo hace `@StateViewModel`, y
  si KMP-ObservableViewModel puede funcionar sobre la Swift export es lo primero que comprobaría.
- **Integración con el proyecto: compatible.** La Swift export solo funciona con integración
  directa, que es como Fuelvo ya genera su framework: una fase de build de Xcode que llama a
  Gradle. La migración cambiaría `embedAndSignAppleFrameworkForXcode` por
  `embedSwiftExportForXcode`.

## La decisión, por ahora

Fuelvo sigue en producción con el stack actual. La Swift export está en Alpha, la documentación
avisa de cambios incompatibles y hoy no puede exportar las clases de las que depende toda la
interfaz de iOS. No es una crítica: es el orden en que JetBrains va sacando funcionalidades, y cada
versión cubre más.

Lo que hago mientras tanto:

- **Mantener el interop en pocos sitios.** Las traducciones de tipos sealed viven en un fichero, y
  el interop escrito a mano es una factoría de Koin. Una futura migración tocaría esos pocos
  sitios, no cada pantalla.
- **Tratar la versión de Kotlin como una decisión de grupo.** Kotlin y las tres librerías se
  mueven juntas o no se mueven, y la guía del proyecto lo dice explícitamente, para que nadie
  actualice una de ellas por accidente.
- **Hacer un experimento barato cuando toque.** Una rama que cambie la fase de build a
  `embedSwiftExportForXcode` y deje que el compilador liste lo que no se exporta es trabajo de una
  tarde, y una guía mejor que cualquier changelog. Lo haré cuando la Swift export admita clases con
  superclase, o llegue a Beta.

La dirección está clara: el interop de Kotlin con Swift se está moviendo al compilador, y los IDEs
de JetBrains se centran en Kotlin mientras Swift se queda en Xcode. Para una app en producción,
prepararse significa mantener el interop en pocos sitios y no añadir dependencias nuevas de las
rarezas del exportador a Objective-C, más que migrar antes de tiempo.
