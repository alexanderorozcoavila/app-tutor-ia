Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 5: Mecanismo de Bloqueo**.

El objetivo de esta fase es materializar la restricción. Cuando el bucle de la Fase 4 detecta que el alumno ha intentado abrir una aplicación no autorizada (como Ajustes, Chrome o YouTube), el sistema debe reaccionar inmediatamente dibujando una pantalla sobre la aplicación prohibida y obligando al alumno a volver al entorno de Tutor IA.

---

### FASE 5: Mecanismo de Bloqueo (Overlays y Redirección)

**Archivo a modificar:** `android/app/src/main/java/com/tutoriamobile/EnforcerService.kt`

#### Paso 5.1: Preparación del WindowManager y Estado
Para dibujar fuera de la aplicación de React Native, necesitamos usar el servicio del sistema `WindowManager` y definir un estado para no dibujar múltiples pantallas de bloqueo si el escáner se ejecuta varias veces mientras el alumno sigue fuera de la app.

* **Modificación en `EnforcerService.kt`:**
    ```kotlin
    import android.graphics.PixelFormat
    import android.view.Gravity
    import android.view.WindowManager
    import android.view.View
    import android.graphics.Color
    import android.widget.LinearLayout
    import android.widget.TextView
    import android.widget.Button

    // ... (dentro de la clase EnforcerService)

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayShowing = false

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }
    ```

#### Paso 5.2: Creación de la Vista de Bloqueo (UI Programática)
Para mantener el código encapsulado y no depender de archivos XML de recursos que pueden entrar en conflicto con React Native, crearemos la interfaz de la pantalla de bloqueo programáticamente en Kotlin.

* **Modificación en `EnforcerService.kt`:** Añade la función para construir la vista.
    ```kotlin
    private fun createOverlayView(): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#1E293B")) // Color oscuro, estilo Tutor IA
            setPadding(50, 50, 50, 50)
        }

        val warningText = TextView(this).apply {
            text = "Acción restringida\nEs hora de concentrarse en tus tareas."
            textSize = 24f
            setTextColor(Color.WHITE)
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            setPadding(0, 0, 0, 60)
        }

        val returnButton = Button(this).apply {
            text = "Volver a Tutor IA"
            setBackgroundColor(Color.parseColor("#3B82F6")) // Azul primario
            setTextColor(Color.WHITE)
            textSize = 18f
            setOnClickListener {
                removeOverlayAndGoHome()
            }
        }

        layout.addView(warningText)
        layout.addView(returnButton)

        return layout
    }
    ```

#### Paso 5.3: Dibujar el Overlay (El Gatillo)
Debemos conectar la detección de fuga (Fase 4) con el `WindowManager`. 

**Consideración vital de ingeniería:** El bucle de monitoreo de la Fase 4 corre en un hilo secundario (`Dispatchers.IO`). Sin embargo, en Android, **toda modificación de la Interfaz de Usuario (UI) debe hacerse en el Hilo Principal (Main Thread)**. Si no cambiamos de contexto, la app sufrirá un *crash* inmediato.

* **Modificación en `EnforcerService.kt`:** Reemplaza el comentario del método `evaluatePackage` (de la Fase 4) y añade la lógica de renderizado.
    ```kotlin
    private fun evaluatePackage(packageName: String) {
        if (!WHITELIST.contains(packageName)) {
            if (!isOverlayShowing) {
                // Cambiar al hilo principal para dibujar la UI
                serviceScope.launch(Dispatchers.Main) {
                    showLockScreenOverlay()
                }
            }
        } else {
            // Si el usuario vuelve a una app permitida (ej. WhatsApp), quitamos el bloqueo por si quedó colgado
            if (isOverlayShowing) {
                serviceScope.launch(Dispatchers.Main) {
                    removeOverlayView()
                }
            }
        }
    }

    private fun showLockScreenOverlay() {
        if (isOverlayShowing) return

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            // TYPE_APPLICATION_OVERLAY es el único permitido en Android moderno para dibujar sobre otras apps
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            // FLAG_NOT_FOCUSABLE evita que el teclado de Android se bloquee debajo de esta vista
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )

        overlayView = createOverlayView()
        windowManager?.addView(overlayView, params)
        isOverlayShowing = true
    }
    ```

#### Paso 5.4: Forzar el Regreso (El Intent de Rescate)
Cuando el alumno pulsa el botón "Volver a Tutor IA" en la pantalla de bloqueo, debemos quitar la vista superpuesta y lanzar un *Intent* nativo que traiga la interfaz de React Native (`MainActivity`) de nuevo al frente, aplastando la aplicación no autorizada.

* **Modificación en `EnforcerService.kt`:**
    ```kotlin
    private fun removeOverlayAndGoHome() {
        removeOverlayView()

        // Crear Intent explícito hacia el MainActivity (nuestro Custom Launcher de React Native)
        val intent = Intent(this, MainActivity::class.java).apply {
            // Estos flags aseguran que no se cree una nueva instancia de la app, 
            // sino que se traiga la actual al frente, limpiando cualquier sub-pantalla.
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        
        startActivity(intent)
    }

    private fun removeOverlayView() {
        if (isOverlayShowing && overlayView != null) {
            try {
                windowManager?.removeView(overlayView)
            } catch (e: Exception) {
                // Prevenir crash si la vista ya fue removida por el SO
                e.printStackTrace() 
            }
            overlayView = null
            isOverlayShowing = false
        }
    }
    ```

---

Con este código, el "Guardia" no solo vigila, sino que actúa físicamente secuestrando la pantalla cuando el entorno de estudio es vulnerado, cumpliendo exactamente con la premisa de la **Opción B (Locker + Launcher)**.

http://googleusercontent.com/interactive_content_block/0