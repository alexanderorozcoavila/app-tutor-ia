# Lista de Tareas — Tutor IA Móvil Android

**Proyecto:** TutorIaMobile  
**Última actualización:** 2026-04-01  
**Estado general:** 🔴 No iniciado

Leyenda: `[ ]` Pendiente | `[/]` En progreso | `[x]` Completado | `[!]` Bloqueado (requiere info)

---

## 🔧 FASE 1: Inicialización del Proyecto

- [x] **1.1** Inicializar proyecto con React Native CLI + TypeScript template
  - Versión instalada: React Native 0.84.1 (TypeScript por defecto)
  - Carpeta: `/Users/omar/Documents/app-tutor-ia/TutorIaMobile/`
- [x] **1.2** Instalar dependencias de sistema:
  - `npm install react-native-keychain react-native-fs`
- [x] **1.3** Instalar módulo de cámara:
  - `npm install react-native-vision-camera`
- [x] **1.4** kotlinVersion = 2.1.20 ✅ (> 1.8.0 requerido)
- [x] **1.5** minSdkVersion cambiado de 24 → **26** en `android/build.gradle`
- [x] **1.6** Permiso de CAMERA declarado en `AndroidManifest.xml` (Fase 3)
- [ ] **1.7** ⏳ Compilar y probar en Motorola G35: `npm run android` — **PENDIENTE (requiere dispositivo físico)**
- [ ] **1.8** Confirmar que NO hay errores de linking nativo — **PENDIENTE**

---

## 🔌 FASE 2: Conexión Backend Supabase

- [!] **2.0** ⚠️ **ACCIÓN REQUERIDA**: Rellenar el archivo `.env` con las credenciales reales del proyecto web `tutor-ia`
- [x] **2.1** Instalar dependencias de red:
  - `npm install @supabase/supabase-js react-native-url-polyfill`
  - `npm install -D react-native-dotenv`
- [x] **2.2** Configurar `babel.config.js` con plugin `react-native-dotenv`
- [x] **2.3** Crear archivo `.env` con plantilla de variables de entorno
- [x] **2.4** Crear `src/lib/supabase.ts` con `SecureStorageAdapter` usando `react-native-keychain`
- [x] **2.5** Crear `src/services/tareas.ts`:
  - Interfaz `Tarea` (id, titulo, descripcion, tipo, estado, alumno_id)
  - Función `getTareasPendientes(alumnoId: string): Promise<Tarea[]>`
  - Función `marcarTareaCompletada(tareaId: string): Promise<void>`
- [x] **2.6** Crear `src/services/evidencias.ts`:
  - Función `uploadEvidencia(tareaId, alumnoId, imageUri)` completa
- [x] **2.7** Bucket `evidencias` ya existe con RLS OK (confirmado por usuario)
- [ ] **2.8** ⏳ Test manual pendiente: verificar que `getTareasPendientes` retorna datos reales

---

## 📋 FASE 3: AndroidManifest.xml

- [x] **3.1** Añadir `xmlns:tools` al tag `<manifest>`
- [x] **3.2** Declarar 8 permisos críticos
- [x] **3.3** Añadir bloque `<queries>` para WhatsApp y DIAL
- [x] **3.4** Modificar `<activity .MainActivity>` con categorías `HOME`, `DEFAULT`, `LAUNCHER`
- [x] **3.5** Declarar `<service .EnforcerService>` con `foregroundServiceType="specialUse"`
- [ ] **3.6** ⏳ Compilar y verificar que el build pasa — **PENDIENTE**
- [ ] **3.7** ⏳ Instalar APK y verificar que el SO ofrece la app como pantalla de inicio — **PENDIENTE (dispositivo)**

---

## ⚙️ FASE 4: EnforcerService — Monitor Nativo (Kotlin)

- [x] **4.0** applicationId = `com.tutoria.ia` (confirmado)
- [x] **4.1** Crear `EnforcerService.kt` extendiendo `Service` con scope y propiedades de overlay
- [x] **4.2** Implementar notificación persistente `NotificationChannel` + `startForeground(1, ...)`
- [x] **4.3** Implementar `onStartCommand()` retornando `START_STICKY`
- [x] **4.4** Implementar `startMonitoringLoop()` con `CoroutineScope(Dispatchers.IO)` + `delay(500)`
- [x] **4.5** Implementar `getForegroundPackageName()` con `UsageStatsManager.queryEvents + ACTIVITY_RESUMED`
- [x] **4.6** Definir `WHITELIST` con paquetes autorizados para Motorola G35 stock
- [x] **4.7** Implementar `evaluatePackage()` con trigger de overlay
- [ ] **4.8** ⏳ Verificar con Logcat — **PENDIENTE (dispositivo)**

