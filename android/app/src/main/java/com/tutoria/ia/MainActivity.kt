package com.tutoria.ia

import android.app.ActivityManager
import android.app.role.RoleManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    companion object {
        private const val REQUEST_ROLE_HOME = 1001
    }

    override fun getMainComponentName(): String = "TutorIaMobile"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Al crear la actividad, solicitar ser el launcher predeterminado
        checkAndRequestDefaultLauncher()
    }

    override fun onResume() {
        super.onResume()
        // Verificar en cada resume (por si el usuario cambió el launcher)
        checkAndRequestDefaultLauncher()
    }

    /**
     * Verifica si esta app es el launcher predeterminado del sistema.
     * Si no lo es, abre el diálogo del sistema para que el usuario la seleccione.
     *
     * Android 10+ (API 29+): Usa RoleManager.ROLE_HOME (API oficial)
     * Android 9 y abajo: Abre ACTION_HOME_SETTINGS manualmente
     */
    private fun checkAndRequestDefaultLauncher() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager != null && !roleManager.isRoleHeld(RoleManager.ROLE_HOME)) {
                Log.d("TutorLauncher", "Solicitando rol de Launcher predeterminado...")
                try {
                    val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_HOME)
                    startActivityForResult(intent, REQUEST_ROLE_HOME)
                } catch (e: Exception) {
                    Log.e("TutorLauncher", "Error al solicitar rol HOME: ${e.message}")
                }
            }
        }
        // En Android 9 e inferior, el sistema muestra el selector automáticamente
        // cuando múltiples apps tienen la categoría HOME declarada en el manifest.
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_ROLE_HOME) {
            if (resultCode == RESULT_OK) {
                Log.d("TutorLauncher", "✅ Tutor IA establecida como launcher predeterminado")
            } else {
                Log.w("TutorLauncher", "⚠️ El usuario no aceptó el cambio de launcher")
            }
        }
    }
}
