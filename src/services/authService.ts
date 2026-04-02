import {supabase} from '../lib/supabase';
import * as Keychain from 'react-native-keychain';

const SESSION_KEY = 'tutor_ia_student_session';

export interface StudentSession {
  id: string;
  username: string;
  role: string;
}

/**
 * Intenta autenticar un alumno contra la tabla `users` del sistema propio.
 * El sistema NO usa auth.users de Supabase, sino su propia tabla con
 * username y password en texto plano.
 *
 * Retorna los datos del alumno si las credenciales son correctas,
 * o null si son incorrectas o el usuario no tiene rol 'student'.
 */
export const loginAlumno = async (
  username: string,
  password: string,
): Promise<StudentSession | null> => {
  const {data, error} = await supabase
    .from('users')
    .select('id, username, role')
    .eq('username', username.trim())
    .eq('password', password)
    .eq('role', 'student')
    .single();

  if (error || !data) {
    console.warn('[Auth] Login fallido:', error?.message ?? 'Sin datos');
    return null;
  }

  const session: StudentSession = {
    id: data.id,
    username: data.username,
    role: data.role,
  };

  // Persistir la sesión en el Keystore cifrado de Android
  await Keychain.setGenericPassword(
    'session',
    JSON.stringify(session),
    {service: SESSION_KEY},
  );

  return session;
};

/**
 * Recupera la sesión del alumno guardada en Keychain al arrancar la app.
 * Retorna null si no hay sesión activa (primer uso o después de logout).
 */
export const getStoredSession = async (): Promise<StudentSession | null> => {
  try {
    const result = await Keychain.getGenericPassword({service: SESSION_KEY});
    if (!result) {
      return null;
    }
    return JSON.parse(result.password) as StudentSession;
  } catch (e) {
    console.warn('[Auth] Error al recuperar sesión:', e);
    return null;
  }
};

/**
 * Cierra la sesión del alumno eliminando los datos del Keychain.
 */
export const logoutAlumno = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({service: SESSION_KEY});
  } catch (e) {
    console.warn('[Auth] Error al cerrar sesión:', e);
  }
};
