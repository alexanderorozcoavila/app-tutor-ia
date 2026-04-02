# Historial de Acciones — Tutor IA Móvil Android

**Proyecto:** TutorIaMobile  
**Plataforma:** Android (React Native CLI + Kotlin)  
**Propósito:** Registro cronológico de todo el trabajo realizado. Actualizar este archivo **inmediatamente** al completar cada tarea. Permite retomar el desarrollo exactamente desde donde se dejó.

---

## Convenciones

- Cada entrada sigue el formato: `[FECHA] [ACCIÓN] [DETALLE]`
- Íconos de estado: ✅ Completado | 🚧 En progreso | ⚠️ Problema encontrado | ❓ Pregunta abierta | 📝 Nota técnica
- El campo **"Próximo paso"** al final de cada sesión define exactamente de dónde retomar.

---

## 📌 Estado Actual del Proyecto

> **Última actualización:** 2026-04-01 19:52  
> **Fase activa:** CÓDIGO COMPLETO — Pendiente primera compilación en dispositivo físico  
> **Próximo paso:** Rellenar `.env` con credenciales Supabase → conectar Motorola G35 → `npm run android`

---

## Sesión 1 — 2026-04-01

### ✅ Análisis y Planificación Inicial

**Agente:** Antigravity (Gemini / Claude Sonnet 4.6)  
**Duración:** Sesión de planificación

#### Acciones Realizadas

1. ✅ **Lectura completa de `prd.md`** — Documento de Requerimientos del Producto analizado.
   - Plataforma: Android exclusivo (Launcher + Locker)
   - Stack: React Native CLI (Bare) + Kotlin + Supabase
   - Permisos críticos identificados: PACKAGE_USAGE_STATS, SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE

2. ✅ **Lectura completa de `td.md`** — Documento de Diseño Técnico analizado.
   - Arquitectura híbrida: RN (TypeScript) ↔ Bridge (JNI) ↔ Kotlin (OS Layer)
   - Componentes nativos clave: `EnforcerService`, `TutorEnforcerModule`, `WindowManager Overlays`
   - APIs Android críticas: `UsageStatsManager`, `WindowManager.TYPE_APPLICATION_OVERLAY`

3. ✅ **Lectura completa de `plan_implementacion.md`** — 8 fases de implementación analizadas.

4. ✅ **Lectura de los 8 archivos de detalle** (`implement_fase1.md` a `implement_fase8.md`) — Código de implementación de ingeniería analizado fase por fase.

5. ✅ **Generación de `plan_implementacion_android.md`** — Plan de implementación unificado con:
   - Diagrama de arquitectura del sistema
   - Desglose detallado de las 8 fases
   - Consideraciones transversales (seguridad, rendimiento, compatibilidad OEM)
   - 6 preguntas abiertas que requieren confirmación del usuario

6. ✅ **Generación de `lista_tareas.md`** — Lista de tareas atómica con 60+ ítems checkeables organizados por fase, criterios de aceptación del MVP.

7. ✅ **Generación de `historial_acciones.md`** — Este archivo.

#### ❓ Preguntas Abiertas (pendientes de respuesta)

| # | Pregunta | Impacto |
|---|----------|---------|
| P1 | ¿Cuál es el `applicationId` final? (placeholder: `com.tutoriamobile`) | Fases 4, 5, 6 |
| P2 | ¿Las credenciales de Supabase del proyecto web son las mismas a usar en el móvil? | Fase 2 |
| P3 | ¿El PIN del Modo Escape se valida localmente o contra Supabase? | Fase 6, 7 |
| P4 | ¿Qué marcas de dispositivos Android se usarán en las pruebas? (Samsung, Xiaomi, etc.) | Fase 4 (whitelist del dialer) |
| P5 | ¿El bucket `evidencias` en Supabase Storage ya existe con políticas RLS configuradas? | Fase 2, 8 |
| P6 | ¿El `alumno_id` corresponde al `auth.uid()` de Supabase Auth? | Fases 2, 7, 8 |

