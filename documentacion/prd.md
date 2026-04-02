Aquí tienes el Documento de Requerimientos de Producto (PRD) detallado para la aplicación móvil de Tutor IA, integrando la arquitectura híbrida (Launcher + Locker) y la conexión con el backend existente.

# Documento de Requerimientos de Producto (PRD)
**Proyecto:** Tutor IA - Entorno Móvil Controlado
**Plataforma:** Android (Exclusivo, debido a las restricciones de SO requeridas para Launchers y Lockers)
**Fase:** Desarrollo de MVP Móvil

---

## 1. Visión y Objetivos del Producto
El objetivo es trasladar la experiencia de aprendizaje estructurado de la plataforma web de Tutor IA a dispositivos móviles Android. La aplicación debe permitir a los alumnos acceder a sus tareas, interactuar con la IA y subir evidencias, al mismo tiempo que transforma el dispositivo en una herramienta de uso exclusivo educativo. Esto se logra secuestrando la pantalla de inicio (Custom Launcher) y bloqueando proactivamente cualquier intento de evasión hacia aplicaciones no autorizadas (App Locker).

---

## 2. Alcance (In-Scope)
* **Módulo Educativo:** Autenticación de alumnos, visualización de tareas asignadas, ejecución de ejercicios y carga de evidencias (fotos/archivos).
* **Módulo de Control de Entorno:** Funcionalidad de Custom Launcher para reemplazar la pantalla de inicio por defecto del SO.
* **Módulo de Seguridad (Enforcer):** Servicio en segundo plano para monitorear e interceptar la apertura de aplicaciones no permitidas (ej. Ajustes, Navegadores).
* **Integración de Comunicaciones:** Acceso directo y exclusivo a WhatsApp y la aplicación de Teléfono nativa.

---

## 3. Requerimientos Funcionales

### 3.1. Interfaz de Usuario y Experiencia (Custom Launcher)
* **F1. Pantalla de Inicio Restringida:** Al encender o desbloquear el dispositivo, o al presionar el botón "Home", el usuario será dirigido invariablemente al Dashboard de Tutor IA. No habrá acceso al cajón de aplicaciones (App Drawer) nativo de Android.
* **F2. Panel de Herramientas Permitidas:** El Dashboard mostrará accesos directos claramente definidos únicamente para:
    * Ejecutar Tareas (Tutor IA).
    * Abrir WhatsApp.
    * Realizar Llamadas (Dialer).
* **F3. Módulo de Tareas:** El alumno podrá ver el listado de tareas del día/semana sincronizado en tiempo real con Supabase.
* **F4. Carga de Evidencias:** Integración con la cámara del dispositivo y el almacenamiento local para seleccionar imágenes o documentos. Estos archivos se subirán a Supabase Storage y se vincularán a la tarea correspondiente.

### 3.2. Motor de Control (App Locker & Background Service)
* **F5. Monitoreo de Uso Continuo:** La aplicación ejecutará un *Foreground Service* (Servicio en Primer Plano) permanente e imposible de cerrar por el usuario, que evaluará qué aplicación está en primer plano en tiempo real.
* **F6. Intercepción de Fugas (Overlays):** Si el servicio detecta que se ha abierto una aplicación no autorizada (por ejemplo, a través de una notificación push de otra app o un enlace profundo), Tutor IA lanzará inmediatamente una vista superpuesta (*System Alert Window*) bloqueando la pantalla y mostrando el mensaje "Acción restringida durante el horario de estudio".
* **F7. Modo Escape (Administrador):** Debe existir un mecanismo oculto (ej. pulsar 7 veces un logotipo de Tutor IA e ingresar un PIN numérico) para desactivar el Locker temporalmente y permitir el mantenimiento del dispositivo por parte de los padres/administradores.

---

## 4. Requerimientos Técnicos y de Arquitectura

Para asegurar la viabilidad de la conexión nativa manteniendo la agilidad de desarrollo, se requiere una arquitectura mixta.

