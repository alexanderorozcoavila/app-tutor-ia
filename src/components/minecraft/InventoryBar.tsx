import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {InvSlot} from './PixelBlock';
import {MC_COLORS} from '../../theme/minecraft';

const SLOTS = ['📚', '✏️', '🎨', '🔬', '📐', '🎵', '⭐'];

interface Props {
  activeIndex?: number;
}

/**
 * Barra inferior de inventario estilo Minecraft (hotbar).
 * Muestra slots de materias educativas como ítems del juego.
 */
export const InventoryBar: React.FC<Props> = ({activeIndex = 0}) => {
  return (
    <View style={styles.container}>
      {SLOTS.map((emoji, i) => (
        <InvSlot key={i} active={i === activeIndex}>
          <Text style={styles.emoji}>{emoji}</Text>
        </InvSlot>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333333',
    borderTopWidth: 2,
    borderTopColor: '#555555',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  emoji: {
    fontSize: 18,
  },
});