#### 📝 Notas Técnicas de la Sesión

- **`react-native-vision-camera`** es la librería de cámara recomendada, pero requiere `minSdkVersion = 26`.
- **`UsageStatsManager.getRunningTasks`** fue deprecado por Google; se debe usar `queryEvents()` con evento `ACTIVITY_RESUMED`.
- **MIUI (Xiaomi) y OneUI (Samsung)** tienen agresiva optimización de batería que mata `Foreground Services`. Se deberá documentar el paso de configuración manual para el instalador.
- El overlay usa `TYPE_APPLICATION_OVERLAY` (único tipo permitido en Android moderno para dibujar sobre otras apps).
- El Bridge JNI expone métodos con `Promise`, no con callbacks, para compatibilidad con `async/await` en TypeScript.

---

## Sesión 2 — 2026-04-01

### Respuestas Confirmadas y Fase 1 Iniciada

**Agente:** Antigravity (Claude Sonnet 4.6)  
**Fase(s) trabajada(s):** Configuración + Fase 1

#### Decisiones Técnicas Confirmadas por el Usuario

| Pregunta | Respuesta | Impacto |
|----------|-----------|--------|
| applicationId | `com.tutoria.ia` | AndroidManifest, build.gradle, todos los archivos Kotlin |
| Supabase credentials | Mismas del proyecto web | Copiar del `.env` existente del proyecto web |
| PIN Escape | Local (Keychain), configurable en primer arranque | Se crea pantalla `FirstLaunchSetupScreen` |
| Dispositivo target | Motorola G35 (Android 14, stock) | Whitelist usa `com.android.dialer` estándar |
| Bucket Storage | Ya existe + RLS OK | No se requiere setup en Supabase |
| alumno_id | = `auth.uid()` | Simplifica queries y políticas RLS |

#### 📝 Nota adicional: Pantalla de Configuración Inicial (FirstLaunch)

Como el PIN es local pero configurable, se debe agregar una pantalla extra no documentada en el plan original:
- Se activa **una sola vez** al instalar (flag en Keychain: `setup_complete`)
- Pide al administrador ingresar y confirmar un PIN de 4–6 dígitos
- Guarda el PIN cifrado con `react-native-keychain`
- Una vez configurado, no vuelve a mostrarse

Esto afecta el flujo de `App.tsx`: `FirstLaunchSetup` → `PermissionsScreen` → `Dashboard`

#### Acciones Realizadas (Sesión 2 — COMPLETO)

1. ✅ **Actualizar `plan_implementacion_android.md` a v1.1** — decisiones confirmadas documentadas
2. ✅ **Fase 1.1** — Proyecto RN 0.84.1 inicializado en `TutorIaMobile/`
3. ✅ **Fase 1.2-1.3** — Instaladas: `react-native-keychain`, `react-native-fs`, `react-native-vision-camera`
4. ✅ **Fase 1.4-1.5** — `kotlinVersion = 2.1.20` ✅ / `minSdkVersion` subido de 24 → **26**
5. ✅ **Fase 1** — applicationId migrado de `com.tutoriamobile` → **`com.tutoria.ia`** (build.gradle + package Kotlin)
6. ✅ **Fase 2.1-2.2** — `@supabase/supabase-js`, `react-native-url-polyfill`, `react-native-dotenv` instalados; `babel.config.js` actualizado
7. ✅ **Fase 2.3** — `.env` plantilla creada en `TutorIaMobile/`
8. ✅ **Fase 2.4** — `src/lib/supabase.ts` con `SecureStorageAdapter` (Android Keystore)
9. ✅ **Fase 2.5** — `src/services/tareas.ts` con interfaz `Tarea` + `getTareasPendientes()`
10. ✅ **Fase 2.6** — `src/services/evidencias.ts` con flujo completo blob → Storage → DB → update tarea
11. ✅ **Fase 3 completa** — `AndroidManifest.xml` reemplazado con permisos + HOME + queries + EnforcerService
12. ✅ **Fase 4+5 completa** — `EnforcerService.kt` con monitoring loop + overlay de bloqueo
13. ✅ **Fase 6 completa** — `TutorEnforcerModule.kt`, `TutorEnforcerPackage.kt`, `MainApplication.kt`, `src/native/TutorEnforcer.ts`
14. ✅ **Extra: `src/services/pinService.ts`** — gestión cifrada del PIN de escape en Keychain
15. ✅ **Fase 7 completa** — `FirstLaunchSetupScreen.tsx`, `PermissionsScreen.tsx`, `Dashboard.tsx` (con Modo Escape, WhatsApp, Teléfono, BackHandler)
16. ✅ **Fase 8 completa** — `TareaDetalleScreen.tsx`, `CapturaEvidencia.tsx` (cámara → preview → upload)
17. ✅ **`App.tsx` reescrito** — máquina de estados: loading → firstLaunch → permissions → dashboard → tareaDetalle

