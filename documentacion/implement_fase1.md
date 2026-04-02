Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 1: Inicialización y Dependencias Core**. 

Este nivel de detalle está pensado para que al ejecutar los comandos o al pasárselo a un agente de código, se eviten los problemas típicos de compatibilidad en React Native, asegurando una base sólida para el entorno restringido que requiere la plataforma.

---

### FASE 1: Inicialización y Dependencias Core

El objetivo de esta fase es establecer un esqueleto de React Native limpio en su versión "Bare" (sin Expo Go), configurado con TypeScript y con los cimientos listos para soportar los módulos nativos en Kotlin y la captura de evidencias fotográficas.

#### Paso 1.1: Inicialización del Proyecto
Se utilizará la CLI oficial de React Native para garantizar el control total sobre la carpeta `android`.

* **Comando de ejecución:**
    ```bash
    npx @react-native-community/cli@latest init TutorIaMobile --template react-native-template-typescript
    ```
* **Acción post-creación:**
    ```bash
    cd TutorIaMobile
    ```
* **Detalle Técnico:** Esto generará la estructura base. Es crucial verificar que en el archivo `android/build.gradle` (nivel de proyecto), la versión de Kotlin definida (`kotlinVersion`) sea al menos `1.8.0` o superior, ya que los servicios en segundo plano que crearemos más adelante en el `EnforcerService` usarán *Coroutines*.

#### Paso 1.2: Instalación de Dependencias de Sistema y Seguridad
Para que el alumno pueda autenticarse con Supabase de forma segura y para poder manejar los archivos locales antes de enviarlos a la nube.

* **Comando de ejecución:**
    ```bash
    npm install react-native-keychain react-native-fs
    ```
* **Detalle Técnico:**
    * `react-native-keychain`: Se usará para crear un adaptador de almacenamiento seguro para la sesión de Supabase Auth. Guardar el token JWT en `AsyncStorage` (texto plano) representa una vulnerabilidad si el dispositivo cae en manos de un usuario avanzado.
    * `react-native-fs`: Necesario para acceder a las rutas de caché del dispositivo y gestionar los binarios (imágenes/PDFs) generados por el módulo de evidencias de las tareas.

#### Paso 1.3: Instalación del Módulo de Captura de Evidencias
Para la captura de imágenes se utiliza una librería de alto rendimiento que no bloquee el hilo principal de JavaScript de la app.

* **Comando de ejecución:**
    ```bash
    npm install react-native-vision-camera
    ```
* **Ajustes nativos obligatorios post-instalación:**
    1.  Abrir `android/app/build.gradle` y asegurar que el `minSdkVersion` sea **al menos 26** (requerido por las librerías modernas de cámara y por los permisos de *Foreground Service* de Android).
    2.  Abrir `android/app/src/main/AndroidManifest.xml` y agregar temporalmente el permiso de cámara (luego se gestionará desde la UI):
        ```xml
        <uses-permission android:name="android.permission.CAMERA" />
        ```

#### Paso 1.4: Limpieza y Primera Compilación (Sanity Check)
Antes de escribir una sola línea de lógica para Supabase o Kotlin, se debe asegurar que el ecosistema de Gradle ensambla el proyecto sin errores con las librerías instaladas.

* **Comando de ejecución (con un emulador o dispositivo Android conectado):**
    ```bash
    npm run android
    ```
* **Criterio de Éxito:** La aplicación por defecto de React Native debe abrirse en el dispositivo, y en la terminal de Metro Bundler no deben aparecer errores de vinculación (`linking`) nativa. Si la compilación falla aquí, generalmente se debe a una incompatibilidad entre la versión de Java del sistema y la versión de Gradle, lo cual debe resolverse ajustando el archivo `android/gradle/wrapper/gradle-wrapper.properties`.

---

Una vez superado el Paso 1.4, el cascarón de la aplicación es completamente estable y seguro para comenzar la integración con la base de datos de PostgreSQL/Supabase.

http://googleusercontent.com/interactive_content_block/0