Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 4: Desarrollo del Motor Nativo (EnforcerService)**.

El objetivo de esta fase es programar el "guardia de seguridad" de la aplicación. Crearemos un servicio en Android escrito en Kotlin que vivirá de forma permanente mientras el teléfono esté encendido (Foreground Service) y estará consultando continuamente al sistema operativo para saber qué aplicación está intentando usar el alumno.

---

### FASE 4: Desarrollo del Motor Nativo (EnforcerService en Kotlin)

**Ruta base de trabajo:** `android/app/src/main/java/com/tutoriamobile/` (Asegúrate de que el nombre del paquete `com.tutoriamobile` coincida con el que definiste al crear el proyecto en la Fase 1).

#### Paso 4.1: Creación de la Estructura del Servicio
Crea un nuevo archivo llamado `EnforcerService.kt` en el mismo directorio donde se encuentra tu `MainActivity.kt`.

* **Estructura base:**
    ```kotlin
    package com.tutoriamobile // Reemplaza por tu package name real

    import android.app.Service
    import android.content.Intent
    import android.os.IBinder
    import kotlinx.coroutines.*

    class EnforcerService : Service() {
        // Scope para manejar el bucle en un hilo secundario y evitar bloquear la UI
        private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
        private var isRunning = false

        override fun onBind(intent: Intent?): IBinder? {
            // No permitimos binding directo desde otras apps, solo ejecución iniciada
            return null
        }

        override fun onDestroy() {
            super.onDestroy()
            isRunning = false
            serviceScope.cancel() // Limpieza de memoria crítica
        }
    }
    ```

#### Paso 4.2: Implementación de la Notificación Persistente (Requisito de Android)
A partir de Android 8.0, el sistema operativo mata rápidamente los servicios en segundo plano a menos que se declaren como `Foreground Service`. Para ello, es obligatorio mostrar una notificación fija que informe al usuario que la app está corriendo.

* **Modificación en `EnforcerService.kt`:** Añade el siguiente código para configurar el canal de notificaciones y lanzar el servicio en primer plano al iniciar.

    ```kotlin
    import android.app.Notification
    import android.app.NotificationChannel
    import android.app.NotificationManager
    import android.os.Build
    import androidx.core.app.NotificationCompat

    // ... (dentro de la clase EnforcerService)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            startForegroundServiceNotification()
            isRunning = true
            startMonitoringLoop()
        }
        // START_STICKY asegura que si el SO mata el servicio por falta de RAM, lo reinicie
        return START_STICKY 
    }

    private fun startForegroundServiceNotification() {
        val channelId = "TutorEnforcerChannel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Control de Entorno Educativo",
                NotificationManager.IMPORTANCE_LOW // Low para que no haga ruido ni vibre
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Tutor IA Activo")
            .setContentText("Entorno de estudio protegido en ejecución.")
            .setSmallIcon(android.R.drawable.ic_secure) // Cambiar luego por el icono de tu app
            .setOngoing(true) // Evita que el usuario la borre deslizando
            .build()

        // El ID 1 no puede ser 0
        startForeground(1, notification)
    }
    ```

#### Paso 4.3 y 4.4: El Bucle de Monitoreo y `UsageStatsManager`
Aquí reside el núcleo duro de la aplicación. Un bucle infinito consultará cada 500 milisegundos qué aplicación está abierta en la pantalla.

Dado que la API antigua `ActivityManager.getRunningTasks` fue bloqueada por Google por motivos de privacidad, la única forma moderna de hacer esto es leyendo los eventos del sistema con `UsageStatsManager`.

* **Modificación en `EnforcerService.kt`:** Implementa la lógica de escaneo.

    ```kotlin
    import android.app.usage.UsageEvents
    import android.app.usage.UsageStatsManager
    import android.content.Context

    // ... (dentro de la clase EnforcerService)

    private fun startMonitoringLoop() {
        serviceScope.launch {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            while (isRunning && isActive) {
                val currentForegroundApp = getForegroundPackageName(usageStatsManager)
                
                if (currentForegroundApp != null) {
                    evaluatePackage(currentForegroundApp)
                }
                
                delay(500) // Escaneo ultra rápido, ajustable según impacto en batería
            }
        }
    }

    private fun getForegroundPackageName(usageStatsManager: UsageStatsManager): String? {
        var foregroundPackage: String? = null
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 2000 // Buscar eventos de los últimos 2 segundos
        
        val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        
        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            // ACTIVITY_RESUMED indica que la app acaba de pasar al frente (es visible)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                foregroundPackage = event.packageName
            }
        }
        return foregroundPackage
    }
    ```

#### Paso 4.5: La "Lista Blanca" (Whitelist) y el Gatillo
Una vez que sabemos qué paquete está en primer plano, lo evaluamos contra nuestra lista de aplicaciones permitidas. Si no está, disparamos el mecanismo de bloqueo (que se dibujará en la Fase 5).

* **Modificación en `EnforcerService.kt`:**

    ```kotlin
    import android.util.Log

    // ... (dentro de la clase EnforcerService)

    // Ajusta tu package name de la app aquí
    private val WHITELIST = listOf(
        "com.tutoriamobile", 
        "com.whatsapp",
        "com.whatsapp.w4b", // WhatsApp Business
        "com.android.dialer", // Marcador de Google puro
        "com.samsung.android.dialer", // Marcador de Samsung
        "com.android.server.telecom" // Interfaz de llamada en curso
    )

    private fun evaluatePackage(packageName: String) {
        if (!WHITELIST.contains(packageName)) {
            Log.w("TutorEnforcer", "¡FUGA DETECTADA! Bloqueando paquete: $packageName")
            
            // TODO: (FASE 5) Aquí invocaremos al WindowManager para dibujar el Overlay
            // triggerLockScreenOverlay(packageName)
        }
    }
    ```

**Consideración vital de ingeniería:** Este código asumirá que el usuario ya aprobó el permiso de "Acceso a datos de uso" en la configuración de Android. En React Native, será tu responsabilidad validar que este permiso esté concedido antes de hacer la llamada JNI para ejecutar este servicio (Fase 6). Si ejecutas este código sin el permiso nativo, `usageStatsManager.queryEvents` simplemente devolverá una lista vacía y no detectarás ninguna app.

http://googleusercontent.com/interactive_content_block/0