package com.tutoria.ia

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * BroadcastReceiver que escucha el evento BOOT_COMPLETED.
 * Cuando el dispositivo se reinicia, Android lanza este receptor
 * automáticamente, el cual reinicia el EnforcerService para mantener
 * el modo kiosk activo sin intervención del usuario.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {

            Log.d("TutorEnforcer", "BootReceiver: dispositivo iniciado, lanzando EnforcerService...")

            val serviceIntent = Intent(context, EnforcerService::class.java)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Android 8+: obligatorio usar startForegroundService
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }

            // También lanzar la MainActivity para que el alumno vea el launcher
            val mainIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(mainIntent)
        }
    }
}
