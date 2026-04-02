Este es un plan de implementación estructurado en **fases atómicas**, diseñado específicamente para que puedas dárselo a un agente de IA (como Cursor, GitHub Copilot Workspace, o Devin) como un prompt estructurado o un archivo `.cursorrules` / `.md`. 

Al estar dividido en pasos discretos, la IA podrá mantener el contexto sin alucinar, ejecutando el código nativo de Android y conectándose a tu base de datos existente de `tutor-ia`.

---

# Plan de Ejecución para IA: Tutor IA Móvil (Android Launcher + Locker)

**Instrucción General para el Agente:** Ejecuta este plan de forma secuencial. No avances al siguiente paso sin haber confirmado la compilación y el éxito del paso anterior. El proyecto debe ser React Native CLI (Bare Workflow) en TypeScript, integrando código nativo en Kotlin.

## FASE 1: Inicialización y Dependencias Core
**Objetivo:** Levantar el esqueleto del proyecto sin frameworks restrictivos como Expo Go.

* **Paso 1.1:** Inicializar un nuevo proyecto de React Native usando TypeScript: `npx react-native@latest init TutorIaMobile --template react-native-template-typescript`.
* **Paso 1.2:** Instalar las dependencias core de navegación y almacenamiento seguro: `react-native-keychain` (para tokens) y `react-native-fs`.
* **Paso 1.3:** Instalar las dependencias de la cámara: `react-native-vision-camera` (o la librería más estable compatible con la versión de RN instalada).
* **Paso 1.4:** Ejecutar el build inicial en Android (`npm run android`) para asegurar que el entorno de Gradle está sano antes de añadir código nativo.

## FASE 2: Conexión al Backend (Base de Datos Existente `tutor-ia`)
**Objetivo:** Conectar la app móvil a la misma instancia de Supabase que usa el proyecto web.

* **Paso 2.1:** Instalar dependencias de backend: `npm install @supabase/supabase-js`.
* **Paso 2.2:** Crear un archivo `src/lib/supabase.ts` para inicializar el cliente usando variables de entorno (`.env`).
* **Paso 2.3:** Crear un script o servicio en `src/services/tareas.ts` que consulte la tabla `tareas` de Supabase. **Contexto para la IA:** Asumir que la tabla ya existe y tiene campos como `id`, `titulo`, `descripcion`, `estado`. No intentar ejecutar migraciones SQL.
* **Paso 2.4:** Implementar el servicio `src/services/evidencias.ts` para subir archivos al *bucket* de Supabase Storage y registrar la URL en la tabla `evidencias`.

## FASE 3: Modificación del Android Manifest (Modo Launcher y Permisos)
**Objetivo:** Configurar la app a nivel de SO para que pueda secuestrar la pantalla de inicio y monitorear el uso.

* **Paso 3.1:** Editar `android/app/src/main/AndroidManifest.xml`. Añadir los siguientes permisos antes del tag `<application>`:
    * `android.permission.PACKAGE_USAGE_STATS` (ignorando advertencias de protección).
    * `android.permission.SYSTEM_ALERT_WINDOW`
    * `android.permission.FOREGROUND_SERVICE`
    * `android.permission.FOREGROUND_SERVICE_SPECIAL_USE`
* **Paso 3.2:** Modificar el `MainActivity` en el Manifest para declararlo como Launcher. Añadir las categorías `HOME` y `DEFAULT` al `intent-filter`.
* **Paso 3.3:** Declarar el servicio `EnforcerService` dentro del tag `<application>`.

## FASE 4: Desarrollo del Motor Nativo (EnforcerService en Kotlin)
**Objetivo:** Crear el guardia de seguridad en segundo plano que vigila las aplicaciones.