#### ⚠️ Problema Encontrado y Resuelto

- `qualityPrioritization` no existe en `TakePhotoOptions` de esta versión de VisionCamera → **RESUELTO**: removida la propiedad

#### 🟡 Pendiente (requiere Motorola G35 conectado por USB)

- Compilación con `npm run android`
- Verificar logs de Enforcer con Logcat
- Test de bloqueo (abrir Chrome → overlay)
- Test de evidencia (foto → visible en Supabase web)
- **ACCIÓN CRÍTICA**: Rellenar `.env` con credenciales reales de Supabase antes de compilar

---

## 📋 Próximo Paso (al retomar)

**Acción inmediata — ANTES de compilar:**

```bash
# 1. Abrir el archivo .env y rellenar con las credenciales reales del proyecto web
nano /Users/omar/Documents/app-tutor-ia/TutorIaMobile/.env

# Ejemplo de lo que debe quedar:
# SUPABASE_URL=https://abcdefghijklm.supabase.co
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Luego, con el Motorola G35 conectado por USB con Depuración USB activada:**

```bash
cd /Users/omar/Documents/app-tutor-ia/TutorIaMobile

# Verificar que el dispositivo es reconocido
adb devices

# Compilar y desplegar en el dispositivo
npm run android

# Si hay errores de Gradle, intentar:
cd android && ./gradlew clean && cd .. && npm run android
```

**Después de la primera compilación exitosa:**
1. El dispositivo pedirá elegir el launcher por defecto → seleccionar **Tutor IA** y marcar "Siempre"
2. La app mostrará la pantalla de **Configuración Inicial** → el admin ingresa el PIN de escape
3. La app mostrará la pantalla de **Permisos** → activar "Superposición" y "Acceso a datos de uso" en Ajustes
4. El **Dashboard** cargará y el `EnforcerService` comenzará a vigilar

**Archivos a actualizar al completar:** Marcar tareas 1.7, 1.8, 2.8, 3.6, 3.7, 4.8, 5.8, 6.10, 7.X, 8.8 en `lista_tareas.md` y agregar Sesión 3 en este historial.

---

<!-- TEMPLATE PARA FUTURAS SESIONES — COPIAR Y RELLENAR -->

<!--
## Sesión N — YYYY-MM-DD

### [Título de la sesión]

**Agente:** [Nombre del agente]
**Fase(s) trabajada(s):** Fase X

#### Acciones Realizadas
1. ✅/⚠️ **[Tarea N.N]** — [Descripción de lo hecho]
   - Archivos creados/modificados: [lista]
   - Resultado: [éxito/error + detalle]

#### Problemas Encontrados
- ⚠️ [Descripción del problema y solución aplicada]

#### Próximo Paso
[Tarea exacta a ejecutar en la siguiente sesión]
-->
