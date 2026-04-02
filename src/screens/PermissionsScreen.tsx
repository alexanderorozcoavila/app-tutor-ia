import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {TutorEnforcer, PermissionStatus} from '../native/TutorEnforcer';

interface Props {
  onPermissionsGranted: () => void;
}

/**
 * Pantalla de barrera de permisos.
 * Bloquea el acceso al Dashboard hasta que el SO haya concedido
 * SYSTEM_ALERT_WINDOW y PACKAGE_USAGE_STATS.
 */
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
    // Verificar al montar y cada vez que el usuario vuelve de Ajustes
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
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>⚙️ Configuración Requerida</Text>
      <Text style={styles.subtitle}>
        Para activar el modo estudio, el administrador debe autorizar los
        siguientes permisos especiales en este dispositivo.
      </Text>

      <PermissionItem
        label="1. Superposición de Apps"
        description="Permite mostrar la pantalla de bloqueo sobre otras apps."
        granted={status.hasOverlay}
        onPress={TutorEnforcer.requestOverlayPermission}
      />

      <PermissionItem
        label="2. Acceso a Datos de Uso"
        description="Permite detectar qué app está abierta en pantalla."
        granted={status.hasUsageStats}
        onPress={TutorEnforcer.requestUsageStatsPermission}
      />

      <TouchableOpacity style={styles.refreshButton} onPress={checkStatus}>
        <Text style={styles.refreshText}>🔄  Verificar permisos</Text>
      </TouchableOpacity>

      {status.allGranted && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✅ ¡Todo listo! Iniciando...</Text>
        </View>
      )}
    </ScrollView>
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
  <View style={[styles.permItem, granted && styles.permItemGranted]}>
    <View style={styles.permInfo}>
      <Text style={styles.permLabel}>{granted ? '✅' : '⚠️'} {label}</Text>
      <Text style={styles.permDesc}>{description}</Text>
    </View>
    {!granted && (
      <TouchableOpacity style={styles.permButton} onPress={onPress}>
        <Text style={styles.permButtonText}>Autorizar</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B33',
  },
  permItemGranted: {borderColor: '#10B981'},
  permInfo: {flex: 1, marginRight: 12},
  permLabel: {color: '#F8FAFC', fontWeight: '700', fontSize: 15, marginBottom: 4},
  permDesc: {color: '#94A3B8', fontSize: 13, lineHeight: 18},
  permButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permButtonText: {color: '#FFFFFF', fontWeight: '700', fontSize: 13},
  refreshButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshText: {color: '#3B82F6', fontSize: 15, fontWeight: '600'},
  successBanner: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  successText: {color: '#10B981', fontSize: 16, fontWeight: '700'},
});