* **Paso 4.1:** Crear el archivo `EnforcerService.kt`. Extender de `Service`.
* **Paso 4.2:** Implementar la notificación persistente requerida por Android para los *Foreground Services*. El servicio debe iniciarse como `startForeground`.
* **Paso 4.3:** Implementar un bucle (usando `Coroutines` y `Dispatchers.IO`) que se ejecute cada 500ms.
* **Paso 4.4:** Dentro del bucle, instanciar `UsageStatsManager`. Obtener el nombre del paquete de la aplicación que está actualmente en primer plano.
* **Paso 4.5:** Definir una "Lista Blanca" (`whitelist`) en código conteniendo: `com.tutor.ia` (o el paquete que se defina), `com.whatsapp`, y el paquete estándar de llamadas (`com.android.dialer`).

## FASE 5: Mecanismo de Bloqueo (Overlays en Kotlin)
**Objetivo:** Reaccionar si el usuario sale de la lista blanca.

* **Paso 5.1:** Modificar `EnforcerService.kt`. Si la aplicación detectada en el Paso 4.4 NO está en la lista blanca, invocar a `WindowManager`.
* **Paso 5.2:** Dibujar un `View` superpuesto en toda la pantalla utilizando el tipo `TYPE_APPLICATION_OVERLAY`. Este View debe ser opaco y mostrar un mensaje de bloqueo.
* **Paso 5.3:** Añadir un evento de toque (`OnClickListener`) al View bloqueador que envíe un *Intent* explícito para lanzar el `MainActivity` de la app, forzando al usuario a volver al Launcher de Tutor IA, y remover el View del WindowManager.

## FASE 6: React Native Bridge (JNI)
**Objetivo:** Permitir que la interfaz controle al servicio nativo.

* **Paso 6.1:** Crear `TutorEnforcerModule.kt`. Heredar de `ReactContextBaseJavaModule`.
* **Paso 6.2:** Exponer una función `checkPermissions` hacia JS que valide si `AppOpsManager` ha concedido el acceso a `USAGE_STATS` y `SYSTEM_ALERT_WINDOW`.
* **Paso 6.3:** Exponer una función `requestPermissions` que abra los *Intents* de ajustes nativos (`Settings.ACTION_USAGE_ACCESS_SETTINGS` y `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`).
* **Paso 6.4:** Exponer las funciones `startService` y `stopService(pin)` para controlar el ciclo de vida del `EnforcerService`.
* **Paso 6.5:** Registrar el módulo en un nuevo `TutorEnforcerPackage.kt` y agregarlo al `MainApplication.kt`.

## FASE 7: Desarrollo de la Interfaz (Custom Launcher Dashboard)
**Objetivo:** Construir la experiencia de usuario que el alumno verá al desbloquear el teléfono.

* **Paso 7.1:** En `App.tsx`, implementar la pantalla de "Permisos Requeridos". Esta pantalla bloqueará el acceso a la app hasta que `TutorEnforcerModule.checkPermissions()` retorne `true`.
* **Paso 7.2:** Desarrollar el *Dashboard*. Consultar y renderizar las tareas pendientes desde Supabase usando el servicio creado en la Fase 2.
* **Paso 7.3:** Implementar botones grandes para "WhatsApp" y "Llamadas" utilizando `Linking.openURL('whatsapp://')` y `Linking.openURL('tel:')`.
* **Paso 7.4:** Asegurar que la función `TutorEnforcerModule.startService()` se dispare automáticamente al cargar el Dashboard si los permisos están concedidos.

## FASE 8: Ejecución de Tareas y Evidencias
**Objetivo:** Completar el ciclo de uso del alumno.

* **Paso 8.1:** Crear la pantalla de "Detalle de Tarea".
* **Paso 8.2:** Integrar el componente de la cámara (`react-native-vision-camera`). Implementar un botón para tomar foto.
* **Paso 8.3:** Conectar la imagen capturada con la función de subida a Supabase Storage (creada en la Fase 2) y cambiar el estado de la tarea a `completado` en la base de datos PostgreSQL.

---

http://googleusercontent.com/interactive_content_block/0