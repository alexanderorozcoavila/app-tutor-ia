import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {MC_COLORS} from '../../theme/minecraft';

interface Props {
  playerName?: string;
  lives?: number; // 1-5, default 5
}

/**
 * Encabezado visual con cielo pixelado + sol + nubes + franja de césped.
 * Basado fielmente en el diseño de minecraft_edu_app.html.
 */
export const SkyBackground: React.FC<Props> = ({playerName, lives = 5}) => {
  return (
    <View style={styles.sky}>
      {/* Sol cuadrado */}
      <View style={styles.sun} />

      {/* Nube pixelada */}
      <View style={styles.cloudContainer}>
        {/* Fila 1: _XXXXX_ */}
        <View style={styles.cloudRow}>
          <View style={styles.cloudEmpty} />
          <View style={styles.cloudPixel} />
          <View style={styles.cloudPixel} />
          <View style={styles.cloudPixel} />
          <View style={styles.cloudEmpty} />
        </View>
        {/* Fila 2: XXXXXXX */}
        <View style={styles.cloudRow}>
          {[0,1,2,3,4,5,6].map(i => (
            <View key={i} style={styles.cloudPixel} />
          ))}
        </View>
        {/* Fila 3: XXXXX__ */}
        <View style={styles.cloudRow}>
          {[0,1,2,3,4].map(i => (
            <View key={i} style={styles.cloudPixel} />
          ))}
        </View>
      </View>

      {/* Franja de césped inferior */}
      <View style={styles.grassStrip}>
        {/* Bloques de árbol/tierra sobre el césped */}
        <View style={styles.treeRow}>
          {[true,true,true,false,true,true,true,true,false,true,true,true].map((v, i) => (
            <View key={i} style={[styles.treeBlock, !v && {backgroundColor: 'transparent'}]} />
          ))}
        </View>
        <View style={styles.grassFill} />
      </View>

      {/* Header de madera (nombre del jugador) */}
      {playerName ? (
        <View style={styles.header}>
          {/* Logo bloque de madera pixelado */}
          <View style={styles.logoGrid}>
            {['#5d7c15','#5d7c15','#5d7c15','#5d7c15',
              '#5d7c15','#8B5A00','#8B5A00','#5d7c15',
              '#8B5A00','#8B5A00','#8B5A00','#8B5A00',
              '#8B5A00','#8B5A00','#8B5A00','#8B5A00'].map((c, i) => (
              <View key={i} style={[styles.logoPixel, {backgroundColor: c}]} />
            ))}
          </View>

          {/* Título */}
          <View style={styles.titleGroup}>
            <Text style={styles.appTitle}>EduCraft</Text>
            <Text style={styles.appSubtitle}>¡Aprende construyendo mundos!</Text>
          </View>

          {/* Info del jugador */}
          <View style={styles.playerInfo}>
            <Text style={styles.playerLabel}>JUGADOR</Text>
            <Text style={styles.playerName}>{playerName}</Text>
            {/* Corazones de vida */}
            <View style={styles.heartsRow}>
              {[1,2,3,4,5].map(i => (
                <View
                  key={i}
                  style={[styles.heart, i > lives && styles.heartEmpty]}
                />
              ))}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sky: {
    backgroundColor: '#5c94fc',
    position: 'relative',
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    right: 30,
    top: 10,
    width: 36,
    height: 36,
    backgroundColor: '#FFFF55',
    borderWidth: 5,
    borderColor: '#FFDD00',
  },
  cloudContainer: {
    position: 'absolute',
    top: 14,
    left: 28,
  },
  cloudRow: {
    flexDirection: 'row',
  },
  cloudPixel: {
    width: 11,
    height: 11,
    backgroundColor: 'white',
  },
  cloudEmpty: {
    width: 11,
    height: 11,
    backgroundColor: 'transparent',
  },
  grassStrip: {
    marginTop: 70,
    backgroundColor: '#6aaa4a',
    height: 50,
  },
  treeRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: -20,
    left: 0,
  },
  treeBlock: {
    width: 22,
    height: 22,
    backgroundColor: '#4a8a2a',
  },
  grassFill: {
    height: 30,
    backgroundColor: '#6aaa4a',
  },
  // Header de madera
  header: {
    backgroundColor: '#4a2c00',
    borderBottomWidth: 4,
    borderBottomColor: '#8B5A00',
    borderTopWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoGrid: {
    width: 36,
    height: 36,
    flexWrap: 'wrap',
    flexDirection: 'row',
    flexShrink: 0,
  },
  logoPixel: {
    width: 9,
    height: 9,
  },
  titleGroup: {
    flex: 1,
  },
  appTitle: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 11,
    color: '#FFFF55',
    textShadowColor: '#8B5A00',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 0,
  },
  appSubtitle: {
    fontFamily: 'VT323-Regular',
    fontSize: 15,
    color: '#aaffaa',
    marginTop: 2,
  },
  playerInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  playerLabel: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 6,
    color: '#FFDD00',
  },
  playerName: {
    fontFamily: 'VT323-Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  heart: {
    width: 10,
    height: 10,
    backgroundColor: '#ff4444',
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  heartEmpty: {
    backgroundColor: '#555555',
    borderColor: '#333333',
  },
});
