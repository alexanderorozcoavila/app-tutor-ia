package com.tutoria.ia

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class EnforcerService : Service() {

    // ─── Coroutine scope para el hilo de monitoreo (IO) ─────────────────────
    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private var isRunning = false

    // ─── Referencias para el overlay de bloqueo ──────────────────────────────
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayShowing = false

    // ─── Lista blanca: paquetes autorizados ──────────────────────────────────
    private val WHITELIST = setOf(
        "com.tutoria.ia",                   // Nuestra app (launcher)
        // ── WhatsApp ──────────────────────────────────────────────────────────
        "com.whatsapp",
        "com.whatsapp.w4b",                 // WhatsApp Business
        // ── Teléfono / Llamadas (Motorola G35 + Android stock) ───────────────
        "com.android.dialer",               // Marcador stock Android
        "com.android.server.telecom",       // Motor de llamadas del sistema
        "com.android.phone",                // App de teléfono base
        "com.motorola.dialer",              // Marcador Motorola
        "com.google.android.dialer",        // Marcador Google (si aplica)
        // ── System UI / interfaz del sistema ─────────────────────────────────
        "com.android.systemui",             // Barra de estado, notificaciones
        "com.android.incallui",             // UI de llamada en curso (AOSP)
        "com.motorola.incallui",            // UI de llamada Motorola
        // ── Launcher de seguridad (fallback) ─────────────────────────────────
        "com.motorola.launcher3",           // Launcher stock Motorola
    )


    // ─── Ciclo de vida del servicio ───────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        Log.d("TutorEnforcer", "EnforcerService onCreate")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            startForegroundNotification()
            isRunning = true
            startMonitoringLoop()
        }
        // START_STICKY: el SO reiniciará el servicio si lo mata por falta de RAM
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        serviceScope.cancel()
        removeOverlayView()
        Log.d("TutorEnforcer", "EnforcerService destruido")
    }

    // ─── Notificación persistente (requerida por Android 8+ para Foreground) ──

    private fun startForegroundNotification() {
        val channelId = "TutorEnforcerChannel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Control de Entorno Educativo",
                NotificationManager.IMPORTANCE_LOW  // Sin sonido ni vibración
            ).apply {
                description = "Tutor IA está protegiendo el dispositivo"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Tutor IA Activo")
            .setContentText("Entorno de estudio protegido en ejecución.")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)       // El usuario no puede deslizarla para cerrarla
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(1, notification)
    }

    // ─── Bucle de monitoreo principal ────────────────────────────────────────

    private fun startMonitoringLoop() {
        serviceScope.launch {
            val usageStatsManager =
                getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            while (isRunning && isActive) {
                val currentApp = getForegroundPackageName(usageStatsManager)
                evaluatePackage(currentApp)
                delay(500)
            }
        }
    }

    private fun getForegroundPackageName(usm: UsageStatsManager): String? {
        var foregroundPackage: String? = null
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 2000   // Buscamos eventos de los últimos 2 segundos

        val usageEvents = usm.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                foregroundPackage = event.packageName
            }
        }

        return foregroundPackage
    }

    // ─── Lógica de evaluación y activación del bloqueo ───────────────────────

    /**
     * Evalúa la app en primer plano:
     * - null: la app fue cerrada desde recientes → relanzar nuestra app (efecto kiosk)
     * - en whitelist: quitar overlay si está mostrándose
     * - fuera de whitelist: mostrar overlay de bloqueo
     */
    private fun evaluatePackage(packageName: String?) {
        if (packageName == null) {
            // La app fue swipeada desde recientes o el sistema la cerró
            Log.d("TutorEnforcer", "App cerrada — relanzando Tutor IA...")
            serviceScope.launch(Dispatchers.Main) {
                if (isOverlayShowing) removeOverlayView()
                relaunchMainApp()
            }
            return
        }

        if (!WHITELIST.contains(packageName)) {
            if (!isOverlayShowing) {
                Log.w("TutorEnforcer", "¡FUGA DETECTADA! Bloqueando: $packageName")
                serviceScope.launch(Dispatchers.Main) {
                    showLockScreenOverlay()
                }
            }
        } else {
            // Si el usuario vuelve a una app permitida, quitamos el overlay
            if (isOverlayShowing) {
                serviceScope.launch(Dispatchers.Main) {
                    removeOverlayView()
                }
            }
        }
    }

    /** Relanza el MainActivity trayéndolo al frente (efecto kiosk). */
    private fun relaunchMainApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            )
        }
        try {
            startActivity(intent)
        } catch (e: Exception) {
            Log.e("TutorEnforcer", "Error al relanzar app: ${e.message}")
        }
    }


    // ─── Overlay de bloqueo ──────────────────────────────────────────────────

    private fun createOverlayView(): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0F172A"))  // Azul muy oscuro (Tutor IA brand)
            setPadding(64, 64, 64, 64)
        }

        val emojiText = TextView(this).apply {
            text = "🔒"
            textSize = 56f
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setPadding(0, 0, 0, 24)
        }

        val warningTitle = TextView(this).apply {
            text = "Acción restringida"
            textSize = 28f
            setTextColor(Color.WHITE)
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setPadding(0, 0, 0, 12)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }

        val warningBody = TextView(this).apply {
            text = "Es hora de concentrarse\nen tus tareas. 📚"
            textSize = 18f
            setTextColor(Color.parseColor("#94A3B8"))
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setPadding(0, 0, 0, 60)
            setLineSpacing(8f, 1f)
        }

        val returnButton = Button(this).apply {
            text = "Volver a Tutor IA"
            setBackgroundColor(Color.parseColor("#3B82F6"))   // Azul primario
            setTextColor(Color.WHITE)
            textSize = 18f
            setPadding(48, 24, 48, 24)
            setOnClickListener { removeOverlayAndGoHome() }
        }

        layout.addView(emojiText)
        layout.addView(warningTitle)
        layout.addView(warningBody)
        layout.addView(returnButton)

        return layout
    }

    private fun showLockScreenOverlay() {
        if (isOverlayShowing) return

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )

        overlayView = createOverlayView()
        windowManager?.addView(overlayView, params)
        isOverlayShowing = true
    }

    private fun removeOverlayAndGoHome() {
        removeOverlayView()

        // Intent explícito para traer el MainActivity al frente
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
        }
        startActivity(intent)
    }

    private fun removeOverlayView() {
        if (isOverlayShowing && overlayView != null) {
            try {
                windowManager?.removeView(overlayView)
            } catch (e: Exception) {
                Log.e("TutorEnforcer", "Error al remover overlay: ${e.message}")
            }
            overlayView = null
            isOverlayShowing = false
        }
    }
}
