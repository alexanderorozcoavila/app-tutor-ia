import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {MC_COLORS, MC_FONTS} from '../../theme/minecraft';

interface Props {
  current: number;   // XP aprobada
  pending?: number;  // XP en revisión
  max: number;       // XP para meta total (e.g. 1000)
}

/**
 * Barra de XP de aprendizaje estilo Minecraft.
 * Verde brillante, pixelada, con label arriba y texto de progreso abajo.
 */
export const XpBar: React.FC<Props> = ({current, pending = 0, max}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pendingWidthAnim = useRef(new Animated.Value(0)).current;
  
  const pct = Math.min(1, current / max);
  const pendingPct = Math.min(1, (current + pending) / max);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: pct,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(pendingWidthAnim, {
        toValue: pendingPct,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, [pct, pendingPct, widthAnim, pendingWidthAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>XP DE APRENDIZAJE</Text>
      <View style={styles.barBg}>
        {/* Barra de XP Pendiente (En revisión) - Verde pálido */}
        <Animated.View
          style={[
            styles.barPending,
            {
              width: pendingWidthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        {/* Barra de XP Aprobada - Verde brillante */}
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}>
          <View style={styles.barShine} />
        </Animated.View>
      </View>
      <Text style={styles.xpText}>
        {current}{pending > 0 ? ` (+${pending}?)` : ''} / {max} XP
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MC_COLORS.bgDark,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  label: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 7,
    color: MC_COLORS.textGreenBright,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  barBg: {
    backgroundColor: '#333333',
    height: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#222222',
    borderLeftColor: '#222222',
    borderRightColor: '#555555',
    borderBottomColor: '#555555',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: MC_COLORS.textGreenBright,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  barPending: {
    height: '100%',
    backgroundColor: '#3a7a3a', // Verde oscuro/apagado para lo que está en revisión
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  barShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#88ff88',
  },
  xpText: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 6,
    color: MC_COLORS.textGreenBright,
    textAlign: 'right',
    marginTop: 3,
  },
});
