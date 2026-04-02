import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {isSetupComplete} from './src/services/pinService';
import {getStoredSession, StudentSession} from './src/services/authService';
import {FirstLaunchSetupScreen} from './src/screens/FirstLaunchSetupScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {PermissionsScreen} from './src/screens/PermissionsScreen';
import {Dashboard} from './src/screens/Dashboard';
import {TareaDetalleScreen} from './src/screens/TareaDetalleScreen';
import {Tarea} from './src/services/tareas';

/**
 * Flujo de navegación de la app:
 *
 * Arranque
 *   └─► setup completo? ─NO─► FirstLaunchSetupScreen (PIN del admin, solo 1 vez)
 *                      └─SI─► sesión activa? ─SI─► goto 'permissions'
 *                                            └─NO─► LoginScreen (Alumno)
 *                                                     └─► onLoginSuccess → goto 'permissions'
 *                                                  └─► permisos OK? ─NO─► PermissionsScreen
 *                                                                   └─SI─► Dashboard
 *                                                                          └─► TareaDetalleScreen
 */
type AppScreen =
  | 'loading'
  | 'firstLaunch'
  | 'login'
  | 'permissions'
  | 'dashboard'
  | 'tareaDetalle';

const App = () => {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [session, setSession] = useState<StudentSession | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // 1. ¿El admin ya configuró el PIN de escape?
      const setupDone = await isSetupComplete();
      if (!setupDone) {
        setScreen('firstLaunch');
        return;
      }

      // 2. ¿Hay una sesión de alumno guardada en Keychain?
      const storedSession = await getStoredSession();
      if (storedSession?.id) {
        setSession(storedSession);
        setScreen('permissions');
      } else {
        // Primera vez o sesión expirada → mostrar Login
        setScreen('login');
      }
    } catch (error) {
      console.error('[App] Error al inicializar:', error);
      setScreen('login'); // Fallback seguro
    }
  };

  const handleLoginSuccess = (s: StudentSession) => {
    setSession(s);
    setScreen('permissions');
  };

  // ─── Pantalla de carga inicial ─────────────────────────────────────────

  if (screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // ─── Configuración inicial (solo primer arranque — admin define PIN) ───

  if (screen === 'firstLaunch') {
    return (
      <FirstLaunchSetupScreen
        onSetupComplete={() => setScreen('login')}
      />
    );
  }

  // ─── Login del alumno ──────────────────────────────────────────────────

  if (screen === 'login') {
    return (
      <LoginScreen onLoginSuccess={handleLoginSuccess} />
    );
  }

  // ─── Barrera de permisos de Android ───────────────────────────────────

  if (screen === 'permissions') {
    return (
      <PermissionsScreen
        onPermissionsGranted={() => setScreen('dashboard')}
      />
    );
  }

  // ─── Detalle de tarea ──────────────────────────────────────────────────

  if (screen === 'tareaDetalle' && selectedTarea) {
    return (
      <TareaDetalleScreen
        tarea={selectedTarea}
        onVolver={() => {
          setSelectedTarea(null);
          setScreen('dashboard');
        }}
      />
    );
  }

  // ─── Dashboard principal (Custom Launcher) ─────────────────────────────

  return (
    <Dashboard
      alumnoId={session?.id ?? ''}
      onSelectTarea={tarea => {
        setSelectedTarea(tarea);
        setScreen('tareaDetalle');
      }}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});

export default App;
