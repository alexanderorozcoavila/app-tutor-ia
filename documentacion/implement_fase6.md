Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 6: React Native Bridge**.

El objetivo de esta fase es construir el puente de comunicación (JNI - Java Native Interface) entre el código nativo de Android que creamos en las Fases 4 y 5 (el servicio de bloqueo) y el entorno de JavaScript/TypeScript de React Native. Sin este puente, la interfaz de usuario no podría saber si el alumno otorgó los permisos ni podría activar el "Modo Estudio".

---

### FASE 6: React Native Bridge (Módulo Nativo)

**Ruta base de trabajo:** `android/app/src/main/java/com/tutoriamobile/`

#### Paso 6.1 y 6.2: Creación del Módulo Nativo y Validación de Permisos
Debemos crear una clase que herede de `ReactContextBaseJavaModule`. Aquí expondremos métodos asíncronos (`Promises`) para que TypeScript los pueda invocar con `await`.

* **Crear archivo:** `TutorEnforcerModule.kt`
* **Implementación de validación:** Debido a la naturaleza estricta de Android, los permisos de "Estadísticas de Uso" y "Superposición" no se piden con cuadros de diálogo normales, sino que requieren validar `AppOpsManager` y `Settings`.

```kotlin
package com.tutoriamobile // Asegúrate de usar tu package name

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TutorEnforcerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "TutorEnforcerModule" // Este es el nombre que buscaremos en JavaScript
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // 1. Validar Permiso de Overlay (Superposición)
            val hasOverlay = Settings.canDrawOverlays(context)

            // 2. Validar Permiso de Usage Stats (Estadísticas de uso)
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
            }
            val hasUsageStats = mode == AppOpsManager.MODE_ALLOWED

            // Retornamos un objeto con el detalle exacto para que la UI sepa qué pedir
            val result = com.facebook.react.bridge.Arguments.createMap().apply {
                putBoolean("hasOverlay", hasOverlay)
                putBoolean("hasUsageStats", hasUsageStats)
                putBoolean("allGranted", hasOverlay && hasUsageStats)
            }
            promise.resolve(result)

        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message)
        }
    }
```

#### Paso 6.3: Métodos para Solicitar Permisos
Si `checkPermissions` retorna `false`, necesitamos que React Native pueda abrir las pantallas nativas de ajustes del sistema para que el administrador otorgue el acceso manualmente.

* **Añadir a `TutorEnforcerModule.kt`:**

```kotlin
    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (!Settings.canDrawOverlays(reactApplicationContext)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactApplicationContext.packageName}")
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("OVERLAY_REQUEST_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("USAGE_STATS_REQUEST_ERROR", e.message)
        }
    }
```

#### Paso 6.4: Controladores del Servicio (Start/Stop)
Estos métodos encenderán y apagarán el `EnforcerService` (el bucle de monitoreo) desde la interfaz de la aplicación.

* **Añadir a `TutorEnforcerModule.kt`:**

```kotlin
    @ReactMethod
    fun startEnforcerService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, EnforcerService::class.java)
            // ContextCompat asegura compatibilidad con los requerimientos de Foreground de Android 8+
            ContextCompat.startForegroundService(reactApplicationContext, intent)
            promise.resolve("Service Started")
        } catch (e: Exception) {
            promise.reject("SERVICE_START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopEnforcerService(pin: String, promise: Promise) {
        // Validación básica de PIN (En producción debería validarse contra Supabase o Keychain local)
        if (pin == "1234") { 
            try {
                val intent = Intent(reactApplicationContext, EnforcerService::class.java)
                reactApplicationContext.stopService(intent)
                promise.resolve("Service Stopped")
            } catch (e: Exception) {
                promise.reject("SERVICE_STOP_ERROR", e.message)
            }
        } else {
            promise.reject("INVALID_PIN", "El PIN ingresado es incorrecto.")
        }
    }
} // Fin de la clase
```

#### Paso 6.5: Empaquetado y Registro del Módulo Nativo
React Native necesita que empaqueto este módulo para inyectarlo en el contexto de la aplicación al arrancar.

* **Crear archivo:** `TutorEnforcerPackage.kt` en la misma carpeta.

```kotlin
package com.tutoriamobile

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class TutorEnforcerPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(TutorEnforcerModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList() // No estamos creando componentes visuales nativos, solo lógica
    }
}
```

* **Registrar en `MainApplication.kt`:**
Abre `android/app/src/main/java/com/tutoriamobile/MainApplication.kt`, busca la función `getPackages()` y añade tu nuevo paquete a la lista:

```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        // Packages that cannot be autolinked yet can be added manually here
        add(TutorEnforcerPackage()) // <--- AÑADIR ESTA LÍNEA
    }
```

#### Paso 6.6: Definición en TypeScript (Lado Frontend)
Para consumir este código nativo limpiamente sin errores de tipado, crea un archivo de definición en tu código React Native.

* **Crear archivo:** `src/native/TutorEnforcer.ts`

```typescript
import { NativeModules } from 'react-native';

const { TutorEnforcerModule } = NativeModules;

export interface PermissionStatus {
  hasOverlay: boolean;
  hasUsageStats: boolean;
  allGranted: boolean;
}

export const TutorEnforcer = {
  checkPermissions: (): Promise<PermissionStatus> => {
    return TutorEnforcerModule.checkPermissions();
  },
  requestOverlayPermission: (): Promise<boolean> => {
    return TutorEnforcerModule.requestOverlayPermission();
  },
  requestUsageStatsPermission: (): Promise<boolean> => {
    return TutorEnforcerModule.requestUsageStatsPermission();
  },
  startService: (): Promise<string> => {
    return TutorEnforcerModule.startEnforcerService();
  },
  stopService: (pin: string): Promise<string> => {
    return TutorEnforcerModule.stopEnforcerService(pin);
  }
};
```

---

Con esto completado, la aplicación React Native tiene control total sobre el motor de bloqueo nativo, permitiéndote construir la interfaz del Dashboard (Fase 7) reaccionando al estado real del dispositivo.

http://googleusercontent.com/interactive_content_block/0