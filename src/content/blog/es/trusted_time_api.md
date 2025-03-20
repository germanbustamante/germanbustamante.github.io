---
title: Explorando la API TrustedTime, tiempo confiable en Android
description: La API TrustedTime de Google ofrece marcas de tiempo confiables para apps Android. Aprende cómo implementarla y sus beneficios para la precisión y seguridad.
pubDate: 2025-02-17
hero: "~/assets/heros/trusted_time_api.png"
heroAlt: "Trusted time API logo"
tags: ["Android", "Time", "API", "TrustedTime", "Google Play Services"]
language: "es"
---
# Presentando la API TrustedTime

El tiempo es crucial en muchas apps, pero ¿qué pasa si el usuario cambia la hora de su dispositivo? ¡Problemas!  Datos inconsistentes, fallos de seguridad... 

Por eso, Google ha creado la API TrustedTime, una solución que aprovecha su infraestructura para darnos marcas de tiempo confiables. 

## ¿Cómo funciona? ⚙️

TrustedTime se sincroniza con los servidores de tiempo de Google, ¡así siempre tendrás la hora más precisa! ️ Además, calcula la deriva del reloj del dispositivo, lo que nos permite evaluar la precisión de la marca de tiempo.

## ¿Para qué sirve?

Esta API es genial para:

*   **Apps financieras:** ¡Transacciones seguras y precisas! 
*   **Juegos:** ¡Nada de trampas con el reloj! 
*   **E-commerce:** ¡Pedidos siempre en orden! 
*   **Licencias de contenido:** ¡Restricciones de tiempo sin problemas! 
*   **IoT:** ¡Sincronización perfecta entre dispositivos! 

## ¿Cómo empezar?

Es muy fácil integrar TrustedTime en tus apps Android:

1.  Añade la dependencia: `com.google.android.gms:play-services-time:16.0.1` (o superior) en tu archivo `build.gradle`.
2.  Inicializa `TrustedTimeClient`: Hazlo al principio del ciclo de vida de tu app (por ejemplo, en el método `onCreate()` de tu clase `Application`).

## Ejemplo de código ⌨️

```kotlin
class MainActivity : AppCompatActivity() {

    private var trustedTimeClient: TrustedTimeClient? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        //....
        TrustedTime.createClient(this).addOnSuccessListener {
            trustedTimeClient = it
        }.addOnFailureListener {
            Log.e("MainActivity", "Failed to create TrustedTimeClient", it)
        }

        Log.i("MainActivity", "Current time in millis: ${getCurrentTimeInMillis()}")
    }

    private fun getCurrentTimeInMillis(): Long =
        trustedTimeClient?.computeCurrentUnixEpochMillis() ?: System.currentTimeMillis() //Use System.currentTimeMillis() as failsafe
}
```

## Entrando mas en detalle ⏱️

El método `createClient()` devuelve un objeto `TrustedTimeClient`. Este objeto es la clave para acceder a las funcionalidades de TrustedTime. Puedes obtener más información sobre `TrustedTimeClient` y sus métodos [aquí](https://developers.google.com/android/reference/com/google/android/gms/time/TrustedTimeClient).

Los métodos de esta clase proporcionan información de tiempo en varias formas:

*   **Instant** (también disponible como tiempo de época Unix en milisegundos): un punto en el tiempo estrechamente relacionado con UTC.

*   **TimeSignal**: para casos de uso más avanzados de "hora actual". `TimeSignal` representa una transacción de sincronización de tiempo con un servidor de tiempo externo

*   **Ticker y Ticks**: estos permiten rastrear el tiempo transcurrido sin usar un reloj o sistema de mantenimiento de tiempo específico.