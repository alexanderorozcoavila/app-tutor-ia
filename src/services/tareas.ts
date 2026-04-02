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
 * Obtiene TODAS las tareas del alumno (pendientes, completadas, aprobadas, rechazadas).
 * No omite por supported_devices, ya que queremos mostrar todo en el listado,
 * pero la UI de detalle filtrará qué acciones se pueden hacer.
 *
 * Tabla: tasks
 * Filtros:
 *   - assigned_to = alumnoId
 */
export const getTodasTareas = async (alumnoId: string): Promise<Tarea[]> => {
  if (!alumnoId) {
    console.warn('[Tareas] alumnoId vacío, abortando consulta.');
    return [];
  }

  const {data, error} = await supabase
    .from('tasks')
    .select('id, title, description, type, status, score, reason_not_done, metadata, assigned_to, created_by, supported_devices, created_at')
    .eq('assigned_to', alumnoId)
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(`Error al obtener tareas: ${error.message}`);
  }

  return (data ?? []) as Tarea[];
};

export interface PlanHoyRespuesta {
  planId: string;
  tareas: Tarea[];
  metaPuntosTotal: number;
}

/**
 * Requisito: Si hay plan semanal activo, mostrar las tareas de HOY. 
 * Si no hay, null para que la vista use getTodasTareas() libre.
 */
export const getPlanSemanalYBaseTasksHoy = async (alumnoId: string): Promise<PlanHoyRespuesta | null> => {
  if (!alumnoId) return null;

  const hoy = new Date();
  const diaSemana = hoy.getDay(); 
  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diasDesdeElLunes);
  const fechaLunes = lunes.toISOString().split('T')[0];

  // 1. Obtener plan semanal activo
  const {data: planData, error: planError} = await supabase
    .from('plan_semanal')
    .select('id, meta_puntos_total')
    .eq('alumno_id', alumnoId)
    .eq('fecha_inicio', fechaLunes)
    .single();

  if (planError || !planData) {
    return null; // Fallback
  }

  // 2. Tareas planificadas de HOY
  // 0=Lunes ... 6=Domingo en nuestra convención de UI
  const {data: planTareas} = await supabase
    .from('tarea_planificada')
    .select('id, modulo_id, estado, puntos_valor')
    .eq('plan_semanal_id', planData.id)
    .eq('dia_semana', diaSemana);

  if (!planTareas || planTareas.length === 0) {
    return { planId: planData.id, tareas: [], metaPuntosTotal: planData.meta_puntos_total }; // Plan existe pero sin tareas hoy -> Día libre
  }

  const ids = planTareas.map(t => t.modulo_id);

  // 3. Buscar las tareas reales basadas en los UUIDs
  const {data: tasksData} = await supabase
    .from('tasks')
    .select('id, title, description, type, status, score, reason_not_done, metadata, assigned_to, created_by, supported_devices, created_at')
    .in('id', ids);

  if (!tasksData) return { planId: planData.id, tareas: [], metaPuntosTotal: planData.meta_puntos_total };

  // Mapear los estados del plan para que la aplicación móvil visualice correctamente si la completó desde la web
  const enrichedTasks = planTareas.map(pt => {
    const baseTask = tasksData.find(t => t.id === pt.modulo_id);
    if (!baseTask) return null;

    // En el modo "plan", el estado prioritario lo dicta tarea_planificada.estado
    // Mapeo EXACTO para coincidir con PC (StudentPlanViewer):
    // 'completada' -> 'approved' (suma puntos)
    // 'en_revision' -> 'completed' (esperando revisión, no suma)
    let mappedStatus: Tarea['status'] = 'pending';
    if (pt.estado === 'completada') mappedStatus = 'approved';
    else if (pt.estado === 'en_revision') mappedStatus = 'completed';

    return {
      ...baseTask,
      status: mappedStatus,
      score: pt.puntos_valor,
      metadata: {
        ...(baseTask.metadata || {}),
        planificada_id: pt.id
      }
    };
  }).filter(Boolean) as Tarea[];

  return { 
    planId: planData.id,
    tareas: enrichedTasks, 
    metaPuntosTotal: planData.meta_puntos_total 
  };
};

/**
 * Obtiene el registro de historial diario para hoy.
 */
export const getHistorialDiarioHoy = async (planId: string, alumnoId: string): Promise<{nivel: number; porcentaje: number} | null> => {
  const hoy = new Date().getDay();
  const { data, error } = await supabase
    .from('historial_diario')
    .select('nivel_alcanzado, porcentaje_logrado')
    .eq('plan_semanal_id', planId)
    .eq('alumno_id', alumnoId)
    .eq('dia_semana', hoy)
    .maybeSingle();

  if (error || !data) return null;

  return {
    nivel: data.nivel_alcanzado,
    porcentaje: data.porcentaje_logrado
  };
};

/**
 * Marca una tarea como completada.
 * El tutor luego la aprueba o rechaza desde el sistema web.
 */
export const marcarTareaCompletada = async (tareaId: string, planificadaId?: string): Promise<void> => {
  const {error} = await supabase
    .from('tasks')
    .update({status: 'completed'})
    .eq('id', tareaId);

  if (error) {
    throw new Error(`Error al actualizar tarea: ${error.message}`);
  }

  // Si existe un id de plan, sincronizar el estado global con el sistema principal
  if (planificadaId) {
    await supabase
      .from('tarea_planificada')
      .update({
        estado: 'completada',
        fecha_completado: new Date().toISOString()
      })
      .eq('id', planificadaId);
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
