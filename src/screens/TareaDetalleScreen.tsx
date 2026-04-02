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
  Animated,
} from 'react-native';
import {useCameraPermission} from 'react-native-vision-camera';
import {Tarea, TIPO_LABELS} from '../services/tareas';
import {CapturaEvidencia} from '../components/CapturaEvidencia';
import {completarTareaSinFoto} from '../services/evidencias';
import {validateEscapePin} from '../services/pinService';
import {TutorEnforcer} from '../native/TutorEnforcer';

import {MC_COLORS, MC_FONTS, MC_TASK_COLORS, MC_TASK_EMOJI, MC_XP_BY_TYPE} from '../theme/minecraft';
import {PixelBlock, InvSlot} from '../components/minecraft/PixelBlock';
import {McButton} from '../components/minecraft/McButton';

interface Props {
  tarea: Tarea;
  onVolver: () => void;
}

export const TareaDetalleScreen: React.FC<Props> = ({tarea, onVolver}) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const [modoCamara, setModoCamara] = useState(false);
  const [completando, setCompletando] = useState(false);

  // Modal Admin
  const [tapCount, setTapCount] = useState(0);
  const [showEscapeModal, setShowEscapeModal] = useState(false);
  const [escapePin, setEscapePin] = useState('');
  const [stopping, setStopping] = useState(false);

  // Toast Animado (+XP)
  const [toastVisible, setToastVisible] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const showToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {toValue: 0, duration: 300, useNativeDriver: true}),
    ]).start(() => {
      setToastVisible(false);
      onVolver();
    });
  };

  const iniciarCamara = async () => {
    let granted = hasPermission;
    if (!granted) {
      granted = await requestPermission();
    }
    if (!granted) {
      Alert.alert('Permiso Denegado', 'Se necesita acceso a la cámara.');
      return;
    }
    setModoCamara(true);
  };

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
              showToast();
            } catch (error) {
              Alert.alert('Error', 'No se pudo marcar la tarea.');
              console.error('[TareaDetalle] Error:', error);
            } finally {
              setCompletando(false);
            }
          },
        },
      ],
    );
  };

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
      setShowEscapeModal(false);
      if ((TutorEnforcer as any).disableLauncherAndExit) {
        Alert.alert('Modo Estudio Desactivado 🔓', 'Aplicando desactivación...');
        setTimeout(async () => {
          await (TutorEnforcer as any).disableLauncherAndExit();
        }, 1200);
      } else {
        await TutorEnforcer.stopService();
        Alert.alert('Desactivado', 'El modo kiosk fue detenido.');
      }
    } else {
      Alert.alert('PIN incorrecto', 'Inténtalo de nuevo.');
    }
    setStopping(false);
  };

  if (modoCamara) {
    return (
      <CapturaEvidencia
        tarea={tarea}
        onCancelar={() => setModoCamara(false)}
        onExito={() => {
          setModoCamara(false);
          showToast();
        }}
      />
    );
  }

  const tCol = MC_TASK_COLORS[tarea.type] || MC_TASK_COLORS.reading;
  const emoji = MC_TASK_EMOJI[tarea.type] || '📚';
  const typeLabel = (TIPO_LABELS[tarea.type] ?? tarea.type).toUpperCase();
  const xp = MC_XP_BY_TYPE[tarea.type] || 50;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Bloque Tipo (7 taps) */}
        <TouchableOpacity activeOpacity={1} onPress={handleSecretTap}>
          <PixelBlock
            bg={MC_COLORS.bgWood}
            light={MC_COLORS.borderWoodLight}
            shadow={MC_COLORS.borderWoodShadow}
            style={styles.headerBlock}>
            <View style={[styles.badge, {backgroundColor: tCol.bg, borderColor: tCol.light}]}>
              <Text style={{color: MC_COLORS.textWhite, fontSize: 16}}>{emoji}</Text>
            </View>
            <Text style={styles.headerText}>{typeLabel}</Text>
          </PixelBlock>
        </TouchableOpacity>

        {/* Título de misión */}
        <Text style={styles.title}>{tarea.title}</Text>

        {/* Recompensa */}
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>RECOMPENSA MENTAL: </Text>
          <Text style={styles.xpValue}>+{xp} XP</Text>
        </View>

        {/* Banner Urgente / Rechazada */}
        {tarea.status === 'rejected' && (
          <PixelBlock
            bg={MC_COLORS.bgUrgent}
            light={MC_COLORS.borderUrgentLight}
            shadow={MC_COLORS.borderUrgentShadow}
            style={styles.rejectedBanner}>
            <Text style={styles.rejectedIcon}>⚠️</Text>
            <View style={{flex: 1}}>
              <Text style={styles.rejectedTitle}>¡MISIÓN RECHAZADA!</Text>
              {tarea.reason_not_done ? (
                <Text style={styles.rejectedReason}>{tarea.reason_not_done}</Text>
              ) : null}
            </View>
          </PixelBlock>
        )}

        {/* Detalles / Inventario style */}
        <PixelBlock bg="#333333" light="#555555" shadow="#1a1a1a" style={styles.instructionsContainer}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsTitle}>INSTRUCCIONES DEL MAPA</Text>
          </View>
          <Text style={styles.instructionsText}>
            {tarea.description ?? 'Explora y descubre el objetivo...'}
          </Text>
        </PixelBlock>

        {/* Acciones */}
        <View style={styles.actions}>
          <McButton variant="blue" icon="📸" onPress={iniciarCamara} fullWidth>
            CAPTURAR EVIDENCIA
          </McButton>
          <View style={{height: 16}} />
          <McButton variant="green" icon="✅" disabled={completando} onPress={handleCompletarSinFoto} fullWidth subtitle="No requiere foto">
            {completando ? '...' : 'MISIÓN COMPLETADA'}
          </McButton>
          <View style={{height: 16}} />
          <McButton variant="gray" onPress={onVolver} fullWidth>
            VOLVER AL INVENTARIO
          </McButton>
        </View>
      </ScrollView>

      {/* Toast MC */}
      {toastVisible && (
        <Animated.View style={[styles.toastContainer, {opacity: fadeAnim}]}>
          <PixelBlock bg={MC_COLORS.textGold} light="#FFFF55" shadow="#885500" borderWidth={4} style={styles.toastBlock}>
            <Text style={styles.toastEmoji}>🎉</Text>
            <Text style={styles.toastText}>¡MISIÓN COMPLETADA!</Text>
            <Text style={styles.toastXp}>+{xp} XP</Text>
          </PixelBlock>
        </Animated.View>
      )}

      {/* Modal Admin */}
      <Modal visible={showEscapeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <PixelBlock bg="#1E293B" light="#334155" shadow="#0F172A" style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔓 ACCESO ADMIN</Text>
            <Text style={styles.modalDesc}>El administrador debe ingresar el PIN</Text>
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
              <McButton variant="gray" onPress={() => setShowEscapeModal(false)}>CANCELAR</McButton>
              <View style={{width: 10}} />
              <McButton variant="red" disabled={stopping} onPress={handleEscapeValidate}>
                {stopping ? '...' : 'DESBLOQUEAR'}
              </McButton>
            </View>
          </PixelBlock>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: MC_COLORS.bgDark},
  content: {padding: 20, paddingTop: 40, paddingBottom: 40},
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
    gap: 10,
  },
  badge: {
    width: 32, height: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 12,
    color: MC_COLORS.textYellow,
  },
  title: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 16,
    color: MC_COLORS.textWhite,
    lineHeight: 24,
    marginBottom: 10,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  xpText: {
    fontFamily: MC_FONTS.mono,
    fontSize: 20,
    color: MC_COLORS.textMuted,
  },
  xpValue: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 10,
    color: MC_COLORS.textGold,
  },
  rejectedBanner: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 20,
    gap: 10,
    alignItems: 'center',
  },
  rejectedIcon: {fontSize: 24},
  rejectedTitle: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 10,
    color: MC_COLORS.textYellow,
    marginBottom: 4,
  },
  rejectedReason: {
    fontFamily: MC_FONTS.mono,
    fontSize: 18,
    color: MC_COLORS.textWhite,
  },
  instructionsContainer: {
    padding: 16,
    marginBottom: 30,
  },
  instructionsHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#222222',
    paddingBottom: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 10,
    color: MC_COLORS.textMuted,
  },
  instructionsText: {
    fontFamily: MC_FONTS.mono,
    fontSize: 22,
    color: MC_COLORS.textWhite,
    lineHeight: 28,
  },
  actions: {
    gap: 16,
  },
  toastContainer: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  toastBlock: {
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: {width: 5, height: 5},
    shadowRadius: 0,
  },
  toastEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  toastText: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 10,
    color: MC_COLORS.bgDark,
    marginBottom: 10,
  },
  toastXp: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 14,
    color: '#1a4a1a',
  },
  // Modal Admin
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 12,
    color: MC_COLORS.textWhite,
    marginBottom: 10,
  },
  modalDesc: {
    fontFamily: MC_FONTS.mono,
    fontSize: 16,
    color: MC_COLORS.textMuted,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: MC_COLORS.bgDark,
    color: MC_COLORS.textWhite,
    fontFamily: MC_FONTS.pixel,
    fontSize: 18,
    textAlign: 'center',
    padding: 12,
    width: '100%',
    borderWidth: 2,
    borderColor: MC_COLORS.borderStoneLight,
    marginBottom: 20,
    letterSpacing: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
});
