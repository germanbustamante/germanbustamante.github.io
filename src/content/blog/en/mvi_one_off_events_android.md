---
title: "MVI Done Right: Solving One-Off Events in Android"
description: "A deep dive into MVI architecture and why modeling one-off events as state transformations is the key to building robust, predictable Android applications."
pubDate: 2026-03-29
hero: "~/assets/heros/mvi_one_off_events_android.png"
heroAlt: "MVI architecture diagram showing state flow cycle"
tags: ["Android", "MVI", "Architecture", "StateFlow", "Kotlin", "ViewModel"]
language: "en"
---

# MVI Done Right: Solving One-Off Events in Android

> This post synthesizes ideas from three outstanding articles. Full credit and gratitude to:
>
> * [Manuel Vivo](https://medium.com/@manuelvicnt) (Google) — [ViewModel: One-off Event Antipatterns](https://medium.com/androiddevelopers/viewmodel-one-off-event-antipatterns-16a1da869b95)
> * [Eury Pérez Beltré](https://proandroiddev.com/@eury.perez.beltran) — [Yes, That is MVI](https://proandroiddev.com/yes-that-is-mvi-674f810ca4fe)
> * [Eury Pérez Beltré](https://proandroiddev.com/@eury.perez.beltran) — [Android One-off Events: Approaches, Evolution, Anti-patterns](https://proandroiddev.com/android-one-off-events-approaches-evolution-anti-patterns-add887cd0250)
>
> I highly recommend reading the originals. This post connects their insights into a single narrative and adds my own perspective.

## 🧠 Introduction: The State Confusion

For years, the Android community has debated architecture: MVVM or MVI? Are they even different? And then there is the recurring, stubborn problem of one-off events — how do you navigate to a screen exactly once, show a snackbar without duplicating it, or trigger a toast that shouldn't replay on configuration change?

What I find interesting is that these two debates are actually the same problem wearing different clothes. The confusion around MVI and the confusion around one-off events share a common root: a fuzzy understanding of what "state" really means in a reactive UI.

My thesis is simple — **if you truly understand MVI, the one-off events problem dissolves**. Events are not a special category that requires special mechanisms. They are transient state. Once you accept that, the solution becomes almost obvious, and the anti-patterns become obviously wrong.

Let's build that understanding from the ground up.

## 🔄 What MVI Actually Is

### The Historical Record

Here is something the Android community often gets wrong: MVI is not a rebranding of Redux. In fact, MVI predates Redux by roughly a year.

[André Staltz](https://staltz.com/) introduced MVI in 2014 through his work on Cycle.js and his post on "Reactive MVC and the Virtual DOM." Redux was released in 2015. Both drew inspiration from [Flux](https://facebookarchive.github.io/flux/) (Facebook, 2014) and its core idea of unidirectional data flow, but they evolved independently with different philosophies.

Why does this matter? Because when developers say "Android MVI is just Redux," they are importing assumptions that don't belong. Redux is built around a global, app-wide store and imperative reducers. MVI, as Staltz conceived it, is about **reactive streams** — the view and the model are linked through observable pipelines, not dispatched actions.

The evolution looks like this:

*   **MVC (1979):** Classic separation of concerns. Controller mediates between Model and View.
*   **Flux (2014):** Unidirectional data flow. Actions → Dispatcher → Store → View.
*   **Elm / MVU (2011):** Purely functional approach: Model + Message → new Model.
*   **MVI (2014):** Model + Intent streams → new Model → View.

### The Formula

At its core, MVI can be expressed as:

```
Old State + Intent = New State
```

The three components:

*   **Model** — an immutable snapshot of the entire UI state at a given moment.
*   **View** — a pure function of the Model. It renders state and nothing else.
*   **Intent** — user interactions and external inputs, expressed as a stream of discrete events.

The ViewModel in Android acts as the reducer: it receives Intents, applies them to the current state, and emits a new Model. The UI subscribes to the Model stream and re-renders whenever it changes.

### MVI vs. MVVM: Not the Same Pattern

The practical difference is in the state model:

*   **MVVM** typically exposes multiple independent observable properties (`isLoading: LiveData<Boolean>`, `items: LiveData<List<Item>>`, `errorMessage: LiveData<String?>`). The UI has to assemble these into a coherent picture.
*   **MVI** requires a single, unified, immutable `UiState` data class. Every change to the screen produces a new state object.

This constraint in MVI is not arbitrary. A single state object prevents inconsistent intermediate states — you can never have `isLoading = true` and `items = populated` at the same time if your reducer transitions are atomic.

## 🎯 The One-Off Events Problem

With MVI properly defined, we can frame the challenge: some UI interactions feel like "events" rather than "state." Navigation to a detail screen, a snackbar confirmation, a toast after a deletion — these happen once and then they are done. They don't describe a persistent condition.

Developers instinctively reach for event-like mechanisms: Channels, SharedFlow, Kotlin Flows. The mental model is "I fire this event from the ViewModel, the UI catches it." It feels clean. It mirrors how we think about button clicks.

The problem is that this mental model **breaks the MVI contract**. In MVI, the ViewModel's job is to expose *what the app state is*, not to *send commands to the UI*. The moment you have `_events.send(NavigateToDetail)`, the ViewModel is directing the UI — it has crossed the line from state management into UI logic.

And beyond the architectural purity argument, there is a very practical problem: **these mechanisms don't reliably deliver events to the UI**.

## 🚫 Anti-Patterns: What Not to Do

### The Channel Approach

```kotlin
// Anti-pattern: Channel for one-off events
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

This looks reasonable. But consider what happens during a configuration change: the UI stops collecting from the flow while the Activity is recreated. If `processPayment()` completes in that window, the `send()` call suspends until there is a collector — but if the coroutine is cancelled first, the event is silently dropped.

Before kotlinx.coroutines 1.4, atomic cancellation meant Channel operations would complete even after scope cancellation, which caused crashes but at least guaranteed delivery. With the introduction of **prompt cancellation** in 1.4, the crash was eliminated — but so was the delivery guarantee. As Roman Elizarov noted at the time: *"It never worked in the first place."* The 1.4 release simply made the failure visible.

### The SharedFlow Approach

```kotlin
// Anti-pattern: SharedFlow for one-off events
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

SharedFlow with `replay = 0` drops events if there is no active subscriber. With `replay = 1`, only the last event survives — useless if multiple events are emitted quickly. With `replay = unlimited`, you risk memory issues and replaying stale events to new collectors. There is no configuration that solves the fundamental problem.

### Manuel Vivo's Three Anti-Patterns

Manuel Vivo articulated this precisely in his 2022 article. The three failure modes are:

*   **Lost state** — The backend records a successful payment, but the UI never navigated to the confirmation screen. The app and server are now out of sync.
*   **ViewModel directing the UI** — When the ViewModel tells the UI to "navigate," it makes assumptions about the UI structure. A tablet layout and a phone layout might respond differently to the same state change. The ViewModel shouldn't know or care about that.
*   **Fire-and-forget modeling** — Events modeled as in-flight messages have no acknowledgment mechanism. Longer processing times increase the window for delivery failures.

### The Historical Timeline

What makes this story particularly interesting is *how long* the industry took to recognize the problem:

*   **2020** — Channels were widely recommended for one-off events. Atomic cancellation meant crashes on delivery failure, but the community treated this as "working."
*   **August 2020** — kotlinx.coroutines 1.4 introduces prompt cancellation. Events can now be silently lost. The community notices bugs but doesn't immediately connect them to the pattern.
*   **2021** — Manuel Vivo opens GitHub issue #2886 after observing mysterious event loss in production apps.
*   **Mid-2022** — Manuel publishes "ViewModel: One-off Event Antipatterns." Google updates the official Architecture documentation. The Channel/SharedFlow approach is officially deprecated as a pattern.

The industry moved slowly here because the bugs were intermittent and hard to reproduce. They only surfaced under specific timing conditions during configuration changes. This is a cautionary lesson: **patterns that mostly work are more dangerous than patterns that obviously fail**.

## ✅ The Solution: State All the Way Down

The fix is conceptually simple — if one-off events are the problem, stop modeling them as events. Model them as **transient state**.

### The Consume-and-Reset Pattern

```kotlin
data class PaymentUiState(
    val isLoading: Boolean = false,
    val paymentResult: PaymentData? = null,  // null = no pending navigation
    val userMessage: String? = null          // null = no pending message
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

The UI observes `uiState`. When `paymentResult` becomes non-null, it triggers navigation and calls `onNavigationHandled()`. The ViewModel clears the state. No event was sent — the state changed, the UI reacted, the state was cleared.

This survives configuration changes because `StateFlow` holds the latest value. A new UI subscriber immediately gets the current state, including any pending navigation. No event is lost.

### Sealed Interface Effects

For screens with multiple effect types, a sealed interface keeps things organized:

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

The `pendingEffect` field is nullable — null means no pending effect, non-null means something is waiting to be handled. The UI processes it and calls back to reset it.

### Composable Effect Handler

Eury Pérez Beltré took this further with a `LaunchedUiEffectHandler` composable that eliminates the boilerplate:

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

This centralizes lifecycle collection, `LaunchedEffect` keying, null checking, and consumption into a single reusable component. It also makes the consume-and-reset contract explicit and hard to accidentally skip.

### Why StateFlow Wins

*   **Guaranteed delivery** — State persists until explicitly consumed. It survives configuration changes and background transitions.
*   **Atomic updates** — `StateFlow.update {}` uses compare-and-swap internally. No race conditions.
*   **Lifecycle integration** — Works seamlessly with `collectAsStateWithLifecycle`. No manual lifecycle management.
*   **Process death resilience** — Backed by `SavedStateHandle.getStateFlow()`, it survives system-initiated process termination.

## 🛡️ Enforcing the Pattern

A good architecture is one that is hard to violate accidentally. Eury Pérez Beltré's article describes a Detekt custom rule that flags any `LaunchedEffect` that manually handles effect-like parameters, suggesting `LaunchedUiEffectHandler` instead. Similarly, a rule flagging `Channel` or `MutableSharedFlow` usage in ViewModel classes can catch anti-patterns at compile time. When patterns are enforced by tooling rather than code review discipline, they scale to large teams.

## 💡 Key Takeaways

*   MVI was created by André Staltz in 2014, predating Redux — understanding its origins helps avoid importing Redux assumptions into Android architecture.
*   The MVI formula is `Old State + Intent = New State`. The ViewModel is the reducer; it accepts intents and emits immutable state.
*   MVI and MVVM differ in their state model: MVI requires a single unified state object; MVVM typically uses multiple independent observables.
*   Channel and SharedFlow are unreliable for one-off events due to lifecycle timing gaps introduced by kotlinx.coroutines 1.4's prompt cancellation.
*   The three anti-patterns (lost state, ViewModel directing UI, fire-and-forget) all stem from modeling one-off operations as events rather than state.
*   StateFlow with nullable effect fields and a consume-and-reset pattern provides guaranteed delivery, atomicity, and lifecycle safety.
*   The `LaunchedUiEffectHandler` composable and Detekt custom rules make this pattern systematic and hard to violate.

## 📚 Further Reading

*   [ViewModel: One-off Event Antipatterns](https://medium.com/androiddevelopers/viewmodel-one-off-event-antipatterns-16a1da869b95) — Manuel Vivo
*   [Yes, That is MVI](https://proandroiddev.com/yes-that-is-mvi-674f810ca4fe) — Eury Pérez Beltré
*   [Android One-off Events: Approaches, Evolution, Anti-patterns](https://proandroiddev.com/android-one-off-events-approaches-evolution-anti-patterns-add887cd0250) — Eury Pérez Beltré
*   [Reactive MVC and the Virtual DOM](https://staltz.com/reactive-mvc-and-the-virtual-dom.html) — André Staltz (the original MVI post, 2014)
