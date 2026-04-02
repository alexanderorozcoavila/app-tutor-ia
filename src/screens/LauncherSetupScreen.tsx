import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {SkyBackground} from '../components/minecraft/SkyBackground';
import {PixelBlock} from '../components/minecraft/PixelBlock';
import {McButton} from '../components/minecraft/McButton';
import {MC_COLORS, MC_FONTS} from '../theme/minecraft';
import {TutorEnforcer} from '../native/TutorEnforcer';

interface Props {
  onCheckAgain: () => void;
  checking: boolean;
}

export const LauncherSetupScreen: React.FC<Props> = ({onCheckAgain, checking}) => {
  return (
    <View style={styles.container}>
      <SkyBackground />

      <View style={styles.content}>
        <PixelBlock bg="#1E293B" light="#334155" shadow="#0F172A" style={styles.card}>
          <Text style={styles.title}>⚠️ CONFIGURACIÓN REQUERIDA</Text>
          
          <PixelBlock bg={MC_COLORS.bgDark} light={MC_COLORS.borderStoneLight} shadow={MC_COLORS.borderStoneShadow} style={styles.infoBlock}>
            <Text style={styles.infoText}>
              EduCraft no está configurado como la app de inicio predeterminada.
            </Text>
            <Text style={styles.infoTextSub}>
              Para que el modo estudio funcione correctamente, debes seleccionarla como launcher predeterminado del sistema.
            </Text>
          </PixelBlock>

          <View style={{height: 20}} />

          {checking ? (
            <ActivityIndicator size="large" color={MC_COLORS.textGreenBright} style={{marginVertical: 20}} />
          ) : (
            <View style={{width: '100%', gap: 12}}>
              <McButton
                variant="green"
                icon="🏠"
                onPress={() => TutorEnforcer.requestDefaultLauncher()}
                fullWidth>
                CONFIGURAR COMO INICIO
              </McButton>
              <McButton
                variant="gray"
                icon="🔄"
                onPress={onCheckAgain}
                fullWidth>
                VERIFICAR DE NUEVO
              </McButton>
            </View>
          )}
        </PixelBlock>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MC_COLORS.bgDark,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 10,
    color: MC_COLORS.textYellow,
    marginBottom: 20,
    lineHeight: 16,
    textAlign: 'center',
  },
  infoBlock: {
    padding: 16,
    width: '100%',
  },
  infoText: {
    fontFamily: MC_FONTS.mono,
    fontSize: 20,
    color: MC_COLORS.textWhite,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoTextSub: {
    fontFamily: MC_FONTS.mono,
    fontSize: 16,
    color: MC_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
