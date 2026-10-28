export const REFERENCE = { width: 1860, height: 962, fps: 60, duration: 596 / 60 };

export interface SceneConfig {
  spacing: number;
  dotSize: number;
  brightness: number;
  hourglassScale: number;
  ribbonAmplitude: number;
  ribbonWidth: number;
  speed: number;
  sandFlow: number;
  color: string;
  background: string;
  showHourglass: boolean;
  showRibbons: boolean;
}

export const DEFAULT_CONFIG: SceneConfig = {
  spacing: 7, dotSize: 2.3, brightness: 1,
  hourglassScale: 1, ribbonAmplitude: 1, ribbonWidth: 1,
  speed: 1, sandFlow: 1, color: '#36549c', background: '#000102',
  showHourglass: true, showRibbons: true,
};

export const LIMITS: Record<string, [number, number]> = {
  spacing: [4, 14], dotSize: [0.8, 5], brightness: [0.2, 4],
  hourglassScale: [0.6, 1.4], ribbonAmplitude: [0, 2], ribbonWidth: [0.25, 3],
  speed: [0, 2], sandFlow: [0, 2],
};

export function sanitizeConfig(value: unknown, base: SceneConfig = DEFAULT_CONFIG): SceneConfig {
  const next = { ...base };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return next;
  const input = value as Record<string, unknown>;
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const val = input[key];
    if (typeof val === 'number' && Number.isFinite(val)) {
      (next as unknown as Record<string, unknown>)[key] = Math.min(max, Math.max(min, val));
    }
  }
  for (const key of ['color', 'background'] as const) {
    if (typeof input[key] === 'string' && /^#[0-9a-f]{6}$/i.test(input[key])) next[key] = input[key];
  }
  for (const key of ['showHourglass', 'showRibbons'] as const) {
    if (typeof input[key] === 'boolean') next[key] = input[key];
  }
  return next;
}
