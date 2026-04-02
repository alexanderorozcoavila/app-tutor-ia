import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as Keychain from 'react-native-keychain';

// ─── Variables de entorno (definidas en .env) ─────────────────────────────
// IMPORTANTE: Copiar del .env del proyecto web app-tutor-ia
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// ─── Adaptador de almacenamiento seguro (Android Keystore) ───────────────
// No usar AsyncStorage (texto plano). Keychain cifra con el chip de seguridad.
const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const credentials = await Keychain.getGenericPassword({service: key});
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('[Supabase] Error al recuperar sesión:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await Keychain.setGenericPassword(key, value, {service: key});
    } catch (error) {
      console.error('[Supabase] Error al guardar sesión:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await Keychain.resetGenericPassword({service: key});
    } catch (error) {
      console.error('[Supabase] Error al borrar sesión:', error);
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // No aplica en React Native
  },
});
