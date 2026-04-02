/**
 * Sistema de diseño Minecraft para Tutor IA Mobile.
 * Todos los colores, fuentes y estilos base del tema pixel art.
 */

// ─── Paleta de colores ────────────────────────────────────────────────────────

export const MC_COLORS = {
  // Fondos
  bgDark:       '#1a1a2e',   // Fondo principal (noche Minecraft)
  bgGrass:      '#2d5a1b',   // Bloque de césped (tarjetas de tarea)
  bgGrassDark:  '#1a3a0d',   // Césped oscuro (tarea completada)
  bgWood:       '#4a2c00',   // Madera (header)
  bgStoneDark:  '#2c2c4a',   // Piedra oscura (stats)
  bgSlate:      '#333333',   // Pizarra (inventario)
  bgUrgent:     '#5a1b1b',   // Fondo rojo urgente
  bgInvSlot:    '#444444',   // Slot de inventario

  // Bordes (efecto 3D: luz arriba-izq, sombra abajo-der)
  borderGrassLight:  '#4a8a2a',
  borderGrassShadow: '#1a3a0d',
  borderWoodLight:   '#8B5A00',
  borderWoodShadow:  '#2a1800',
  borderStoneLight:  '#4444aa',
  borderStoneShadow: '#1a1a2e',
  borderUrgentLight: '#8a2a2a',
  borderUrgentShadow:'#3a0d0d',
  borderSlate:       '#555555',
  borderSlateShadow: '#222222',

  // Textos
  textYellow:   '#FFFF55',   // Títulos principales
  textGold:     '#FFDD00',   // XP / recompensas
  textGreen:    '#aaffaa',   // Texto de tarea pendiente
  textGreenBright: '#55ff55',// XP bar / activo
  textBlue:     '#aaddff',   // Texto de botón llamar
  textMuted:    '#88cc88',   // Metadata / segundario
  textWhite:    '#FFFFFF',
  textUrgent:   '#ffaaaa',   // Texto urgente
  textCompleted:'#558855',   // Tarea completada

  // Sky
  skyTop:       '#5c94fc',
  skyMid:       '#7ec8e3',
  skyGrass:     '#6aaa4a',
  skyGrassTop:  '#4a8a2a',

  // Sun
  sunYellow:    '#FFFF55',
  sunGlow:      '#FFDD00',

  // Botones específicos
  btnCallBg:    '#1a5a8a',
  btnCallBorder:'#2a8acc',
  btnCallShadow:'#0d3a5a',
  btnWaBg:      '#1a5a1a',
  btnWaBorder:  '#2acc2a',
  btnWaShadow:  '#0d3a0d',

  // Task type colors
  taskDictation:  '#3498db',
  taskReading:    '#27ae60',
  taskDomestic:   '#f39c12',
  taskAssessment: '#e74c3c',
};

// ─── Fuentes ──────────────────────────────────────────────────────────────────

export const MC_FONTS = {
  pixel: 'PressStart2P-Regular',   // Títulos, labels, botones
  mono:  'VT323-Regular',          // Texto secundario, metadata
};

// ─── Helper: estilo de "bloque Minecraft" ─────────────────────────────────────
// Simula el efecto 3D (borde izq/sup claro, borde der/inf oscuro)

export interface BlockStyle {
  backgroundColor: string;
  borderTopWidth: number;
  borderLeftWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderTopColor: string;
  borderLeftColor: string;
  borderRightColor: string;
  borderBottomColor: string;
}

export const mcBlock = (
  bg: string,
  light: string,
  shadow: string,
  borderWidth = 3,
): BlockStyle => ({
  backgroundColor: bg,
  borderTopWidth: borderWidth,
  borderLeftWidth: borderWidth,
  borderRightWidth: borderWidth,
  borderBottomWidth: borderWidth,
  borderTopColor: light,
  borderLeftColor: light,
  borderRightColor: shadow,
  borderBottomColor: shadow,
});

// ─── Estilos reutilizables ────────────────────────────────────────────────────

export const MC_STYLES = {
  // Tarjeta de tarea normal (cesped)
  taskBlock: mcBlock(MC_COLORS.bgGrass, MC_COLORS.borderGrassLight, MC_COLORS.borderGrassShadow),
  // Tarjeta completada
  taskBlockDone: mcBlock(MC_COLORS.bgGrassDark, '#2d5a1b', '#0d1f06'),
  // Tarjeta urgente
  taskBlockUrgent: mcBlock(MC_COLORS.bgUrgent, MC_COLORS.borderUrgentLight, MC_COLORS.borderUrgentShadow),
  // Header de madera
  headerBlock: mcBlock(MC_COLORS.bgWood, MC_COLORS.borderWoodLight, MC_COLORS.borderWoodShadow, 4),
  // Bloque de stat (piedra)
  statBlock: mcBlock(MC_COLORS.bgStoneDark, MC_COLORS.borderStoneLight, MC_COLORS.borderStoneShadow, 2),
  // Slot inventario
  invSlot: mcBlock(MC_COLORS.bgInvSlot, MC_COLORS.borderSlate, MC_COLORS.borderSlateShadow, 2),
};

// ─── Colores por tipo de tarea ────────────────────────────────────────────────

export const MC_TASK_COLORS: Record<string, {bg: string; light: string; shadow: string; text: string}> = {
  dictation:  {bg: '#1a3a6a', light: '#2a6add', shadow: '#0d1f3a', text: '#aaddff'},
  reading:    {bg: '#1a4a2a', light: '#27ae60', shadow: '#0d2a14', text: '#aaffaa'},
  domestic:   {bg: '#4a3300', light: '#f39c12', shadow: '#2a1d00', text: '#ffd580'},
  assessment: {bg: '#4a1a1a', light: '#e74c3c', shadow: '#2a0d0d', text: '#ffaaaa'},
};

export const MC_TASK_EMOJI: Record<string, string> = {
  dictation:  '✏️',
  reading:    '📖',
  domestic:   '🏠',
  assessment: '📝',
};

export const MC_XP_BY_TYPE: Record<string, number> = {
  dictation:  50,
  reading:    60,
  domestic:   40,
  assessment: 80,
};
