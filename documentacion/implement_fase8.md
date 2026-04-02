Aquí tienes el desglose detallado a nivel de ingeniería para la **Fase 8: Ejecución de Tareas y Evidencias**.

Esta es la fase final del flujo principal del alumno. El objetivo es permitirle seleccionar una tarea del *Dashboard* (creado en la Fase 7), ver los detalles de lo que debe hacer, y utilizar la cámara del dispositivo dentro del entorno seguro para fotografiar su trabajo (como un cuaderno o una manualidad) y subirlo a la base de datos de Supabase.

---

### FASE 8: Ejecución de Tareas y Evidencias

**Ruta base de trabajo:** `src/` (Entorno React Native / TypeScript)

#### Paso 8.1: Pantalla de Detalle de Tarea y Preparación
Cuando el alumno selecciona una tarea en el *Dashboard*, debe navegar a una pantalla específica donde se muestran las instrucciones y se habilita el botón para capturar la evidencia.

* **Crear componente:** `src/screens/TareaDetalleScreen.tsx`
* **Gestión de Permisos de Cámara:** Antes de inicializar la cámara, React Native debe pedir permiso al usuario (el sistema operativo). `react-native-vision-camera` tiene hooks nativos para esto.

```tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import { Tarea } from '../services/tareas';

export const TareaDetalleScreen = ({ tarea, onVolver }: { tarea: Tarea, onVolver: () => void }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [modoCamara, setModoCamara] = useState(false);

  const iniciarCamara = async () => {
    if (!hasPermission) {
      const isGranted = await requestPermission();
      if (!isGranted) {
        Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para subir la evidencia.");
        return;
      }
    }
    setModoCamara(true);
  };

  if (modoCamara) {
    // Renderizamos el componente de la cámara (Paso 8.2)
    return <CapturaEvidencia tarea={tarea} onCancelar={() => setModoCamara(false)} onExito={onVolver} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tarea.titulo}</Text>
      <Text style={styles.descripcion}>{tarea.descripcion}</Text>
      
      <View style={styles.footer}>
        <Button title="Tomar foto de la tarea" onPress={iniciarCamara} color="#3B82F6" />
        <View style={{ marginTop: 10 }}>
          <Button title="Volver al inicio" onPress={onVolver} color="#64748B" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginTop: 40 },
  descripcion: { fontSize: 18, color: '#334155', marginTop: 20, lineHeight: 28 },
  footer: { marginBottom: 30 }
});
```

#### Paso 8.2: Integración del Módulo de Captura (Vision Camera)
`react-native-vision-camera` es potente pero requiere configurar explícitamente el dispositivo de hardware (lente trasero) y manejar el ciclo de vida para que la cámara no quede encendida en segundo plano consumiendo batería.

* **Crear componente:** `src/components/CapturaEvidencia.tsx`
* **Implementación:**

```tsx
import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { uploadEvidencia } from '../services/evidencias';
import { Tarea } from '../services/tareas';

export const CapturaEvidencia = ({ tarea, onCancelar, onExito }: { tarea: Tarea, onCancelar: () => void, onExito: () => void }) => {
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  if (device == null) return <ActivityIndicator size="large" color="#3B82F6" />;

  const tomarFoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: 'auto',
          qualityPrioritization: 'speed'
        });
        // Vision Camera devuelve un path relativo en Android, debemos prefijarlo con file://
        setFotoPath(`file://${photo.path}`);
      } catch (e) {
        console.error("Error al capturar:", e);
      }
    }
  };

  // ... Continuación en el Paso 8.3 y 8.4
```

#### Paso 8.3: Previsualización de la Evidencia
Es fundamental que el alumno pueda revisar si la foto salió borrosa antes de enviarla. Si la foto ya fue tomada (`fotoPath` tiene valor), en lugar de mostrar el visor de la cámara, mostramos un componente `<Image>` estático con opciones de confirmación.

* **Modificación en `CapturaEvidencia.tsx`:**

```tsx
  // ... (Continuación dentro del componente CapturaEvidencia)

  if (fotoPath) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: fotoPath }} style={styles.previewView} />
        
        {subiendo ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={{ color: 'white', marginTop: 10 }}>Subiendo tarea...</Text>
          </View>
        ) : (
          <View style={styles.controlsRow}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={() => setFotoPath(null)}>
              <Text style={styles.btnText}>Repetir</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={confirmarYSubir}>
              <Text style={styles.btnText}>Enviar Evidencia</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Si no hay foto, mostramos la cámara en vivo
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      
      <View style={styles.controlsRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#64748B' }]} onPress={onCancelar}>
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.captureBtn} onPress={tomarFoto}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
```

#### Paso 8.4: Ejecución de la Subida a Supabase
Conectamos la función del botón "Enviar Evidencia" con el servicio de base de datos que creamos en la Fase 2, gestionando el estado de carga (`subiendo`) para bloquear la interfaz mientras el binario viaja por la red.

* **Añadir la función `confirmarYSubir` al componente `CapturaEvidencia.tsx`:**

```tsx
  const confirmarYSubir = async () => {
    if (!fotoPath) return;
    setSubiendo(true);
    
    try {
      // Llamada al servicio implementado en la Fase 2 (src/services/evidencias.ts)
      // Nota: Asumimos que la tarea trae el alumno_id o lo obtenemos del contexto global
      await uploadEvidencia(tarea.id, tarea.alumno_id, fotoPath);
      
      // Si el código llega aquí, la promesa se resolvió correctamente
      onExito(); // Esto devolverá al usuario al Dashboard
    } catch (error) {
      console.error("Error al subir:", error);
      Alert.alert("Error", "No se pudo enviar la tarea. Verifica tu conexión a internet.");
      setSubiendo(false);
    }
  };
```

* **Estilos recomendados para la cámara (`styles`):**

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'flex-end' },
  previewView: { flex: 1, resizeMode: 'contain' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 40, paddingTop: 20 },
  btn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'white' },
  loadingContainer: { position: 'absolute', bottom: 50, alignSelf: 'center', alignItems: 'center' }
});
```