import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Alert,
  Linking,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {getTareasPendientes, Tarea, TIPO_LABELS} from '../services/tareas';
import {TutorEnforcer} from '../native/TutorEnforcer';
import {validateEscapePin} from '../services/pinService';

interface Props {
  alumnoId: string;
  onSelectTarea: (tarea: Tarea) => void;
}

/**
 * Dashboard principal — funciona como Custom Launcher.
 * - Activa el EnforcerService al cargarse
 * - Bloquea el botón físico "Atrás"
 * - Muestra las tareas pendientes desde Supabase
 * - Permite acceder a WhatsApp y Teléfono (apps de la whitelist)
 * - Modo Escape oculto: 7 taps en el título → solicita PIN
 */
export const Dashboard: React.FC<Props> = ({alumnoId, onSelectTarea}) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [tapCount, setTapCount] = useState(0);
  const [showEscapeModal, setShowEscapeModal] = useState(false);
  const [escapePin, setEscapePin] = useState('');
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    // 1. Iniciar el servicio nativo de vigilancia
    TutorEnforcer.startService().catch(err =>
      console.error('[Dashboard] Error al iniciar servicio:', err),
    );

    // 2. Cargar tareas desde Supabase
    fetchTareas();

    // 3. Bloquear el botón físico "Atrás" de Android
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,  // retornar true previene la navegación hacia atrás
    );

    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoId]);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      const data = await getTareasPendientes(alumnoId);
      setTareas(data);
    } catch (error) {
      console.error('[Dashboard] Error al cargar tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Botones de apps permitidas ──────────────────────────────────────────

  const openWhatsApp = async () => {
    const url = 'whatsapp://app';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp no instalado', 'Este dispositivo no tiene WhatsApp.');
    }
  };

  const openDialer = async () => {
    const url = 'tel:';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No disponible', 'No se pudo abrir la aplicación de llamadas.');
    }
  };


  // ─── Modo Escape (7 taps ocultos en el título) ───────────────────────────

  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 7) {
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
        'Modo Estudio Desactivado',
        'Puedes usar el dispositivo libremente. Vuelve a abrir Tutor IA para reactivarlo.',
      );
    } else {
      Alert.alert('PIN Incorrecto', 'El PIN ingresado no es válido.');
    }
    setStopping(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const renderTarea = ({item}: {item: Tarea}) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectTarea(item)}>
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>
          {(TIPO_LABELS[item.type] ?? item.type).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description ?? ''}</Text>
      {item.status === 'rejected' && (
        <Text style={styles.cardRejected}>⚠️ Rechazada — vuelve a intentarlo</Text>
      )}
      <Text style={styles.cardCta}>Tap para comenzar →</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header con tap secreto */}
      <TouchableOpacity activeOpacity={1} onPress={handleSecretTap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📚 Tutor IA</Text>
          <Text style={styles.headerSubtitle}>Modo Estudio Activo</Text>
        </View>
      </TouchableOpacity>

      {/* Lista de tareas */}
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={tareas}
          keyExtractor={item => item.id}
          renderItem={renderTarea}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>¡No hay tareas pendientes!</Text>
              <Text style={styles.emptySubtitle}>Buen trabajo, lo completaste todo.</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchTareas}
        />
      )}

      {/* Botones de apps permitidas */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, {backgroundColor: '#25D366'}]}
          onPress={openWhatsApp}>
          <Text style={styles.footerBtnText}>💬  WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, {backgroundColor: '#3B82F6'}]}
          onPress={openDialer}>
          <Text style={styles.footerBtnText}>📞  Teléfono</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Modo Escape */}
      <Modal visible={showEscapeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔓 Modo Escape</Text>
            <Text style={styles.modalDesc}>Ingresa el PIN de administrador</Text>
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
                style={[styles.modalBtn, {backgroundColor: '#EF4444'}]}
                onPress={() => setShowEscapeModal(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#3B82F6'}]}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F1F5F9'},
  header: {
    backgroundColor: '#0F172A',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {fontSize: 28, fontWeight: 'bold', color: '#F8FAFC'},
  headerSubtitle: {fontSize: 14, color: '#3B82F6', marginTop: 4},
  list: {padding: 16, paddingBottom: 80},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
  },
  cardBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  cardBadgeText: {fontSize: 11, color: '#3B82F6', fontWeight: '700'},
  cardTitle: {fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6},
  cardDesc: {fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 8},
  cardRejected: {fontSize: 13, color: '#EF4444', fontWeight: '600', marginBottom: 8},
  cardCta: {fontSize: 13, color: '#3B82F6', fontWeight: '600'},
  emptyContainer: {alignItems: 'center', paddingTop: 60},
  emptyEmoji: {fontSize: 64, marginBottom: 16},
  emptyTitle: {fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 8},
  emptySubtitle: {fontSize: 16, color: '#64748B'},
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  footerBtnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 28,
  },
  modalTitle: {fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 8},
  modalDesc: {fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 20},
  modalInput: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtons: {flexDirection: 'row', gap: 12},
  modalBtn: {flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center'},
  modalBtnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15},
});