---

## 🔒 FASE 5: Mecanismo de Bloqueo — Overlays (Kotlin)

- [x] **5.1–5.7** Fases 4 y 5 implementadas juntas en `EnforcerService.kt`:
  - Overlay creado programáticamente (sin XML) con `LinearLayout` + emoji + texto + botón
  - `showLockScreenOverlay()` usa `TYPE_APPLICATION_OVERLAY`
  - `removeOverlayAndGoHome()` lanza Intent con `NEW_TASK | CLEAR_TOP | SINGLE_TOP`
  - `removeOverlayView()` con try/catch para evitar crash
  - `evaluatePackage()` despacha al Main Thread antes de modificar UI
- [ ] **5.8** ⏳ Test en Motorola G35 — **PENDIENTE (dispositivo)**

---

## 🌉 FASE 6: React Native Bridge (JNI)

- [x] **6.1** `TutorEnforcerModule.kt` creado heredando de `ReactContextBaseJavaModule`
- [x] **6.2** `checkPermissions()` implementado con validación correcta de API 29+
- [x] **6.3** `requestOverlayPermission()` implementado
- [x] **6.4** `requestUsageStatsPermission()` implementado
- [x] **6.5** `startEnforcerService()` con `ContextCompat.startForegroundService`
- [x] **6.6** `stopEnforcerService()` (PIN validado desde JS via `pinService.ts`)
- [x] **6.7** `TutorEnforcerPackage.kt` creado
- [x] **6.8** `TutorEnforcerPackage()` agregado a `MainApplication.kt`
- [x] **6.9** `src/native/TutorEnforcer.ts` creado con tipado TypeScript completo
- [ ] **6.10** ⏳ Test de integración pendiente (requiere compilación en dispositivo)

---

## 🖥️ FASE 7: Dashboard UI — Custom Launcher

- [x] **7.1** `src/screens/PermissionsScreen.tsx` creado (con `AppState` listener)
- [x] **7.2** `src/screens/Dashboard.tsx` creado con `FlatList` y `getTareasPendientes()`
- [x] **7.3** `TutorEnforcer.startService()` en `useEffect` al montar
- [x] **7.4** `BackHandler.addEventListener('hardwareBackPress', () => true)` implementado
- [x] **7.5** Botones WhatsApp y Teléfono con `Linking.openURL`
- [x] **7.6** Modo Escape: 7 taps → Modal con TextInput PIN → `validateEscapePin()` → `TutorEnforcer.stopService()`
- [x] **7.0** EXTRA: `src/screens/FirstLaunchSetupScreen.tsx` (pantalla de configuración inicial de PIN)
- [x] **7.0** EXTRA: `src/services/pinService.ts` (gestión cifrada del PIN en Keychain)
- [x] **7.7** `App.tsx` actualizado con flujo: loading → firstLaunch → permissions → dashboard → tareaDetalle
- [ ] **7.X** ⏳ Test en dispositivo — **PENDIENTE**

---

## 📸 FASE 8: Tarea Detalle y Evidencias

- [x] **8.1** `src/screens/TareaDetalleScreen.tsx` creado con badge de tipo color-coded
- [x] **8.2** `useCameraPermission()` + `requestPermission()` integrado
- [x] **8.3** `src/components/CapturaEvidencia.tsx` creado con `useCameraDevice('back')` y `<Camera photo={true}>`
- [x] **8.4** `tomarFoto()` con prefijo `file://` al path
- [x] **8.5** Previsualización con botón "Repetir"
- [x] **8.6** `confirmarYSubir()` con `ActivityIndicator` durante la subida
- [x] **8.7** Navegación completa: `Dashboard` → `TareaDetalleScreen` → `CapturaEvidencia` → vuelta a `Dashboard`
- [ ] **8.8** ⏳ Test de aceptación en Motorola G35 — **PENDIENTE**rificar que la imagen aparece en el panel web de Supabase

---

## ✅ Criterios de Aceptación del MVP

- [ ] APK instala y funciona en dispositivo Android físico (API 26+)
- [ ] Al presionar Home, siempre regresa al Dashboard de Tutor IA
- [ ] Al intentar abrir Chrome/YouTube/Ajustes, el overlay de bloqueo aparece en menos de 1 segundo
- [ ] Botón "Volver a Tutor IA" en el overlay lleva de regreso al Dashboard
- [ ] WhatsApp y Teléfono abren sin activar el overlay
- [ ] Una foto tomada como evidencia aparece en el dashboard web de Supabase
- [ ] El servicio de monitoreo sobrevive al reinicio del dispositivo (RECEIVE_BOOT_COMPLETED)
- [ ] El Modo Escape (7 taps + PIN) desactiva correctamente el EnforcerService
