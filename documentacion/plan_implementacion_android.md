# Plan de Implementación: Tutor IA Móvil (Android Launcher + Locker)

**Proyecto:** TutorIaMobile — Entorno Móvil Controlado  
**Plataforma:** Android exclusivo (API 26 a 34)  
**Stack:** React Native CLI (TypeScript) + Kotlin (Módulos Nativos) + Supabase  
**Fecha de creación:** 2026-04-01  
**Versión:** 1.1 (decisiones confirmadas 2026-04-01)  

---

## ✅ Decisiones Confirmadas

| Decisión | Valor |
|----------|-------|
| **applicationId** | `com.tutoria.ia` |
| **Supabase** | Mismas credenciales que el proyecto web `tutor-ia` |
| **PIN Escape** | Hardcodeado localmente, configurable en primer arranque |
| **Dispositivo de prueba** | Motorola G35 (Android 14, stock Android) |
| **Supabase Storage bucket** | `evidencias` ya existe con RLS configurado |
| **alumno_id** | Corresponde a `auth.uid()` de Supabase Auth |
| **Dialer whitelist** | `com.android.dialer` (stock Android, no OEM custom) |

---

## Visión General

La aplicación Android tiene dos responsabilidades simultáneas:

1. **Launcher educativo:** Reemplaza la pantalla de inicio de Android y sirve como portal de tareas sincronizadas con Supabase.
2. **App Locker (Enforcer):** Un servicio en segundo plano (Foreground Service en Kotlin) que vigila qué aplicación está en primer plano y bloquea todo lo que no esté en la lista blanca, mostrando un overlay opaco.

La capa de UI y lógica de negocio vive en React Native (TypeScript). La interacción profunda con el SO Android vive en módulos nativos Kotlin, comunicados a JS mediante el React Native Bridge (JNI).

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│         React Native (TypeScript)        │
│  ┌───────────────┐  ┌────────────────┐  │
│  │  PermissionsScreen │  Dashboard         │  │
│  │  TareaDetalleScreen│  CapturaEvidencia  │  │
│  └───────────────┘  └────────────────┘  │
│          │  supabase.ts / services        │
└──────────┼──────────────────────────────┘
           │ React Native Bridge (JNI)
┌──────────▼──────────────────────────────┐
│         Kotlin / Android Framework       │
│  ┌────────────────────────────────────┐ │
│  │  TutorEnforcerModule   (Bridge)    │ │
│  │  EnforcerService       (Locker)    │ │
│  │  WindowManager Overlay (UI Block)  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────┐
│   Supabase (Backend existente tutor-ia)  │
│   Tablas: tareas, evidencias             │
│   Storage: bucket evidencias             │
└─────────────────────────────────────────┘
```

---

## FASE 1: Inicialización del Proyecto y Dependencias Core

**Objetivo:** Crear el esqueleto React Native Bare con TypeScript y verificar que Gradle y las dependencias nativas compilan sin errores.

### Tareas
- 1.1 Inicializar proyecto: `npx @react-native-community/cli@latest init TutorIaMobile --template react-native-template-typescript`
- 1.2 Instalar `react-native-keychain` y `react-native-fs`
- 1.3 Instalar `react-native-vision-camera`
- 1.4 Verificar `kotlinVersion >= 1.8.0` en `android/build.gradle`
- 1.5 Verificar `minSdkVersion = 26` en `android/app/build.gradle`
- 1.6 Primera compilación limpia: `npm run android`

**Criterio de éxito:** La app por defecto de React Native abre en el dispositivo/emulador sin errores de linking.

---

## FASE 2: Conexión al Backend Supabase (Base existente `tutor-ia`)

**Objetivo:** Conectar la app móvil a la instancia de Supabase del proyecto web.

### Tareas
- 2.1 Instalar `@supabase/supabase-js`, `react-native-url-polyfill`, `react-native-dotenv`
- 2.2 Configurar `babel.config.js` con el plugin de dotenv
- 2.3 Crear archivo `.env` con `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- 2.4 Crear `src/lib/supabase.ts` con `SecureStorageAdapter` usando `react-native-keychain`
- 2.5 Crear `src/services/tareas.ts` con función `getTareasPendientes(alumnoId)`
- 2.6 Crear `src/services/evidencias.ts` con función `uploadEvidencia(tareaId, alumnoId, imageUri)`

