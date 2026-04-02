import {supabase} from '../lib/supabase';
import {marcarTareaCompletada} from './tareas';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';

/**
 * Sube una foto como evidencia de tarea a Supabase Storage
 * y marca la tarea como completada en la tabla `tasks`.
 *
 * Flujo optimizado para Android:
 *  1. Leer archivo local usando RNFS (base64)
 *  2. Convertir base64 a ArrayBuffer/Uint8Array usando Buffer
 *  3. storage.upload() usando el binario directo
 */
export const uploadEvidencia = async (
  tareaId: string,
  alumnoId: string,
  imageUri: string,
  planificadaId?: string,
): Promise<void> => {
  // Limpiar el path de la URI (quitar file:// si existe)
  const cleanPath = imageUri.replace('file://', '');
  
  // 1. Leer el archivo como base64
  let base64;
  try {
    base64 = await RNFS.readFile(cleanPath, 'base64');
  } catch (error) {
    console.error('[Evidencia] Error al leer archivo local:', error);
    throw new Error('No se pudo leer la imagen del dispositivo');
  }

  // 2. Convertir a binario (Uint8Array) que Supabase JS SDK entiende bien en RN
  const binaryData = Buffer.from(base64, 'base64');

  const fileName = `${Date.now()}_evidencia.jpg`;
  const filePath = `${alumnoId}/${tareaId}/${fileName}`;

  // 3. Subir al bucket de Supabase Storage
  const {error: storageError} = await supabase.storage
    .from('evidencias')
    .upload(filePath, binaryData, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (storageError) {
    // Si hay error de red o de bucket, lo reportamos pero intentamos marcar como completada
    // para no frustrar al alumno si la foto falló por algo menor
    console.warn('[Evidencia] Storage failed:', storageError.message);
    if (storageError.message.includes('Network request failed')) {
       throw new Error('Error de red al subir la foto a Supabase. Revisa tu conexión.');
    }
  }

  // 4. Marcar la tarea como completada
  await marcarTareaCompletada(tareaId, planificadaId);
};

/**
 * Marca una tarea como completada directamente (sin foto).
 */
export const completarTareaSinFoto = async (tareaId: string, planificadaId?: string): Promise<void> => {
  await marcarTareaCompletada(tareaId, planificadaId);
};