### 4.1. Stack Tecnológico
| Componente | Tecnología Seleccionada | Justificación |
| :--- | :--- | :--- |
| **Frontend UI / Lógica de Negocio** | React Native (Bare Workflow / React Native CLI) | Permite reutilizar lógica de la app web (Next.js). *Nota: No usar Expo Go, ya que se requiere escribir código nativo profundo.* |
| **Integración Nativa (Launcher/Locker)**| Kotlin / Java (Native Modules) | Indispensable para acceder a las APIs del sistema operativo Android que controlan los servicios en segundo plano. |
| **Backend & Base de Datos** | Supabase (PostgreSQL, Auth) | Sincronización directa con el ecosistema web actual usando `@supabase/supabase-js`. |
| **Almacenamiento (Evidencias)** | Supabase Storage | Manejo de imágenes mediante URLs firmadas. |

### 4.2. Especificaciones de Android (APIs Críticas)
Para que las funcionalidades de bloqueo operen, la aplicación nativa deberá implementar y solicitar los siguientes elementos al sistema:

* **Configuración del Manifest (`AndroidManifest.xml`):**
    * Declarar la app como Launcher: Añadir los intents `CATEGORY_HOME` y `CATEGORY_DEFAULT` en el `MainActivity`.
    * Declarar el Servicio en Primer Plano: `<service android:name=".EnforcerService" android:foregroundServiceType="specialUse" />`.
* **Permisos de Sistema Requeridos (Android Permissions):**
    * `android.permission.PACKAGE_USAGE_STATS`: Para leer el historial de uso y saber qué app está en pantalla (Locker). **Requiere aprobación manual del usuario en Ajustes.**
    * `android.permission.SYSTEM_ALERT_WINDOW`: Para dibujar la pantalla de bloqueo por encima de otras aplicaciones ("Superposición de aplicaciones"). **Requiere aprobación manual del usuario en Ajustes.**
    * `android.permission.FOREGROUND_SERVICE`: Para mantener el monitor de seguridad vivo.
    * `android.permission.CAMERA` y `android.permission.READ_EXTERNAL_STORAGE`: Para la carga de evidencias.

### 4.3. Flujo de Datos (Evidencias)
1. El usuario interactúa con la UI en React Native para subir la tarea.
2. La librería de cámara (ej. `react-native-vision-camera` o `react-native-image-picker`) captura el archivo y lo comprime localmente.
3. El cliente de Supabase sube el binario al *bucket* designado en Supabase Storage.
4. Se obtiene la URL pública o firmada del archivo.
5. Se inserta un registro en la tabla `evidencias` de Supabase vinculando el `tarea_id`, `alumno_id` y la `url_archivo`.

---

## 5. Requerimientos No Funcionales
* **Resiliencia Offline:** Si el dispositivo pierde conexión, el *App Locker* y el *Launcher* deben seguir operando y bloqueando aplicaciones. La validación de seguridad debe ejecutarse de forma 100% local en el dispositivo.
* **Rendimiento y Batería:** El código nativo en Kotlin del `UsageStatsManager` (el que vigila qué app se abre) debe optimizarse para no consumir más del 5-8% de la batería diaria, utilizando *loops* de escaneo eficientes.
* **Seguridad:** Las credenciales de Supabase deben almacenarse de forma segura utilizando *Encrypted SharedPreferences* (Android Keystore) y no en texto plano.

---

## 6. Criterios de Aceptación Clave para el MVP
1.  **Instalación y Configuración:** El administrador instala el APK, otorga los permisos de Accesibilidad/Superposición y configura la app como *Default App de Inicio*.
2.  **Prueba de Fuga de Navegador:** Si un usuario abre un documento PDF desde una tarea que contiene un enlace a internet e intenta hacer clic en él, el servicio de Tutor IA debe detectar la apertura de Chrome/WebView e interceptar la pantalla en menos de 0.5 segundos.
3.  **Prueba de Sincronización:** Una foto tomada como evidencia desde el móvil debe ser visible inmediatamente en el dashboard web del administrador.
4.  **Excepciones Permitidas:** La apertura de WhatsApp y la recepción/realización de llamadas deben fluir sin que el sistema de Tutor IA lance la pantalla de superposición.

http://googleusercontent.com/interactive_content_block/0