**Criterio de éxito:** `getTareasPendientes` retorna datos reales desde Supabase. `uploadEvidencia` escribe un registro en la tabla `evidencias` y sube el binario a Storage.

---

## FASE 3: Modificación del AndroidManifest.xml

**Objetivo:** Configurar el Manifest para que el SO reconozca la app como Launcher y autorice los servicios de bloqueo.

### Tareas
- 3.1 Añadir `xmlns:tools` al tag `<manifest>`
- 3.2 Declarar permisos críticos (INTERNET, CAMERA, PACKAGE_USAGE_STATS, SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE, FOREGROUND_SERVICE_SPECIAL_USE, RECEIVE_BOOT_COMPLETED, READ_EXTERNAL_STORAGE)
- 3.3 Añadir bloque `<queries>` para WhatsApp y acción DIAL
- 3.4 Modificar `<activity android:name=".MainActivity">` añadiendo categorías `HOME`, `DEFAULT`, `LAUNCHER`
- 3.5 Declarar `<service android:name=".EnforcerService" ... foregroundServiceType="specialUse">`

**Criterio de éxito:** El build compila sin errores. Al instalar la APK, el SO ofrece la app como opción de pantalla de inicio.

---

## FASE 4: Motor Nativo — EnforcerService (Kotlin)

**Objetivo:** Servicio en segundo plano que monitorea qué app está en primer plano cada 500ms usando `UsageStatsManager`.

**Archivo:** `android/app/src/main/java/com/tutoriamobile/EnforcerService.kt`

### Tareas
- 4.1 Crear clase `EnforcerService` extendiendo `Service`
- 4.2 Implementar notificación persistente con `startForeground()` y canal `NotificationChannel`
- 4.3 Implementar `onStartCommand` retornando `START_STICKY`
- 4.4 Implementar `startMonitoringLoop()` con `CoroutineScope(Dispatchers.IO)` + `delay(500)`
- 4.5 Implementar `getForegroundPackageName()` usando `UsageStatsManager.queryEvents`
- 4.6 Definir `WHITELIST` con paquetes permitidos: `com.tutoriamobile`, `com.whatsapp`, `com.whatsapp.w4b`, `com.android.dialer`, `com.samsung.android.dialer`, `com.android.server.telecom`
- 4.7 Implementar `evaluatePackage()` que invoca al mecanismo de bloqueo si el paquete no está en whitelist
- 4.8 Implementar limpieza de scope en `onDestroy()`

**Criterio de éxito:** Con un log en `evaluatePackage`, al abrir Ajustes/Chrome desde el dispositivo se registra "¡FUGA DETECTADA!".

---

## FASE 5: Mecanismo de Bloqueo — Overlays (Kotlin)

**Objetivo:** Dibujar una pantalla opaca sobre la app no autorizada con un botón que fuerza el retorno al Launcher.

**Archivo:** `EnforcerService.kt` (extensión)

### Tareas
- 5.1 Añadir propiedades `windowManager`, `overlayView`, `isOverlayShowing` a `EnforcerService`
- 5.2 Obtener `WindowManager` en `onCreate()`
- 5.3 Crear función `createOverlayView()` que construye un `LinearLayout` programático con mensaje y botón
- 5.4 Crear función `showLockScreenOverlay()` usando `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`
- 5.5 Actualizar `evaluatePackage()` para llamar a `showLockScreenOverlay()` desde `Dispatchers.Main`
- 5.6 Implementar `removeOverlayAndGoHome()` que elimina el overlay y lanza `Intent` hacia `MainActivity` con flags `NEW_TASK | CLEAR_TOP | SINGLE_TOP`
- 5.7 Implementar `removeOverlayView()` con manejo de excepciones (evitar crash si vista ya fue removida)

