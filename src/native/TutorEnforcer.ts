import {NativeModules} from 'react-native';

const {TutorEnforcerModule} = NativeModules;

export interface PermissionStatus {
  hasOverlay: boolean;
  hasUsageStats: boolean;
  allGranted: boolean;
}

/**
 * API TypeScript para el módulo nativo TutorEnforcerModule.
 * Todos los métodos son async (Promise) compatibles con await.
 */
export const TutorEnforcer = {
  /** Verifica si ambos permisos críticos están concedidos. */
  checkPermissions: (): Promise<PermissionStatus> => {
    return TutorEnforcerModule.checkPermissions();
  },

  /** Abre la pantalla de Ajustes de Android para "Superposición de apps". */
  requestOverlayPermission: (): Promise<boolean> => {
    return TutorEnforcerModule.requestOverlayPermission();
  },

  /** Abre la pantalla de Ajustes de Android para "Acceso a datos de uso". */
  requestUsageStatsPermission: (): Promise<boolean> => {
    return TutorEnforcerModule.requestUsageStatsPermission();
  },

  /** Inicia el EnforcerService (vigilancia en segundo plano). */
  startService: (): Promise<string> => {
    return TutorEnforcerModule.startEnforcerService();
  },

  /** Detiene el EnforcerService. La validación de PIN se hace en JS antes de llamar esto. */
  stopService: (): Promise<string> => {
    return TutorEnforcerModule.stopEnforcerService();
  },
};
