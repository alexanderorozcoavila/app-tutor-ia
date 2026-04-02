Aquí tienes el Documento de Diseño Técnico (TD) detallado para la implementación del entorno móvil controlado de Tutor IA. Este documento define la arquitectura, los componentes específicos y las interfaces necesarias para comenzar el desarrollo.

# Documento de Diseño Técnico (TD): Tutor IA Móvil (Launcher + Enforcer)

## 1. Arquitectura del Sistema
El sistema utiliza una arquitectura híbrida que combina el ecosistema de React Native para la capa de presentación y conexión a base de datos, con módulos nativos en Kotlin/Java para la interacción de bajo nivel con el sistema operativo Android.

**Patrón Arquitectónico:**
* **UI/Business Logic Layer:** React Native (TypeScript). Maneja la vista del Custom Launcher, autenticación, obtención de tareas y carga de evidencias.
* **Data Access Layer:** Supabase JS Client (`@supabase/supabase-js`). Comunicación directa con PostgreSQL (vía REST/PostgREST) y Supabase Storage.
* **OS Interoperability Layer:** React Native Bridge (JNI). Comunica las acciones de la UI con los servicios nativos de Android.
* **Native OS Layer:** Android Framework (Kotlin). Ejecuta el *Foreground Service*, intercepta Intents y dibuja *Overlays* usando `WindowManager`.

---

## 2. Definición del Stack y Dependencias

### 2.1. Entorno de Desarrollo
* **Framework Mobile:** React Native CLI (Versión 0.73+). *Nota estricta: No se puede utilizar Expo Go debido a la necesidad de crear y enlazar módulos nativos personalizados y alterar profundamente el `AndroidManifest.xml`. Se puede usar Expo prebuild (Custom Dev Client) si se prefiere su sistema de routing, pero el flujo "Bare" ofrece más control.*
* **Lenguajes:** TypeScript (React) + Kotlin (Módulos Nativos).
* **SDK Target:** Android API Level 34 (Android 14), con Minimum SDK 26 (Android 8.0).

### 2.2. Librerías Clave (React Native)
* `@supabase/supabase-js`: Cliente de base de datos y Auth.
* `react-native-vision-camera` o `expo-image-picker`: Captura de evidencias (alta performance).
* `react-native-fs`: Manejo de sistema de archivos local antes de subir a Supabase.
* `react-native-device-info`: Identificación única del dispositivo para auditoría.

---

## 3. Especificaciones del Módulo Nativo (Kotlin/Java)

Esta es la capa crítica que requiere desarrollo a medida fuera de React Native. Se compone de tres pilares:

### 3.1. Configuración del `AndroidManifest.xml`
Para que el SO reconozca la aplicación como un Launcher y permita los servicios de bloqueo, se deben definir explícitamente:

```xml
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" /> <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<application>
    <activity android:name=".MainActivity">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.HOME" />
            <category android:name="android.intent.category.DEFAULT" />
        </intent-filter>
    </activity>

    <service 
        android:name=".services.EnforcerService" 
        android:enabled="true" 
        android:exported="false"
        android:foregroundServiceType="specialUse" />
</application>
```

### 3.2. Enforcer Service (Monitor de Actividad)
Se debe implementar una clase `EnforcerService` que extienda de `Service`. Su ciclo de vida es infinito mientras el dispositivo esté encendido.

* **Mecanismo de Monitoreo:** Un bloque `Coroutine` o `HandlerThread` que se ejecuta cada `X` milisegundos (ej. 500ms).
* **Lectura de Estado:** Utiliza `UsageStatsManager` para consultar el paquete (package name) de la aplicación que se encuentra en el estado `MOVE_TO_FOREGROUND`.
* **Lista Blanca (Whitelist):** Un array en memoria constante que contiene los paquetes permitidos:
    * `com.tutor.ia` (Nuestra app)
    * `com.whatsapp`
    * `com.android.dialer` (o las variantes de los fabricantes como Samsung/Xiaomi).

