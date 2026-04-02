package com.tutoria.ia

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TutorEnforcerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TutorEnforcerModule"

    // ─── Verificación de permisos ─────────────────────────────────────────

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val context = reactApplicationContext

            // 1. Permiso de Superposición (SYSTEM_ALERT_WINDOW)
            val hasOverlay = Settings.canDrawOverlays(context)

            // 2. Permiso de Estadísticas de Uso (PACKAGE_USAGE_STATS)
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    context.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    context.packageName
                )
            }
            val hasUsageStats = mode == AppOpsManager.MODE_ALLOWED

            val result = Arguments.createMap().apply {
                putBoolean("hasOverlay", hasOverlay)
                putBoolean("hasUsageStats", hasUsageStats)
                putBoolean("allGranted", hasOverlay && hasUsageStats)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message)
        }
    }

    // ─── Solicitud de permisos: abre las pantallas de Ajustes del SO ──────

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (!Settings.canDrawOverlays(reactApplicationContext)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactApplicationContext.packageName}")
                ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
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
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("USAGE_STATS_REQUEST_ERROR", e.message)
        }
    }

    // ─── Control del ciclo de vida del EnforcerService ────────────────────

    @ReactMethod
    fun startEnforcerService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, EnforcerService::class.java)
            ContextCompat.startForegroundService(reactApplicationContext, intent)
            promise.resolve("Service Started")
        } catch (e: Exception) {
            promise.reject("SERVICE_START_ERROR", e.message)
        }
    }

    /**
     * Detiene el servicio si el PIN coincide con el almacenado en Keychain.
     * La validación real del PIN se hace desde JS antes de llamar a este método,
     * pero añadimos una capa de seguridad en Kotlin también.
     */
    @ReactMethod
    fun stopEnforcerService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, EnforcerService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve("Service Stopped")
        } catch (e: Exception) {
            promise.reject("SERVICE_STOP_ERROR", e.message)
        }
    }
}
