import React, {useEffect, useState, useMemo} from 'react';
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
  Animated,
} from 'react-native';
import {getTodasTareas, getPlanSemanalYBaseTasksHoy, getHistorialDiarioHoy, Tarea, TIPO_LABELS} from '../services/tareas';
import {TutorEnforcer} from '../native/TutorEnforcer';
import {validateEscapePin} from '../services/pinService';

import {MC_COLORS, MC_FONTS, MC_TASK_COLORS, MC_TASK_EMOJI, MC_XP_BY_TYPE} from '../theme/minecraft';
import {SkyBackground} from '../components/minecraft/SkyBackground';
import {XpBar} from '../components/minecraft/XpBar';
import {StatBlock, PixelBlock} from '../components/minecraft/PixelBlock';
import {McButton} from '../components/minecraft/McButton';
import {InventoryBar} from '../components/minecraft/InventoryBar';

interface Props {
  alumnoId: string;
  onSelectTarea: (tarea: Tarea) => void;
}

export const Dashboard: React.FC<Props> = ({alumnoId, onSelectTarea}) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoPlan, setModoPlan] = useState(false);
  const [metaPuntos, setMetaPuntos] = useState(100);
  const [dailyLevelOverride, setDailyLevelOverride] = useState<number | null>(null);

  // Stats y XP
  const { xpTotal, xpObtenida, xpEnRevision, nivel, medalla } = useMemo(() => {
    let xpT = modoPlan ? metaPuntos : 0;
    let xpHoyTotal = 0;
    let xpO = 0;
    let xpR = 0;

    tareas.forEach(t => {
      const px = t.score || MC_XP_BY_TYPE[t.type] || 50;
      if (!modoPlan) xpT += px;
      xpHoyTotal += px;
      
      if (t.status === 'approved') {
        xpO += px;
      } else if (t.status === 'completed') {
        xpR += px;
      }
    });

    if (!modoPlan && xpT === 0) xpT = 100;

    // Logro diario (Independiente de la meta semanal)
    // El sistema principal usa el % de puntos de HOY.
    let n = 0;
    if (dailyLevelOverride !== null) {
      n = dailyLevelOverride;
    } else {
      const porcentajeHoy = xpHoyTotal > 0 ? (xpO / xpHoyTotal) * 100 : 0;
      if (porcentajeHoy >= 100) n = 3;
      else if (porcentajeHoy >= 90) n = 2;
      else if (porcentajeHoy >= 80) n = 1;
    }

    let m = '🥉';
    if (n === 3) m = '🏆';
    else if (n === 2) m = '🥇';
    else if (n === 1) m = '🥈';

    return { xpTotal: xpT, xpObtenida: xpO, xpEnRevision: xpR, nivel: n, medalla: m };
  }, [tareas, modoPlan, metaPuntos, dailyLevelOverride]);
  
  const completadasCount = tareas.filter(t => t.status === 'approved').length;
  const enRevisionCount = tareas.filter(t => t.status === 'completed').length;
  
  // Escape modal
  const [tapCount, setTapCount] = useState(0);
  const [showEscapeModal, setShowEscapeModal] = useState(false);
  const [escapePin, setEscapePin] = useState('');
  const [stopping, setStopping] = useState(false);

  // Animación de pulso para tareas urgentes
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1, duration: 1000, useNativeDriver: false}),
        Animated.timing(pulseAnim, {toValue: 0, duration: 1000, useNativeDriver: false}),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    TutorEnforcer.startService().catch(err =>
      console.error('[Dashboard] Error al iniciar servicio:', err),
    );

    fetchTareas();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoId]);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      const res = await getPlanSemanalYBaseTasksHoy(alumnoId);
      if (res !== null) {
        setTareas(res.tareas);
        setMetaPuntos(res.metaPuntosTotal);
        setModoPlan(true);
        
        // Sincronizar nivel diario desde la base de datos
        const historial = await getHistorialDiarioHoy(res.planId, alumnoId);
        if (historial) {
          setDailyLevelOverride(historial.nivel);
        }
      } else {
        // Fallback: modo libre
        const data = await getTodasTareas(alumnoId);
        setTareas(data);
        setModoPlan(false);
      }
    } catch (error) {
      console.error('[Dashboard] Error al cargar tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas.');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = async () => {
    const url = 'whatsapp://send?text=Hola%20profesor';
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
      setShowEscapeModal(false);
      // Anticipando la Fase 5: si existe disableLauncherAndExit, lo llamamos. Si no, al menos detenemos el servicio
      if ((TutorEnforcer as any).disableLauncherAndExit) {
        Alert.alert('Modo Estudio Desactivado 🔓', 'Aplicando desactivación...');
        setTimeout(async () => {
          await (TutorEnforcer as any).disableLauncherAndExit();
        }, 1200);
      } else {
        await TutorEnforcer.stopService();
        Alert.alert('Modo Estudio Desactivado', 'Puedes usar el dispositivo libremente.');
      }
    } else {
      Alert.alert('PIN Incorrecto', 'El PIN ingresado no es válido.');
    }
    setStopping(false);
  };

  const renderTarea = ({item}: {item: Tarea}) => {
    const isUrgent = item.status === 'rejected';
    const isCompleted = item.status === 'completed' || item.status === 'approved';
    const isPendingApproval = item.status === 'completed'; // Si se quiere ser más específico

    const tCol = MC_TASK_COLORS[item.type] || MC_TASK_COLORS.reading;
    
    // Mismo emoji base que antes
    const emoji = isUrgent ? '⚠️' : MC_TASK_EMOJI[item.type] || '📚';
    
    const xp = item.score || MC_XP_BY_TYPE[item.type] || 50;
    const typeLabel = (TIPO_LABELS[item.type] ?? item.type).toUpperCase();

    // Animación de color de borde para urgentes
    const borderColor = isUrgent
      ? pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [MC_COLORS.borderUrgentLight, '#ff4444'],
        })
      : tCol.light;

    const shadowColor = isUrgent
      ? pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [MC_COLORS.borderUrgentShadow, MC_COLORS.bgUrgent],
        })
      : tCol.shadow;

    let currentBgColor = MC_COLORS.bgGrass;
    if (isUrgent) currentBgColor = MC_COLORS.bgUrgent;
    else if (isCompleted) currentBgColor = '#2d4d2d'; // Pasto oscurecido

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => onSelectTarea(item)}>
        <Animated.View style={{marginBottom: 10, opacity: isCompleted ? 0.75 : 1}}>
          <PixelBlock
            bg={currentBgColor}
            light={isCompleted ? '#3d6d3d' : MC_COLORS.borderGrassLight}
            shadow={isCompleted ? '#1a2a1a' : MC_COLORS.borderGrassShadow}
            style={[
              styles.taskBlockContainer,
              { borderTopColor: borderColor, borderLeftColor: borderColor, borderRightColor: shadowColor, borderBottomColor: shadowColor } as any
            ]}>
            
            {isUrgent && <Text style={styles.urgentTag}>! CORREGIR</Text>}
            {isPendingApproval && <Text style={[styles.urgentTag, {backgroundColor: '#f39c12', borderColor: '#e67e22', color: '#fff'}]}>EN REVISIÓN</Text>}
            {!isPendingApproval && item.status === 'approved' && <Text style={[styles.urgentTag, {backgroundColor: '#27ae60', borderColor: '#2ecc71', color: '#fff'}]}>APROBADA</Text>}
            
            <View style={[styles.taskCheckbox, isCompleted && {backgroundColor: MC_COLORS.textGreenBright, borderColor: '#fff'}]}>
              {isCompleted && <Text style={{color: '#fff', fontSize: 12, textAlign: 'center'}}>✓</Text>}
            </View>

            <View style={styles.taskIconBlock}>
              <Text style={{fontSize: 16}}>{emoji}</Text>
            </View>

            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, isCompleted && {textDecorationLine: 'line-through'}]}>{item.title}</Text>
              <Text style={styles.taskMeta}>📍 {typeLabel}</Text>
            </View>

            <Text style={styles.taskXp}>+{xp} XP</Text>
          </PixelBlock>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Interactivo (7 taps en el header) */}
      <TouchableOpacity activeOpacity={1} onPress={handleSecretTap}>
        <SkyBackground playerName="Alumno" lives={5} />
      </TouchableOpacity>

      <XpBar current={xpObtenida} pending={xpEnRevision} max={xpTotal || 100} />

      {/* Estadísticas */}
      <View style={styles.statsRow}>
        <StatBlock style={{flex: 1}}>
          <Text style={styles.statNum}>{completadasCount}</Text>
          <Text style={styles.statLabel}>COMPLETADAS</Text>
        </StatBlock>
        <StatBlock style={{flex: 1}}>
          <Text style={styles.statNum}>{tareas.length - completadasCount - enRevisionCount}</Text>
          <Text style={styles.statLabel}>PENDIENTES</Text>
        </StatBlock>
        <StatBlock style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{fontSize: 18}}>{medalla} </Text>
            <Text style={styles.statNum}>Nv.{nivel}</Text>
          </View>
          <Text style={styles.statLabel}>LOGRO DEL DÍA</Text>
        </StatBlock>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>
          {modoPlan ? 'MISIONES DE HOY (PLAN SEMANAL)' : 'MISIONES DISPONIBLES'}
        </Text>
      </View>

      {/* Lista de Misiones */}
      {loading ? (
        <ActivityIndicator size="large" color={MC_COLORS.textGreenBright} style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={tareas}
          keyExtractor={item => item.id}
          renderItem={renderTarea}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>
                {modoPlan ? '¡DÍA LIBRE!' : '¡TODO COMPLETADO!'}
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchTareas}
        />
      )}

      {/* Botones de acción general */}
      <View style={styles.contactSection}>
        <View style={styles.contactLabelRow}>
          <View style={styles.sectionIcon} />
          <Text style={styles.contactLabelText}> CONTACTAR AL PROFESOR</Text>
        </View>
        <View style={styles.btnRow}>
          <McButton variant="call" icon="📞" subtitle="Hablar en vivo" onPress={openDialer}>LLAMAR</McButton>
          <View style={{width: 10}} />
          <McButton variant="whatsapp" icon="💬" subtitle="Enviar mensaje" onPress={openWhatsApp}>WHATSAPP</McButton>
        </View>
      </View>

      <InventoryBar activeIndex={0} />

      {/* Modal de Escape */}
      <Modal visible={showEscapeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <PixelBlock bg="#1E293B" light="#334155" shadow="#0F172A" style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔓 MODO ESCAPE</Text>
            <Text style={styles.modalDesc}>Ingresa el PIN de admin</Text>
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
              <McButton variant="green" disabled={stopping} onPress={handleEscapeValidate}>
                {stopping ? '...' : 'CONFIRMAR'}
              </McButton>
            </View>
          </PixelBlock>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MC_COLORS.bgDark,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  statNum: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 14,
    color: MC_COLORS.textGold,
  },
  statLabel: {
    fontFamily: MC_FONTS.mono,
    fontSize: 14,
    color: '#8888cc',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#FFAA00',
  },
  sectionTitle: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 9,
    color: '#FFAA00',
    textShadowColor: '#8B5A00',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  taskBlockContainer: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    backgroundColor: MC_COLORS.bgGrassDark,
    borderWidth: 2,
    borderColor: MC_COLORS.borderGrassLight,
  },
  taskIconBlock: {
    width: 28,
    height: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2980b9',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 8,
    color: MC_COLORS.textGreen,
    lineHeight: 14,
  },
  taskMeta: {
    fontFamily: MC_FONTS.mono,
    fontSize: 14,
    color: MC_COLORS.textMuted,
    marginTop: 4,
  },
  taskXp: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 7,
    color: MC_COLORS.textGold,
    backgroundColor: MC_COLORS.borderWoodLight,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFAA00',
  },
  urgentTag: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 6,
    color: MC_COLORS.textUrgent,
    backgroundColor: MC_COLORS.bgUrgent,
    borderWidth: 1,
    borderColor: '#ff4444',
    padding: 2,
    position: 'absolute',
    top: -6,
    right: 8,
    zIndex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 12,
    color: MC_COLORS.textGreenBright,
  },
  contactSection: {
    padding: 16,
    paddingBottom: 10,
  },
  contactLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactLabelText: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 7,
    color: '#FFAA00',
  },
  btnRow: {
    flexDirection: 'row',
  },
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
