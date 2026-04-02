import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useCameraPermission} from 'react-native-vision-camera';
import {Tarea, TIPO_LABELS} from '../services/tareas';
import {CapturaEvidencia} from '../components/CapturaEvidencia';
import {completarTareaSinFoto} from '../services/evidencias';
import {validateEscapePin} from '../services/pinService';
import {TutorEnforcer} from '../native/TutorEnforcer';

interface Props {
  tarea: Tarea;
  onVolver: () => void;
}

/**
 * Pantalla de detalle de tarea.
 * Permite:
 *  - Ver instrucciones de la tarea
 *  - Tomar foto de evidencia y marcar como completada
 *  - Completar la tarea sin foto (para tareas domésticas, etc.)
 *  - Acceso de administrador (7 taps en el título → PIN → detiene el kiosk)
 */
export const TareaDetalleScreen: React.FC<Props> = ({tarea, onVolver}) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const [modoCamara, setModoCamara] = useState(false);
  const [completando, setCompletando] = useState(false);

  // ─── Estado del modal de escape admin ────────────────────────────────────
  const [tapCount, setTapCount] = useState(0);
  const [showEscapeModal, setShowEscapeModal] = useState(false);
  const [escapePin, setEscapePin] = useState('');
  const [stopping, setStopping] = useState(false);

  // ─── Cámara ───────────────────────────────────────────────────────────────

  const iniciarCamara = async () => {
    let granted = hasPermission;
    if (!granted) {
      granted = await requestPermission();
    }
    if (!granted) {
      Alert.alert(
        'Permiso Denegado',
        'Se necesita acceso a la cámara para subir la evidencia de la tarea.',
      );
      return;
    }
    setModoCamara(true);
  };

  // ─── Completar sin foto ───────────────────────────────────────────────────

  const handleCompletarSinFoto = () => {
    Alert.alert(
      '✅ Marcar como completada',
      '¿Confirmas que terminaste esta tarea?\n\nSe marcará como completada sin adjuntar foto.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Confirmar',
          onPress: async () => {
            setCompletando(true);
            try {
              await completarTareaSinFoto(tarea.id);
              Alert.alert(
                '¡Excelente! 🎉',
                '¡Tarea completada! Sigue así.',
                [{text: 'Volver', onPress: onVolver}],
              );
            } catch (error) {
              Alert.alert('Error', 'No se pudo marcar la tarea. Verifica tu conexión.');
              console.error('[TareaDetalle] Error:', error);
            } finally {
              setCompletando(false);
            }
          },
        },
      ],
    );
  };

  // ─── Tap secreto en badge → acceso admin ─────────────────────────────────

  const handleSecretTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 7) {
      setTapCount(0);
      setEscapePin('');
      setShowEscapeModal(true);
    }
  };

  const handleEscapeValidate = async () => {
    setStopping(true);
    const isValid = await validateEscapePin(escapePin);
    if (isValid) {
      await TutorEnforcer.stopService();
      setShowEscapeModal(false);
      Alert.alert(
        'Modo Estudio Desactivado 🔓',
        'El modo kiosk fue detenido. Puedes usar el dispositivo libremente.\n\nAbre Tutor IA nuevamente para reactivarlo.',
      );
    } else {
      Alert.alert('PIN incorrecto', 'El PIN ingresado no es válido. Inténtalo de nuevo.');
    }
    setStopping(false);
  };

  // ─── Modo cámara activo ───────────────────────────────────────────────────

  if (modoCamara) {
    return (
      <CapturaEvidencia
        tarea={tarea}
        onCancelar={() => setModoCamara(false)}
        onExito={() => {
          setModoCamara(false);
          Alert.alert('¡Tarea enviada! 🎉', 'Tu evidencia fue recibida. ¡Buen trabajo!', [
            {text: 'Volver', onPress: onVolver},
          ]);
        }}
      />
    );
  }

  const tipoColor = getTipoColor(tarea.type);
  const tipoLabel = TIPO_LABELS[tarea.type] ?? tarea.type;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Badge de tipo — 7 taps activan el modo escape admin */}
      <TouchableOpacity activeOpacity={1} onPress={handleSecretTap}>
        <View style={[styles.tipoBadge, {backgroundColor: tipoColor + '22'}]}>
          <Text style={[styles.tipoText, {color: tipoColor}]}>
            {getTipoEmoji(tarea.type)}  {tipoLabel.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Título */}
      <Text style={styles.title}>{tarea.title}</Text>

      {/* Instrucciones */}
      <View style={styles.instruccionesCard}>
        <Text style={styles.instruccionesLabel}>📋 Instrucciones</Text>
        <Text style={styles.instruccionesText}>
          {tarea.description ?? 'Sin instrucciones adicionales.'}
        </Text>
      </View>

      {/* Banner de rechazada (si aplica) */}
      {tarea.status === 'rejected' && (
        <View style={styles.rejectedBanner}>
          <Text style={styles.rejectedIcon}>⚠️</Text>
          <View style={{flex: 1}}>
            <Text style={styles.rejectedTitle}>Tarea rechazada</Text>
            {tarea.reason_not_done ? (
              <Text style={styles.rejectedReason}>{tarea.reason_not_done}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Botón de evidencia fotográfica */}
      <TouchableOpacity style={styles.cameraButton} onPress={iniciarCamara}>
        <Text style={styles.cameraButtonText}>📸  Tomar foto de evidencia</Text>
      </TouchableOpacity>

      {/* Botón de completar sin foto */}
      <TouchableOpacity
        style={[styles.doneButton, completando && styles.buttonDisabled]}
        onPress={handleCompletarSinFoto}
        disabled={completando}>
        {completando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.doneButtonText}>✅  Marcar como completada</Text>
        )}
      </TouchableOpacity>

      {/* Botón de regreso */}
      <TouchableOpacity style={styles.backButton} onPress={onVolver}>
        <Text style={styles.backButtonText}>← Volver al inicio</Text>
      </TouchableOpacity>

      {/* ─── Modal de escape para administrador ─── */}
      <Modal visible={showEscapeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔓 Acceso de Administrador</Text>
            <Text style={styles.modalDesc}>
              Ingresa el PIN para desactivar el modo estudio
            </Text>
            <TextInput
              style={styles.modalInput}
              value={escapePin}
              onChangeText={setEscapePin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor="#64748B"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#475569'}]}
                onPress={() => setShowEscapeModal(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#EF4444'}]}
                onPress={handleEscapeValidate}
                disabled={stopping}>
                {stopping ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTipoColor = (type: string): string => {
  const colors: Record<string, string> = {
    reading:    '#8B5CF6',
    dictation:  '#3B82F6',
    domestic:   '#10B981',
    assessment: '#F59E0B',
  };
  return colors[type.toLowerCase()] ?? '#64748B';
};

const getTipoEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    reading:    '📖',
    dictation:  '✏️',
    domestic:   '🏠',
    assessment: '📝',
  };
  return emojis[type.toLowerCase()] ?? '📚';
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F1F5F9'},
  content: {padding: 24, paddingTop: 48, paddingBottom: 48},
  tipoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 16,
  },
  tipoText: {fontSize: 12, fontWeight: '800', letterSpacing: 0.5},
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 24,
  },
  instruccionesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  instruccionesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  instruccionesText: {fontSize: 17, color: '#1E293B', lineHeight: 28},
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rejectedIcon: {fontSize: 20},
  rejectedTitle: {fontSize: 14, fontWeight: '700', color: '#DC2626', marginBottom: 2},
  rejectedReason: {fontSize: 13, color: '#9B1C1C', lineHeight: 18},
  cameraButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cameraButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  doneButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  buttonDisabled: {opacity: 0.6},
  doneButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  backButton: {padding: 14, alignItems: 'center'},
  backButtonText: {color: '#64748B', fontSize: 15, fontWeight: '600'},
  // Modal de escape
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    letterSpacing: 10,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtons: {flexDirection: 'row', gap: 12},
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15},
});
