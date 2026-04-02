import React from 'react';
import {View, ViewStyle, StyleSheet, StyleProp} from 'react-native';
import {mcBlock} from '../../theme/minecraft';

interface Props {
  bg: string;
  light: string;
  shadow: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Bloque pixel-art de Minecraft.
 * Simula el efecto 3D clásico: borde sup/izq claro, borde inf/der oscuro.
 */
export const PixelBlock: React.FC<Props> = ({
  bg, light, shadow, borderWidth = 3, style, children,
}) => {
  const blockStyle = mcBlock(bg, light, shadow, borderWidth);
  return (
    <View style={[blockStyle as ViewStyle, style]}>
      {children}
    </View>
  );
};

/**
 * Bloque de stat (fondo piedra oscura).
 * Usado para los contadores de completadas/pendientes/logros.
 */
export const StatBlock: React.FC<{children: React.ReactNode; style?: StyleProp<ViewStyle>}> = ({children, style}) => (
  <PixelBlock bg="#2c2c4a" light="#4444aa" shadow="#1a1a2e" borderWidth={2} style={[styles.stat, style]}>
    {children}
  </PixelBlock>
);

/**
 * Bloque de inventario (slot oscuro de hotbar).
 */
export const InvSlot: React.FC<{children?: React.ReactNode; active?: boolean}> = ({children, active}) => (
  <PixelBlock
    bg={active ? '#666666' : '#444444'}
    light={active ? '#ffffff' : '#666666'}
    shadow="#222222"
    borderWidth={2}
    style={styles.slot}>
    {children}
  </PixelBlock>
);

const styles = StyleSheet.create({
  stat: {
    padding: 10,
    alignItems: 'center',
    flex: 1,
  },
  slot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
