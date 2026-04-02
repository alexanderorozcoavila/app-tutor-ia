import * as Keychain from 'react-native-keychain';

const PIN_KEY = 'tutor_ia_escape_pin';
const SETUP_KEY = 'tutor_ia_setup_complete';

/**
 * Verifica si el administrador ya configuró el PIN de escape
 * en el primer arranque de la app.
 */
export const isSetupComplete = async (): Promise<boolean> => {
  try {
    const result = await Keychain.getGenericPassword({service: SETUP_KEY});
    return result !== false && result?.password === 'true';
  } catch {
    return false;
  }
};

/**
 * Guarda el PIN de escape cifrado en el Android Keystore.
 * Solo se llama una vez, desde la pantalla de configuración inicial.
 */
export const saveEscapePin = async (pin: string): Promise<void> => {
  await Keychain.setGenericPassword('pin', pin, {service: PIN_KEY});
  await Keychain.setGenericPassword('setup', 'true', {service: SETUP_KEY});
};

/**
 * Valida el PIN ingresado por el administrador contra el guardado en Keychain.
 */
export const validateEscapePin = async (inputPin: string): Promise<boolean> => {
  try {
    const stored = await Keychain.getGenericPassword({service: PIN_KEY});
    if (!stored) {
      return false;
    }
    return stored.password === inputPin;
  } catch {
    return false;
  }
};
