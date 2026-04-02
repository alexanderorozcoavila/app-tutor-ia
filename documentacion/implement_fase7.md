Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 7: Desarrollo de la Interfaz Custom Launcher**.

El objetivo de esta fase es volver al ecosistema de React Native para construir la interfaz visual que reemplazará a la pantalla de inicio de Android. Esta interfaz debe ser "a prueba de escapes" (evitando que el botón *Atrás* cierre la app) y debe orquestar el inicio del motor de bloqueo nativo que construimos en las Fases 4 y 5.

---

### FASE 7: Desarrollo de la Interfaz (Custom Launcher Dashboard)

**Ruta base de trabajo:** `src/` (Entorno React Native / TypeScript)

#### Paso 7.1: Pantalla de Barrera de Permisos (Onboarding Administrativo)
Antes de que la app pueda funcionar como Launcher o bloquear otras apps, necesita permisos que solo el administrador (el padre o tutor) puede otorgar manualmente en los ajustes de Android. Crearemos una pantalla que bloquee el acceso al Dashboard hasta que el puente nativo (Fase 6) confirme que todo está en orden.

* **Crear componente:** `src/screens/PermissionsScreen.tsx`
* **Implementación:**
    ```tsx
    import React, { useEffect, useState } from 'react';
    import { View, Text, Button, StyleSheet, AppState } from 'react-native';
    import { TutorEnforcer, PermissionStatus } from '../native/TutorEnforcer';

    export const PermissionsScreen = ({ onPermissionsGranted }: { onPermissionsGranted: () => void }) => {
      const [status, setStatus] = useState<PermissionStatus>({ hasOverlay: false, hasUsageStats: false, allGranted: false });

      const checkStatus = async () => {
        const currentStatus = await TutorEnforcer.checkPermissions();
        setStatus(currentStatus);
        if (currentStatus.allGranted) {
          onPermissionsGranted(); // Desbloquea la navegación hacia el Dashboard
        }
      };

      // Re-evaluar cuando el usuario vuelve de la pantalla de ajustes de Android
      useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
          if (nextAppState === 'active') checkStatus();
        });
        checkStatus();
        return () => subscription.remove();
      }, []);

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Configuración Inicial Requerida</Text>
          
          {!status.hasOverlay && (
            <Button title="1. Permitir Superposición (Bloqueo visual)" onPress={TutorEnforcer.requestOverlayPermission} />
          )}
          
          {!status.hasUsageStats && (
            <Button title="2. Permitir Acceso a Uso (Monitor de Apps)" onPress={TutorEnforcer.requestUsageStatsPermission} />
          )}
          
          {status.allGranted && <Text style={styles.success}>¡Todo listo!</Text>}
        </View>
      );
    };

    const styles = StyleSheet.create({
      container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#1E293B' },
      title: { fontSize: 24, color: 'white', marginBottom: 20, textAlign: 'center' },
      success: { color: '#10B981', fontSize: 18, textAlign: 'center', marginTop: 20 }
    });
    ```

#### Paso 7.2: Desarrollo del Dashboard Restringido (El Launcher)
Esta es la pantalla principal que el alumno verá al presionar el botón "Inicio" físico o virtual del teléfono. Mostrará las tareas consultando el servicio de Supabase creado en la Fase 2.

