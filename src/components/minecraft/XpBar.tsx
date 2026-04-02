import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {MC_COLORS, MC_FONTS} from '../../theme/minecraft';

interface Props {
  current: number;   // XP actual
  max: number;       // XP para siguiente nivel (1000)
}

/**
 * Barra de XP de aprendizaje estilo Minecraft.
 * Verde brillante, pixelada, con label arriba y texto de progreso abajo.
 */
export const XpBar: React.FC<Props> = ({current, max}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(1, current / max);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct, widthAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>XP DE APRENDIZAJE</Text>
      <View style={styles.barBg}>
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
          {/* Brillo en la parte superior */}
          <View style={styles.barShine} />
        </Animated.View>
      </View>
      <Text style={styles.xpText}>
        {current} / {max} XP
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
