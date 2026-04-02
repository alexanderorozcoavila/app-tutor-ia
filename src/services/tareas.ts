import {supabase} from '../lib/supabase';

/**
 * Interfaz que refleja la estructura real de la tabla `tasks` en Supabase.
 * Campos clave:
 *   - assigned_to: UUID del alumno (users.id)
 *   - status: 'pending' | 'completed' | 'approved' | 'rejected'
 *   - type: 'dictation' | 'domestic' | 'reading' | 'assessment'
 */
export interface Tarea {
  id: string;
  title: string;
  description: string | null;
  type: 'dictation' | 'domestic' | 'reading' | 'assessment';
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  score: number;
  reason_not_done: string | null;
  metadata: Record<string, unknown>;
  assigned_to: string;       // UUID del alumno
  created_by: string | null; // UUID del tutor
  supported_devices: string[];
  created_at: string;
}

/** Etiquetas en español para los tipos de tarea */
export const TIPO_LABELS: Record<Tarea['type'], string> = {
  dictation: 'Dictado',
  domestic: 'Doméstica',
  reading: 'Lectura',
  assessment: 'Evaluación',
};

/**
 * Obtiene las tareas pendientes o rechazadas del alumno.
 * Solo retorna tareas con supported_devices que incluya 'mobile'.
 *
 * Tabla: tasks
 * Filtros:
 *   - assigned_to = alumnoId
 *   - status IN ('pending', 'rejected')
 *   - supported_devices @> '{mobile}'  (contiene 'mobile')
 */
export const getTareasPendientes = async (alumnoId: string): Promise<Tarea[]> => {
  if (!alumnoId) {
    console.warn('[Tareas] alumnoId vacío, abortando consulta.');
    return [];
  }

  const {data, error} = await supabase
    .from('tasks')
    .select('id, title, description, type, status, score, reason_not_done, metadata, assigned_to, created_by, supported_devices, created_at')
    .eq('assigned_to', alumnoId)
    .in('status', ['pending', 'rejected'])
    .contains('supported_devices', ['mobile'])
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(`Error al obtener tareas: ${error.message}`);
  }

  return (data ?? []) as Tarea[];
};

/**
 * Marca una tarea como completada.
 * El tutor luego la aprueba o rechaza desde el sistema web.
 */
export const marcarTareaCompletada = async (tareaId: string): Promise<void> => {
  const {error} = await supabase
    .from('tasks')
    .update({status: 'completed'})
    .eq('id', tareaId);

  if (error) {
    throw new Error(`Error al actualizar tarea: ${error.message}`);
  }
};

/**
 * Obtiene las tareas planificadas del alumno para la semana actual.
 * Tabla: tarea_planificada (join con plan_semanal)
 * Estado: 'pendiente' | 'en_revision'
 */
export interface TareaPlanificada {
  id: string;
  plan_semanal_id: string;
  dia_semana: number;   // 0=Lunes … 6=Domingo
  puntos_valor: number;
  estado: 'pendiente' | 'en_revision' | 'completada';
  tipo_modulo: string;
  modulo_id: string;
  alumno_id: string;
  orden_visual: number;
  metadata: Record<string, unknown>;
  fecha_completado: string | null;
}

export const getTareasPlanificadasHoy = async (
  alumnoId: string,
): Promise<TareaPlanificada[]> => {
  if (!alumnoId) {
    return [];
  }

  // Calcular el lunes de la semana actual
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Domingo, 1=Lunes...
  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diasDesdeElLunes);
  const fechaLunes = lunes.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  // Obtener el plan semanal activo del alumno
  const {data: planData, error: planError} = await supabase
    .from('plan_semanal')
    .select('id')
    .eq('alumno_id', alumnoId)
    .eq('fecha_inicio', fechaLunes)
    .single();

  if (planError || !planData) {
    // No hay plan activo esta semana — retornar vacío (no es un error)
    return [];
  }

  const {data, error} = await supabase
    .from('tarea_planificada')
    .select('*')
    .eq('plan_semanal_id', planData.id)
    .in('estado', ['pendiente', 'en_revision'])
    .order('orden_visual', {ascending: true});

  if (error) {
    throw new Error(`Error al obtener plan semanal: ${error.message}`);
  }

  return (data ?? []) as TareaPlanificada[];
};