* **Crear componente:** `src/screens/Dashboard.tsx`
* **Implementación Core:**
    ```tsx
    import React, { useEffect, useState } from 'react';
    import { View, Text, FlatList, StyleSheet, BackHandler } from 'react-native';
    import { getTareasPendientes, Tarea } from '../services/tareas';
    import { TutorEnforcer } from '../native/TutorEnforcer';

    export const Dashboard = ({ alumnoId }: { alumnoId: string }) => {
      const [tareas, setTareas] = useState<Tarea[]>([]);

      useEffect(() => {
        // 1. Activar el servicio nativo de vigilancia en segundo plano al cargar el Launcher
        TutorEnforcer.startService().catch(console.error);

        // 2. Cargar tareas desde Supabase
        const fetchTareas = async () => {
          try {
            const data = await getTareasPendientes(alumnoId);
            setTareas(data);
          } catch (error) {
            console.error(error);
          }
        };
        fetchTareas();

        // 3. SECUESTRO DE NAVEGACIÓN: Deshabilitar el botón físico de "Atrás" en Android
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          return true; // Retornar true evita que el SO cierre la actividad
        });

        return () => backHandler.remove();
      }, [alumnoId]);

      const renderTarea = ({ item }: { item: Tarea }) => (
        <View style={styles.card}>
          <Text style={styles.tareaTitle}>{item.titulo}</Text>
          <Text style={styles.tareaDesc}>{item.descripcion}</Text>
        </View>
      );

      return (
        <View style={styles.container}>
          <Text style={styles.header}>Tutor IA - Modo Estudio</Text>
          <FlatList
            data={tareas}
            keyExtractor={(item) => item.id}
            renderItem={renderTarea}
            ListEmptyComponent={<Text style={styles.empty}>No hay tareas pendientes. ¡Buen trabajo!</Text>}
          />
        </View>
      );
    };

    const styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 40 },
      header: { fontSize: 28, fontWeight: 'bold', color: '#0F172A', textAlign: 'center', marginBottom: 20 },
      card: { backgroundColor: 'white', padding: 20, marginHorizontal: 15, marginBottom: 10, borderRadius: 10, elevation: 2 },
      tareaTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
      tareaDesc: { color: '#64748B', marginTop: 5 },
      empty: { textAlign: 'center', color: '#64748B', marginTop: 50 }
    });
    ```

#### Paso 7.3: Integración de Aplicaciones Permitidas (Whitelist Logic)
El alumno necesita poder acceder a WhatsApp y realizar llamadas sin que el `EnforcerService` lance la pantalla de bloqueo rojo.

* **Modificación en `Dashboard.tsx`:** Añadir los botones de acceso rápido usando la API `Linking` de React Native.
* **Detalle Técnico:** Debido a que en la Fase 4 añadimos `com.whatsapp` y `com.android.dialer` a la lista blanca (`WHITELIST`) en el código nativo de Kotlin, cuando React Native ejecute estos `openURL`, el servicio de fondo verá el cambio de paquete, consultará la lista blanca, la validará como verdadera y **no** dibujará el *Overlay* de bloqueo.

    ```tsx
    import { TouchableOpacity, Linking, Alert } from 'react-native';

    // ... (dentro del componente Dashboard)

    const openWhatsApp = async () => {
      const url = 'whatsapp://app';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp no está instalado en este dispositivo.");
      }
    };

    const openDialer = () => {
      Linking.openURL('tel:');
    };

    // Añadir esto debajo de la FlatList en el return:
    <View style={styles.footerRow}>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366' }]} onPress={openWhatsApp}>
        <Text style={styles.actionText}>WhatsApp</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={openDialer}>
        <Text style={styles.actionText}>Teléfono</Text>
      </TouchableOpacity>
    </View>
    ```

#### Paso 7.4: Modo Escape (Botón Oculto para Administradores)
Para que tú o un padre pueda actualizar el teléfono, modificar ajustes wifi o salir del Launcher, se necesita una forma de apagar el servicio nativo. El estándar en este tipo de apps es un botón invisible o una acción repetitiva (como el modo desarrollador de Android).

* **Modificación en `Dashboard.tsx`:** Añadir un contador de "taps" al título.
    ```tsx
    const [tapCount, setTapCount] = useState(0);

    const handleSecretTap = () => {
      setTapCount(prev => prev + 1);
      if (tapCount + 1 >= 7) { // Al tocar 7 veces el título
        setTapCount(0);
        // En producción, esto debería abrir un Modal pidiendo una contraseña/PIN numérico
        // que luego se envíe a la función nativa:
        TutorEnforcer.stopService("1234") 
          .then(() => Alert.alert("Servicio Apagado", "El modo estudio se ha desactivado temporalmente."))
          .catch((err) => console.error(err));
      }
    };

    // En el JSX:
    <TouchableOpacity activeOpacity={1} onPress={handleSecretTap}>
        <Text style={styles.header}>Tutor IA - Modo Estudio</Text>
    </TouchableOpacity>
    ```

Con esto, la interfaz gráfica está lista para secuestrar la atención del usuario de manera productiva, manteniéndolo en su flujo de tareas mientras el motor nativo opera silenciosamente de fondo.

http://googleusercontent.com/interactive_content_block/0