---
title: "MVI Bien Hecho: Resolviendo Eventos Puntuales en Android"
description: "Una inmersión profunda en la arquitectura MVI y por qué modelar eventos puntuales como transformaciones de estado es clave para apps Android robustas."
pubDate: 2026-03-29
hero: "~/assets/heros/mvi_one_off_events_android.png"
heroAlt: "Diagrama de arquitectura MVI mostrando el ciclo de flujo de estado"
tags: ["Android", "MVI", "Arquitectura", "StateFlow", "Kotlin", "ViewModel"]
language: "es"
---

# MVI Bien Hecho: Resolviendo Eventos Puntuales en Android

> Este post sintetiza ideas de tres artículos excelentes. Todo el crédito y agradecimiento a:
>
> * [Manuel Vivo](https://medium.com/@manuelvicnt) (Google) — [ViewModel: One-off Event Antipatterns](https://medium.com/androiddevelopers/viewmodel-one-off-event-antipatterns-16a1da869b95)
> * [Eury Pérez Beltré](https://proandroiddev.com/@eury.perez.beltran) — [Yes, That is MVI](https://proandroiddev.com/yes-that-is-mvi-674f810ca4fe)
> * [Eury Pérez Beltré](https://proandroiddev.com/@eury.perez.beltran) — [Android One-off Events: Approaches, Evolution, Anti-patterns](https://proandroiddev.com/android-one-off-events-approaches-evolution-anti-patterns-add887cd0250)
>
> Recomiendo mucho leer los originales. Este post conecta sus ideas en una narrativa unificada y añade mi propia perspectiva.

## 🧠 Introducción: La Confusión con el Estado

Durante años, la comunidad Android ha debatido sobre arquitectura: ¿MVVM o MVI? ¿Son siquiera patrones distintos? Y luego está ese problema recurrente y obstinado de los eventos puntuales — ¿cómo navegas a una pantalla exactamente una vez, muestras un snackbar sin duplicarlo o lanzas un toast que no debería reproducirse tras un cambio de configuración?

Lo que encuentro interesante es que estos dos debates son en realidad el mismo problema con diferente disfraz. La confusión en torno a MVI y la confusión en torno a los eventos puntuales comparten una raíz común: una comprensión difusa de lo que "estado" significa realmente en una UI reactiva.

Mi tesis es simple — **si entiendes verdaderamente MVI, el problema de los eventos puntuales se disuelve**. Los eventos no son una categoría especial que requiere mecanismos especiales. Son estado transitorio. Una vez que aceptas eso, la solución se vuelve casi obvia, y los anti-patrones resultan obviamente incorrectos.

Construyamos esa comprensión desde la base.

## 🔄 Qué es MVI en Realidad

### El Registro Histórico

Aquí hay algo que la comunidad Android suele equivocarse: MVI no es un Redux rebautizado. De hecho, MVI es anterior a Redux por aproximadamente un año.

[André Staltz](https://staltz.com/) introdujo MVI en 2014 a través de su trabajo en Cycle.js y su post sobre "Reactive MVC and the Virtual DOM." Redux se lanzó en 2015. Ambos se inspiraron en [Flux](https://facebookarchive.github.io/flux/) (Facebook, 2014) y su idea central de flujo de datos unidireccional, pero evolucionaron de forma independiente con filosofías distintas.

¿Por qué importa esto? Porque cuando los desarrolladores dicen "MVI en Android es solo Redux," importan suposiciones que no corresponden. Redux está construido alrededor de un store global a nivel de app y reducers imperativos. MVI, tal como Staltz lo concibió, trata sobre **streams reactivos** — la vista y el modelo están vinculados a través de pipelines observables, no acciones despachadas.

La evolución se ve así:

*   **MVC (1979):** Separación clásica de responsabilidades. El Controlador media entre Modelo y Vista.
*   **Flux (2014):** Flujo de datos unidireccional. Acciones → Dispatcher → Store → Vista.
*   **Elm / MVU (2011):** Enfoque puramente funcional: Modelo + Mensaje → nuevo Modelo.
*   **MVI (2014):** Modelo + streams de Intent → nuevo Modelo → Vista.

### La Fórmula

En su núcleo, MVI puede expresarse como:

```
Estado Anterior + Intent = Nuevo Estado
```

Los tres componentes:

*   **Model** — una instantánea inmutable del estado completo de la UI en un momento dado.
*   **View** — una función pura del Model. Solo renderiza estado, nada más.
*   **Intent** — interacciones del usuario e inputs externos, expresados como un stream de eventos discretos.

El ViewModel en Android actúa como el reducer: recibe Intents, los aplica al estado actual y emite un nuevo Model. La UI se suscribe al stream del Model y se re-renderiza cada vez que cambia.

### MVI vs. MVVM: No Son el Mismo Patrón

La diferencia práctica está en el modelo de estado:

*   **MVVM** típicamente expone múltiples propiedades observables independientes (`isLoading: LiveData<Boolean>`, `items: LiveData<List<Item>>`, `errorMessage: LiveData<String?>`). La UI tiene que ensamblarlas en un cuadro coherente.
*   **MVI** requiere una única clase de datos `UiState` unificada e inmutable. Cada cambio en la pantalla produce un nuevo objeto de estado.

Esta restricción en MVI no es arbitraria. Un objeto de estado único previene estados intermedios inconsistentes — nunca puedes tener `isLoading = true` e `items = populated` simultáneamente si tus transiciones del reducer son atómicas.

## 🎯 El Problema de los Eventos Puntuales

Con MVI correctamente definido, podemos enmarcar el desafío: algunas interacciones de UI se sienten como "eventos" en lugar de "estado." La navegación a una pantalla de detalles, una confirmación de snackbar, un toast tras una eliminación — ocurren una vez y luego terminan. No describen una condición persistente.

Los desarrolladores instintivamente recurren a mecanismos tipo eventos: Channels, SharedFlow, Kotlin Flows. El modelo mental es "lanzo este evento desde el ViewModel, la UI lo captura." Parece limpio. Refleja cómo pensamos sobre los clics de botones.

El problema es que este modelo mental **rompe el contrato de MVI**. En MVI, el trabajo del ViewModel es exponer *cuál es el estado de la app*, no *enviar comandos a la UI*. En el momento en que tienes `_events.send(NavigateToDetail)`, el ViewModel está dirigiendo la UI — ha cruzado la línea de la gestión de estado a la lógica de UI.

Y más allá del argumento de pureza arquitectónica, hay un problema muy práctico: **estos mecanismos no entregan eventos a la UI de forma fiable**.

## 🚫 Anti-Patrones: Qué No Hacer

### El Enfoque con Channel

```kotlin
// Anti-patrón: Channel para eventos puntuales
class PaymentViewModel : ViewModel() {
    private val _events = Channel<PaymentEvent>()
    val events = _events.receiveAsFlow()

    fun processPayment() {
        viewModelScope.launch {
            val result = repository.pay()
            _events.send(PaymentEvent.NavigateToConfirmation(result))
        }
    }
}
```

Esto parece razonable. Pero considera qué ocurre durante un cambio de configuración: la UI deja de recolectar del flow mientras la Activity se recrea. Si `processPayment()` termina en ese intervalo, la llamada `send()` se suspende hasta que haya un recolector — pero si la coroutine se cancela primero, el evento se pierde silenciosamente.

Antes de kotlinx.coroutines 1.4, la cancelación atómica significaba que las operaciones del Channel se completaban incluso tras la cancelación del scope, lo que causaba crashes pero al menos garantizaba la entrega. Con la introducción de la **cancelación inmediata** en 1.4, el crash fue eliminado — pero también la garantía de entrega. Como señaló Roman Elizarov en ese momento: *"Nunca funcionó en primer lugar."* La versión 1.4 simplemente hizo visible el fallo.

### El Enfoque con SharedFlow

```kotlin
// Anti-patrón: SharedFlow para eventos puntuales
class PaymentViewModel : ViewModel() {
    private val _events = MutableSharedFlow<PaymentEvent>()
    val events = _events.asSharedFlow()

    fun processPayment() {
        viewModelScope.launch {
            val result = repository.pay()
            _events.emit(PaymentEvent.NavigateToConfirmation(result))
        }
    }
}
```

SharedFlow con `replay = 0` descarta eventos si no hay suscriptor activo. Con `replay = 1`, solo sobrevive el último evento — inútil si se emiten múltiples eventos rápidamente. Con `replay = unlimited`, arriesgas problemas de memoria y reproducir eventos obsoletos para nuevos recolectores. No hay configuración que resuelva el problema fundamental.

### Los Tres Anti-Patrones de Manuel Vivo

Manuel Vivo articuló esto con precisión en su artículo de 2022. Los tres modos de fallo son:

*   **Estado perdido** — El backend registra un pago exitoso, pero la UI nunca navegó a la pantalla de confirmación. La app y el servidor ahora están desincronizados.
*   **ViewModel dirigiendo la UI** — Cuando el ViewModel le dice a la UI que "navegue," hace suposiciones sobre la estructura de la UI. Un diseño para tablet y uno para móvil podrían responder de forma diferente al mismo cambio de estado. El ViewModel no debería saber ni importarle eso.
*   **Modelado fire-and-forget** — Los eventos modelados como mensajes en vuelo no tienen mecanismo de acuse de recibo. Tiempos de procesamiento más largos aumentan la ventana para fallos de entrega.

### La Línea de Tiempo Histórica

Lo que hace esta historia particularmente interesante es *cuánto tardó* la industria en reconocer el problema:

*   **2020** — Los Channels eran ampliamente recomendados para eventos puntuales. La cancelación atómica significaba crashes en fallos de entrega, pero la comunidad lo trataba como "funcionando."
*   **Agosto 2020** — kotlinx.coroutines 1.4 introduce la cancelación inmediata. Los eventos ahora pueden perderse silenciosamente. La comunidad nota bugs pero no los conecta inmediatamente con el patrón.
*   **2021** — Manuel Vivo abre el issue #2886 en GitHub tras observar pérdida misteriosa de eventos en apps de producción.
*   **Mediados de 2022** — Manuel publica "ViewModel: One-off Event Antipatterns." Google actualiza la documentación oficial de Arquitectura. El enfoque con Channel/SharedFlow queda oficialmente descontinuado como patrón.

La industria se movió lentamente aquí porque los bugs eran intermitentes y difíciles de reproducir. Solo surgían bajo condiciones de timing específicas durante cambios de configuración. Esta es una lección de precaución: **los patrones que funcionan la mayoría del tiempo son más peligrosos que los que obviamente fallan**.

## ✅ La Solución: Estado de Principio a Fin

La corrección es conceptualmente simple — si los eventos puntuales son el problema, deja de modelarlos como eventos. Modélalos como **estado transitorio**.

### El Patrón Consume-and-Reset

```kotlin
data class PaymentUiState(
    val isLoading: Boolean = false,
    val paymentResult: PaymentData? = null,  // null = sin navegación pendiente
    val userMessage: String? = null          // null = sin mensaje pendiente
)

class PaymentViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(PaymentUiState())
    val uiState = _uiState.asStateFlow()

    fun processPayment() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = repository.pay()
            _uiState.update { it.copy(isLoading = false, paymentResult = result) }
        }
    }

    fun onNavigationHandled() {
        _uiState.update { it.copy(paymentResult = null) }
    }

    fun onMessageShown() {
        _uiState.update { it.copy(userMessage = null) }
    }
}
```

La UI observa `uiState`. Cuando `paymentResult` se vuelve no nulo, desencadena la navegación y llama a `onNavigationHandled()`. El ViewModel limpia el estado. No se envió ningún evento — el estado cambió, la UI reaccionó, el estado fue limpiado.

Esto sobrevive a los cambios de configuración porque `StateFlow` mantiene el último valor. Un nuevo suscriptor de la UI obtiene inmediatamente el estado actual, incluyendo cualquier navegación pendiente. No se pierde ningún evento.

### Sealed Interface de Efectos

Para pantallas con múltiples tipos de efectos, una interfaz sellada mantiene las cosas organizadas:

```kotlin
sealed interface UiEffect {
    data class Navigate(val route: String) : UiEffect
    data class ShowSnackbar(val message: String, val actionLabel: String? = null) : UiEffect
    data object ShowDeleteConfirmation : UiEffect
}

data class MyUiState(
    val items: List<Item> = emptyList(),
    val isLoading: Boolean = false,
    val pendingEffect: UiEffect? = null
)
```

El campo `pendingEffect` es nullable — null significa ningún efecto pendiente, no nulo significa que algo está esperando ser manejado. La UI lo procesa y llama de vuelta para resetearlo.

### Composable Effect Handler

Eury Pérez Beltré fue más lejos con un composable `LaunchedUiEffectHandler` que elimina el boilerplate:

```kotlin
@Composable
fun LaunchedUiEffectHandler(
    effect: UiEffect?,
    onEffectHandled: () -> Unit,
    handler: suspend (UiEffect) -> Unit
) {
    LaunchedEffect(effect) {
        effect?.let {
            handler(it)
            onEffectHandled()
        }
    }
}
```

Esto centraliza la recolección del ciclo de vida, el keying de `LaunchedEffect`, la comprobación de nulos y el consumo en un único componente reutilizable. También hace el contrato consume-and-reset explícito y difícil de omitir accidentalmente.

### Por Qué Gana StateFlow

*   **Entrega garantizada** — El estado persiste hasta ser consumido explícitamente. Sobrevive a cambios de configuración y transiciones en segundo plano.
*   **Actualizaciones atómicas** — `StateFlow.update {}` usa compare-and-swap internamente. Sin condiciones de carrera.
*   **Integración con el ciclo de vida** — Funciona perfectamente con `collectAsStateWithLifecycle`. Sin gestión manual del ciclo de vida.
*   **Resiliencia ante process death** — Respaldado por `SavedStateHandle.getStateFlow()`, sobrevive a la terminación del proceso iniciada por el sistema.

## 🛡️ Reforzando el Patrón

Una buena arquitectura es aquella que es difícil de violar accidentalmente. El artículo de Eury Pérez Beltré describe una regla personalizada de Detekt que detecta cualquier `LaunchedEffect` que maneje manualmente parámetros tipo efecto, sugiriendo `LaunchedUiEffectHandler` en su lugar. De forma similar, una regla que detecte el uso de `Channel` o `MutableSharedFlow` en clases ViewModel puede atrapar anti-patrones en tiempo de compilación. Cuando los patrones son reforzados por herramientas en lugar de disciplina en revisiones de código, escalan a equipos grandes.

## 💡 Conclusiones Clave

*   MVI fue creado por André Staltz en 2014, anterior a Redux — entender sus orígenes ayuda a evitar importar suposiciones de Redux en la arquitectura Android.
*   La fórmula MVI es `Estado Anterior + Intent = Nuevo Estado`. El ViewModel es el reducer; acepta intents y emite estado inmutable.
*   MVI y MVVM difieren en su modelo de estado: MVI requiere un objeto de estado único y unificado; MVVM típicamente usa múltiples observables independientes.
*   Channel y SharedFlow no son fiables para eventos puntuales debido a las brechas de timing del ciclo de vida introducidas por la cancelación inmediata de kotlinx.coroutines 1.4.
*   Los tres anti-patrones (estado perdido, ViewModel dirigiendo la UI, fire-and-forget) se derivan todos de modelar operaciones puntuales como eventos en lugar de estado.
*   StateFlow con campos de efecto nullable y un patrón consume-and-reset proporciona entrega garantizada, atomicidad y seguridad con el ciclo de vida.
*   El composable `LaunchedUiEffectHandler` y las reglas personalizadas de Detekt hacen que este patrón sea sistemático y difícil de violar.

## 📚 Lectura Adicional

*   [ViewModel: One-off Event Antipatterns](https://medium.com/androiddevelopers/viewmodel-one-off-event-antipatterns-16a1da869b95) — Manuel Vivo
*   [Yes, That is MVI](https://proandroiddev.com/yes-that-is-mvi-674f810ca4fe) — Eury Pérez Beltré
*   [Android One-off Events: Approaches, Evolution, Anti-patterns](https://proandroiddev.com/android-one-off-events-approaches-evolution-anti-patterns-add887cd0250) — Eury Pérez Beltré
*   [Reactive MVC and the Virtual DOM](https://staltz.com/reactive-mvc-and-the-virtual-dom.html) — André Staltz (el post original de MVI, 2014)