**Criterio de éxito:** Al abrir Chrome desde el dispositivo, aparece la pantalla de bloqueo en menos de 1 segundo. El botón "Volver a Tutor IA" regresa al Dashboard.

---

## FASE 6: React Native Bridge — TutorEnforcerModule (JNI)

**Objetivo:** Exponer a TypeScript los métodos nativos para verificar permisos, solicitarlos y controlar el ciclo de vida del EnforcerService.

**Archivos:** `TutorEnforcerModule.kt`, `TutorEnforcerPackage.kt`, `MainApplication.kt`, `src/native/TutorEnforcer.ts`

### Tareas
- 6.1 Crear `TutorEnforcerModule.kt` heredando de `ReactContextBaseJavaModule`
- 6.2 Implementar `@ReactMethod checkPermissions(promise: Promise)` validando `Settings.canDrawOverlays` y `AppOpsManager.OPSTR_GET_USAGE_STATS`
- 6.3 Implementar `@ReactMethod requestOverlayPermission(promise: Promise)` lanzando `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`
- 6.4 Implementar `@ReactMethod requestUsageStatsPermission(promise: Promise)` lanzando `Settings.ACTION_USAGE_ACCESS_SETTINGS`
- 6.5 Implementar `@ReactMethod startEnforcerService(promise: Promise)` usando `ContextCompat.startForegroundService`
- 6.6 Implementar `@ReactMethod stopEnforcerService(pin: String, promise: Promise)` con validación de PIN
- 6.7 Crear `TutorEnforcerPackage.kt` registrando el módulo
- 6.8 Agregar `TutorEnforcerPackage()` a `getPackages()` en `MainApplication.kt`
- 6.9 Crear `src/native/TutorEnforcer.ts` con tipado TypeScript de todos los métodos

**Criterio de éxito:** Desde un componente de React Native, `await TutorEnforcer.checkPermissions()` retorna un objeto `{hasOverlay, hasUsageStats, allGranted}` sin errores de tipado.

---

## FASE 7: Interfaz de Usuario — Custom Launcher Dashboard

**Objetivo:** Construir los componentes React Native que constituyen la pantalla de inicio restringida.

**Archivos:** `src/screens/PermissionsScreen.tsx`, `src/screens/Dashboard.tsx`, `App.tsx`

### Tareas
- 7.1 Crear `PermissionsScreen.tsx`: pantalla de onboarding que bloquea el acceso si `allGranted === false`
  - Escuchar cambios de `AppState` para re-validar permisos al volver de Ajustes
- 7.2 Crear `Dashboard.tsx` con `FlatList` de tareas desde `getTareasPendientes()`
- 7.3 Activar `TutorEnforcer.startService()` automáticamente al montar el Dashboard
- 7.4 Interceptar el botón físico "Atrás" con `BackHandler.addEventListener('hardwareBackPress', () => true)`
- 7.5 Añadir botones de WhatsApp (`Linking.openURL('whatsapp://app')`) y Teléfono (`Linking.openURL('tel:')`)
- 7.6 Implementar "Modo Escape" oculto: 7 taps en el título + PIN numérico → `TutorEnforcer.stopService(pin)`
- 7.7 Configurar `App.tsx` para mostrar `PermissionsScreen` si permisos incompletos, o `Dashboard` si están todos concedidos

**Criterio de éxito:** Al presionar el botón Home, el dispositivo regresa al Dashboard. El botón Atrás no cierra la app.

---

## FASE 8: Ejecución de Tareas y Evidencias

**Objetivo:** Completar el ciclo del alumno: ver detalle de tarea → tomar foto → previsualizar → subir a Supabase.

**Archivos:** `src/screens/TareaDetalleScreen.tsx`, `src/components/CapturaEvidencia.tsx`

