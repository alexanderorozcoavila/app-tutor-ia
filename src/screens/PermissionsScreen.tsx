import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {TutorEnforcer, PermissionStatus} from '../native/TutorEnforcer';

import {MC_COLORS, MC_FONTS} from '../theme/minecraft';
import {PixelBlock} from '../components/minecraft/PixelBlock';
import {McButton} from '../components/minecraft/McButton';
import {SkyBackground} from '../components/minecraft/SkyBackground';

interface Props {
  onPermissionsGranted: () => void;
}

export const PermissionsScreen: React.FC<Props> = ({onPermissionsGranted}) => {
  const [status, setStatus] = useState<PermissionStatus>({
    hasOverlay: false,
    hasUsageStats: false,
    allGranted: false,
  });
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const currentStatus = await TutorEnforcer.checkPermissions();
      setStatus(currentStatus);
      if (currentStatus.allGranted) {
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('[Permisos] Error al verificar:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkStatus();
      }
    });
    checkStatus();
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color={MC_COLORS.textGreenBright} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SkyBackground />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <PixelBlock bg="#1E293B" light="#334155" shadow="#0F172A" style={styles.card}>
          <Text style={styles.title}>⚙️ PERMISOS DE SISTEMA</Text>
          <Text style={styles.subtitle}>
            El administrador debe autorizar estos accesos para que EduCraft funcione correctamente.
          </Text>

          <PermissionItem
            label="SUPERPOSICIÓN"
            description="Mostrar UI sobre otras apps."
            granted={status.hasOverlay}
            onPress={TutorEnforcer.requestOverlayPermission}
          />

          <PermissionItem
            label="ACCESO A DATOS"
            description="Detectar qué app está activa."
            granted={status.hasUsageStats}
            onPress={TutorEnforcer.requestUsageStatsPermission}
          />

          <View style={{height: 10}} />

          {status.allGranted ? (
            <PixelBlock bg={MC_COLORS.bgGrassDark} light={MC_COLORS.borderGrassLight} shadow="#0d1f06" style={{padding: 10, alignItems: 'center'}}>
              <Text style={styles.successText}>✅ ¡MUNDO GENERADO!</Text>
            </PixelBlock>
          ) : (
            <McButton variant="gray" onPress={checkStatus} fullWidth subtitle="Comprobar accesos">
              VERIFICAR PERMISOS
            </McButton>
          )}
        </PixelBlock>
      </ScrollView>
    </View>
  );
};

const PermissionItem = ({
  label,
  description,
  granted,
  onPress,
}: {
  label: string;
  description: string;
  granted: boolean;
  onPress: () => Promise<boolean>;
}) => (
  <PixelBlock
    bg={granted ? MC_COLORS.bgGrassDark : MC_COLORS.bgDark}
    light={granted ? MC_COLORS.borderGrassLight : MC_COLORS.borderStoneLight}
    shadow={granted ? MC_COLORS.borderGrassShadow : MC_COLORS.borderStoneShadow}
    style={styles.permItem}>
    <View style={styles.permInfo}>
      <Text style={styles.permLabel}>{granted ? '✅' : '⚠️'} {label}</Text>
      <Text style={styles.permDesc}>{description}</Text>
    </View>
    {!granted && (
      <View style={{width: 120}}>
        <McButton variant="blue" onPress={onPress}>
          AUTORIZAR
        </McButton>
      </View>
    )}
  </PixelBlock>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MC_COLORS.bgDark,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  card: {
    padding: 20,
  },
  title: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 12,
    color: MC_COLORS.textYellow,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: MC_FONTS.mono,
    fontSize: 18,
    color: MC_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  permItem: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  permInfo: {
    flex: 1,
    marginRight: 10,
  },
  permLabel: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 8,
    color: MC_COLORS.textWhite,
    marginBottom: 6,
  },
  permDesc: {
    fontFamily: MC_FONTS.mono,
    fontSize: 16,
    color: '#CBD5E1',
  },
  successText: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 12,
    color: MC_COLORS.textGreenBright,
  },
});
