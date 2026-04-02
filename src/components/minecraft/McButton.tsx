import React, {useRef} from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import {MC_COLORS, MC_FONTS} from '../../theme/minecraft';

type McButtonVariant = 'call' | 'whatsapp' | 'green' | 'blue' | 'red' | 'gray' | 'gold';

interface Props {
  variant?: McButtonVariant;
  onPress: () => void;
  children: React.ReactNode;
  subtitle?: string;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<McButtonVariant, {bg: string; light: string; shadow: string; text: string}> = {
  call:      {bg: '#1a5a8a', light: '#2a8acc', shadow: '#0d3a5a', text: '#aaddff'},
  whatsapp:  {bg: '#1a5a1a', light: '#2acc2a', shadow: '#0d3a0d', text: '#aaffaa'},
  green:     {bg: '#2d7a1b', light: '#4aaa2a', shadow: '#1a4a0d', text: '#aaffaa'},
  blue:      {bg: '#1a3a8a', light: '#2a5acc', shadow: '#0d1f5a', text: '#aaddff'},
  red:       {bg: '#8a1a1a', light: '#cc2a2a', shadow: '#5a0d0d', text: '#ffaaaa'},
  gray:      {bg: '#3a3a4a', light: '#5a5a7a', shadow: '#1a1a2a', text: '#ccccee'},
  gold:      {bg: '#4a3300', light: '#FFAA00', shadow: '#2a1d00', text: '#FFDD00'},
};

/**
 * Botón estilo Minecraft con efecto de presionado (translateY + shrink).
 */
export const McButton: React.FC<Props> = ({
  variant = 'green',
  onPress,
  children,
  subtitle,
  icon,
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const v = VARIANT_STYLES[variant];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={fullWidth ? {width: '100%'} : {flex: 1}}>
      <Animated.View
        style={[
          styles.btn,
          {
            backgroundColor: disabled ? '#333' : v.bg,
            borderTopColor: disabled ? '#444' : v.light,
            borderLeftColor: disabled ? '#444' : v.light,
            borderRightColor: disabled ? '#1a1a1a' : v.shadow,
            borderBottomColor: disabled ? '#1a1a1a' : v.shadow,
          },
          style,
          {transform: [{scale: scaleAnim}]},
        ]}>
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={[styles.label, {color: disabled ? '#666' : v.text}]}>
              {children}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, {color: disabled ? '#555' : v.text + 'bb'}]}>
                {subtitle}
              </Text>
            ) : null}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 14,
  },
  subtitle: {
    fontFamily: 'VT323-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
