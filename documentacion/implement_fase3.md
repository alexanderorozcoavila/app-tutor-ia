Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 3: Modificación del Android Manifest**.

El objetivo de esta fase es configurar las reglas del juego a nivel del sistema operativo. Sin estas modificaciones, Android tratará tu aplicación como una app ordinaria, impidiéndole actuar como pantalla de inicio o ejecutar servicios persistentes de monitoreo.

---

### FASE 3: Modificación del Android Manifest (Modo Launcher y Permisos)

**Archivo a modificar:** `android/app/src/main/AndroidManifest.xml`

#### Paso 3.1: Inclusión del Namespace de Herramientas (Tools)
Para declarar permisos protegidos por el sistema (como el de estadísticas de uso) sin que el compilador arroje errores que detengan el *build*, es necesario importar el namespace `tools` en la cabecera del archivo.

* **Modificación requerida:** En la etiqueta principal `<manifest>`, añade la propiedad `xmlns:tools`.
    ```xml
    <manifest xmlns:android="http://schemas.android.com/apk/res/android"
              xmlns:tools="http://schemas.android.com/tools"> ```

#### Paso 3.2: Declaración de Permisos Críticos
Justo debajo de la etiqueta `<manifest>` y antes de `<application>`, debes añadir los permisos que habilitan la arquitectura Launcher/Locker.

* **Bloque de código a insertar:**
    ```xml
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />
    
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" /> <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    ```

#### Paso 3.3: Configuración de Visibilidad de Paquetes (Queries para Android 11+)
Debido a los cambios de privacidad en Android 11 (API 30+), tu aplicación no puede "ver" ni invocar a otras aplicaciones directamente a menos que las declares explícitamente. Dado que el alumno necesita usar WhatsApp y el Teléfono, debemos declararlos.

* **Bloque de código a insertar (fuera de `<application>`):**
    ```xml
    <queries>
        <package android:name="com.whatsapp" />
        <package android:name="com.whatsapp.w4b" /> <intent>
            <action android:name="android.intent.action.DIAL" />
        </intent>
    </queries>
    ```

#### Paso 3.4: Declaración del Custom Launcher (MainActivity)
Aquí es donde secuestramos el botón de "Inicio" del teléfono. Debes buscar la etiqueta `<activity android:name=".MainActivity">` y modificar su `<intent-filter>`.

* **Modificación requerida:** Reemplaza el `<intent-filter>` existente por el siguiente:
    ```xml
    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.HOME" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
    ```

#### Paso 3.5: Declaración del Servicio de Seguridad (EnforcerService)
El módulo nativo en Kotlin que crearemos en la siguiente fase debe estar registrado en el Manifest, de lo contrario Android denegará su ejecución y lanzará un `SecurityException`.

* **Bloque de código a insertar (Dentro de la etiqueta `<application>`, al mismo nivel que `<activity>`):**
    ```xml
    <service
        android:name=".EnforcerService"
        android:enabled="true"
        android:exported="false"
        android:foregroundServiceType="specialUse">
        </service>
    ```

---

Con este Manifest, la aplicación está autorizada a nivel de SO para asumir el control del entorno y vigilar el uso del dispositivo.

http://googleusercontent.com/interactive_content_block/0