### 3.3. Interceptor de Interfaz (Overlays)
Si el `EnforcerService` detecta un paquete fuera de la lista blanca (ej. `com.android.settings`), invoca al `WindowManager`.
* **Tipo de Ventana:** `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`.
* **Comportamiento:** Dibuja una vista (`View`) opaca que ocupa toda la pantalla.
* **Acción:** Un botón en esta vista ejecuta un *Intent* que fuerza a `com.tutor.ia` (el MainActivity) a volver al primer plano, colapsando la app restringida y cerrando el Overlay.

---

## 4. Interfaz de Comunicación (React Native Bridge)

La UI en React Native necesita interactuar con el módulo nativo. Se debe crear un `NativeModule` (ej. `TutorEnforcerModule`) que exponga los siguientes métodos a JavaScript:

* `checkPermissions()`: Retorna un objeto booleano indicando si el usuario ya concedió `USAGE_STATS` y `SYSTEM_ALERT_WINDOW`.
* `openPermissionSettings()`: Dispara los *Intents* hacia las pantallas de ajustes del sistema (`Settings.ACTION_USAGE_ACCESS_SETTINGS` y `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`) para que el administrador otorgue los permisos iniciales.
* `startEnforcerService()`: Inicia el servicio en primer plano.
* `stopEnforcerService(pin: string)`: Valida un PIN y destruye el servicio (Modo Escape).

---

## 5. Integración de Datos (Supabase)

El flujo de datos se manejará íntegramente desde la capa de React Native.

### 5.1. Esquema de Sincronización
La aplicación consultará la base de datos de PostgreSQL bajo el siguiente modelo relacional simplificado:

1.  **Tabla `tareas`**: `id`, `titulo`, `descripcion`, `tipo` (lectura, dictado, matemática), `estado` (pendiente, en_progreso, completado), `alumno_id`.
2.  **Tabla `evidencias`**: `id`, `tarea_id`, `url_archivo`, `fecha_subida`.

### 5.2. Carga de Evidencias (Storage Flow)
1.  React Native invoca la cámara (módulo nativo empaquetado por librerías de terceros).
2.  La imagen se guarda en caché: `file://path/to/cache/image.jpg`.
3.  Se lee el archivo como base64 o se transfiere como un `FormData` `Blob`.
4.  Se utiliza el cliente de Supabase para subir el binario:
    ```typescript
    const { data, error } = await supabase.storage
      .from('evidencias')
      .upload(`${alumno_id}/${tarea_id}/${filename}.jpg`, fileBody);
    ```
5.  Se genera el registro en la tabla `evidencias` con el path devuelto por Supabase Storage.

---

## 6. Consideraciones Críticas de Rendimiento y Sistema

* **Manejo de Memoria del Poller:** El ciclo `while` dentro del `EnforcerService` que llama a `UsageStatsManager` es intensivo. Si se implementa mal, causará *Memory Leaks* y el sistema operativo (especialmente capas como MIUI o OneUI) matará el servicio (OOM - Out of Memory). Debe ejecutarse en un hilo de fondo optimizado (ej. *Kotlin Coroutines* con `Dispatchers.IO`).
* **Gestión de Intents Nativos:** Para abrir WhatsApp sin salir del estado de "seguridad", React Native debe lanzar un Intent específico (`Linking.openURL('whatsapp://')`). El `EnforcerService` debe estar programado para ignorar la transición si el paquete de destino es `com.whatsapp`.
* **Restricción de Notificaciones:** Para evitar que el alumno baje la barra de notificaciones y acceda a Ajustes Rápidos (una fuga común), el MainActivity debe interceptar la pérdida de foco (`onWindowFocusChanged`) en Android puro y colapsar el panel de notificaciones programáticamente enviando un Intent broadcast (`Intent.ACTION_CLOSE_SYSTEM_DIALOGS`).

http://googleusercontent.com/interactive_content_block/0