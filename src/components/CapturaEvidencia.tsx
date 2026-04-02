import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {uploadEvidencia} from '../services/evidencias';
import {Tarea} from '../services/tareas';

interface Props {
  tarea: Tarea;
  onCancelar: () => void;
  onExito: () => void;
}

/**
 * Componente de captura de evidencia fotográfica.
 * Flujo: cámara → previsualización → subida a Supabase Storage.
 */
export const CapturaEvidencia: React.FC<Props> = ({tarea, onCancelar, onExito}) => {
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Iniciando cámara...</Text>
      </View>
    );
  }

  // ─── Captura ────────────────────────────────────────────────────────────

  const tomarFoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          flash: 'auto',
        });
        // Vision Camera devuelve path relativo en Android, debe prefijarse con file://
        setFotoPath(`file://${photo.path}`);
      } catch (e) {
        console.error('[Cámara] Error al capturar:', e);
        Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
      }
    }
  };

  // ─── Subida ─────────────────────────────────────────────────────────────

  const confirmarYSubir = async () => {
    if (!fotoPath) {
      return;
    }
    setSubiendo(true);
    try {
      await uploadEvidencia(tarea.id, tarea.assigned_to, fotoPath);
      onExito(); // Vuelve al Dashboard con tarea ya completada
    } catch (error) {
      console.error('[Evidencia] Error al subir:', error);
      Alert.alert(
        'Error de conexión',
        'No se pudo enviar la tarea. Verifica tu conexión a internet.',
      );
      setSubiendo(false);
    }
  };

  // ─── Vista de previsualización (foto ya tomada) ──────────────────────────

  if (fotoPath) {
    return (
      <View style={styles.container}>
        <Image source={{uri: fotoPath}} style={styles.previewImage} resizeMode="contain" />

        {subiendo ? (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.uploadingText}>Enviando tarea... ⬆️</Text>
          </View>
        ) : (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.btn, {backgroundColor: '#EF4444'}]}
              onPress={() => setFotoPath(null)}>
              <Text style={styles.btnText}>📷 Repetir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, {backgroundColor: '#10B981'}]}
              onPress={confirmarYSubir}>
              <Text style={styles.btnText}>✅ Enviar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ─── Vista de la cámara en vivo ──────────────────────────────────────────

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
        <TouchableOpacity
          style={[styles.btn, {backgroundColor: '#64748B'}]}
          onPress={onCancelar}>
          <Text style={styles.btnText}>✖ Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureBtn} onPress={tomarFoto}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        {/* Espacio para centrar el botón de captura */}
        <View style={[styles.btn, {opacity: 0}]}>
          <Text style={styles.btnText}>Cancelar</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000000', justifyContent: 'flex-end'},
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {color: '#94A3B8', marginTop: 12, fontSize: 15},
  previewImage: {flex: 1},
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  btnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15},
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  uploadingOverlay: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    borderRadius: 16,
  },
  uploadingText: {color: '#10B981', marginTop: 12, fontSize: 16, fontWeight: '600'},
});