### Tareas
- 8.1 Crear `TareaDetalleScreen.tsx` con detalle de tarea y botón "Tomar foto"
- 8.2 Solicitar permiso de cámara con `useCameraPermission()` de `react-native-vision-camera`
- 8.3 Crear `CapturaEvidencia.tsx` usando `<Camera>` con dispositivo trasero (`useCameraDevice('back')`)
- 8.4 Implementar `tomarFoto()` con `cameraRef.current.takePhoto()` y prefijar path con `file://`
- 8.5 Implementar pantalla de previsualización con botones "Repetir" y "Enviar Evidencia"
- 8.6 Implementar `confirmarYSubir()` llamando a `uploadEvidencia()` con estado de carga (`ActivityIndicator`)
- 8.7 Conectar navegación: `Dashboard` → `TareaDetalleScreen` → `CapturaEvidencia` → vuelta al `Dashboard`

**Criterio de éxito:** Una foto tomada desde el móvil es visible en el dashboard web de Supabase inmediatamente. La tarea pasa a estado `completado`.

---

## Consideraciones Transversales (Aplicables a Todas las Fases)

### Seguridad
- Las credenciales de Supabase se almacenan cifradas con `react-native-keychain` (Android Keystore), nunca en texto plano.
- El PIN del Modo Escape en producción debe validarse contra Supabase (no hardcodeado).

### Rendimiento
- El bucle de `EnforcerService` debe ejecutarse en `Dispatchers.IO`, nunca en el Main Thread.
- Las actualizaciones de UI del overlay deben hacerse con `Dispatchers.Main`.
- Usar `delay(500)` como mínimo para no saturar `UsageStatsManager`.

### Resiliencia Offline
- El `EnforcerService` y el `Launcher` deben operar 100% localmente, sin requerir conexión a internet. La whitelist es estática en código Kotlin.
- La lista de tareas puede quedar en caché local para mostrarla offline.

### Compatibilidad OEM
- La whitelist debe incluir variantes de marcas (Samsung, Xiaomi/MIUI) para el marcador telefónico.
- MIUI y OneUI tienden a matar servicios en segundo plano; documentar instrucciones de "Optimización de Batería: Desactivada" para el instalador.

---

## ✅ Decisiones Técnicas Confirmadas

Todas las preguntas iniciales fueron respondidas el 2026-04-01:

**P1 → applicationId:** `com.tutoria.ia` (definido por el agente de desarrollo).

**P2 → Supabase:** Mismas credenciales del proyecto web. Las variables deben copiarse del `.env` del proyecto `app-tutor-ia` al nuevo `.env` del proyecto Android.

**P3 → PIN Escape:** Se almacena localmente con `react-native-keychain`. Debe existir una pantalla de **Configuración Inicial** (FirstLaunch) que se ejecuta una sola vez al instalar la app, donde el administrador define su PIN de escape. Se guarda cifrado en el Keystore de Android. El `stopEnforcerService` valida contra este PIN local.

**P4 → Dispositivo:** Motorola G35 — Android 14, stock Android (sin MIUI ni OneUI). El marcador estándar es `com.android.dialer`. No requiere variantes de fabricante OEM en la whitelist.

**P5 → Storage:** El bucket `evidencias` ya existe con políticas RLS que permiten escritura a alumnos autenticados. No se requiere setup adicional en Supabase.

**P6 → alumno_id:** Es `auth.uid()` — el UUID del usuario autenticado en Supabase Auth.

---

## Estimación de Esfuerzo

| Fase | Descripción | Complejidad | Prioridad |
|------|-------------|-------------|-----------|
| 1 | Setup del proyecto | Baja | Crítica |
| 2 | Conexión Supabase | Media | Crítica |
| 3 | AndroidManifest | Baja | Crítica |
| 4 | EnforcerService (Kotlin) | Alta | Crítica |
| 5 | Overlays de bloqueo (Kotlin) | Alta | Crítica |
| 6 | React Native Bridge | Alta | Crítica |
| 7 | Dashboard UI | Media | Alta |
| 8 | Cámara y Evidencias | Media | Alta |

**Orden de ejecución:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (secuencial, cada fase depende de la anterior)
