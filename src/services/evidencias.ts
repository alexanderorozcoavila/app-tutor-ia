import {supabase} from '../lib/supabase';
import {marcarTareaCompletada} from './tareas';

/**
 * Sube una foto como evidencia de tarea a Supabase Storage
 * y marca la tarea como completada en la tabla `tasks`.
 *
 * Flujo:
 *  1. fetch(imageUri) → Blob
 *  2. storage.upload() → bucket 'evidencias'
 *  3. tasks.update status='completed'  (tabla correcta)
 *
 * NOTA: La tabla 'evidencias' no existe en el schema actual,
 * por lo que solo marcamos la tarea como completada.
 * Si se agrega la tabla, descomentar el bloque de insert.
 */
export const uploadEvidencia = async (
  tareaId: string,
  alumnoId: string,
  imageUri: string,
): Promise<void> => {
  // 1. Convertir la URI local (file://...) a Blob
  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error('No se pudo leer la imagen local');
  }
  const blob = await response.blob();

  const fileName = `${Date.now()}_evidencia.jpg`;
  const filePath = `${alumnoId}/${tareaId}/${fileName}`;

  // 2. Subir al bucket de Supabase Storage
  const {error: storageError} = await supabase.storage
    .from('evidencias')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (storageError) {
    // Si el bucket no existe aún, logueamos pero continuamos
    // para no bloquear el flujo del alumno
    console.warn('[Evidencia] Storage no disponible:', storageError.message);
  }

  // 3. Marcar la tarea como completada en la tabla `tasks`
  await marcarTareaCompletada(tareaId);
};

/**
 * Marca una tarea como completada directamente (sin foto).
 * Útil para tareas domésticas o de lectura verificadas manualmente.
 */
export const completarTareaSinFoto = async (tareaId: string): Promise<void> => {
  await marcarTareaCompletada(tareaId);
};
