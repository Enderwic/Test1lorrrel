export type Pt = { x: number; y: number };

export type Difficulty = "easy" | "classic" | "hard";

export type Phase = "menu" | "countdown" | "playing" | "paused" | "over";

export const COLS = 21;
export const ROWS = 21;

export interface DiffCfg {
  id: Difficulty;
  label: string;
  tag: string;
  desc: string;
  baseMs: number;
  minMs: number;
  accel: number;
  walls: boolean;
  mult: number;
}

export const DIFFS: Record<Difficulty, DiffCfg> = {
  easy: {
    id: "easy",
    label: "Новичок",
    tag: "×1 очки",
    desc: "Спокойный темп · края поля замыкаются",
    baseMs: 150,
    minMs: 92,
    accel: 2.2,
    walls: false,
    mult: 1,
  },
  classic: {
    id: "classic",
    label: "Классика",
    tag: "×2 очки",
    desc: "Бодрый темп · стены смертельны",
    baseMs: 105,
    minMs: 62,
    accel: 2.0,
    walls: true,
    mult: 2,
  },
  hard: {
    id: "hard",
    label: "Хардкор",
    tag: "×3 очки",
    desc: "Бешеная скорость · стены смертельны",
    baseMs: 66,
    minMs: 40,
    accel: 1.6,
    walls: true,
    mult: 3,
  },
};

export const DIFF_ORDER: Difficulty[] = ["easy", "classic", "hard"];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  color: string;
  grav: number;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  ttl: number;
  color: string;
}

export interface Bonus {
  pos: Pt;
  born: number;
  ttl: number;
}

export interface World {
  demo: boolean;
  snake: Pt[];
  prev: Pt[];
  dir: Pt;
  queue: Pt[];
  grow: number;
  food: Pt;
  foodSeed: number;
  bonus: Bonus | null;
  eaten: number;
  score: number;
  stepMs: number;
  lastStep: number;
  countdownEnd: number;
  particles: Particle[];
  floaters: Floater[];
  shake: number;
  dying: boolean;
  diedAt: number;
  finalized: boolean;
  tongueUntil: number;
}

export function randomFree(occupied: Pt[]): Pt {
  const taken = new Set(occupied.map((p) => `${p.x},${p.y}`));
  const free: Pt[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
}

export function createWorld(demo: boolean, stepMs: number): World {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  const snake: Pt[] = [
    { x: cx + 1, y: cy },
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
  ];
  const food = randomFree([...snake, { x: cx + 2, y: cy }, { x: cx + 3, y: cy }]);
  return {
    demo,
    snake,
    prev: snake.map((p) => ({ ...p })),
    dir: { x: 1, y: 0 },
    queue: [],
    grow: 0,
    food,
    foodSeed: Math.random() * 1000,
    bonus: null,
    eaten: 0,
    score: 0,
    stepMs,
    lastStep: performance.now(),
    countdownEnd: 0,
    particles: [],
    floaters: [],
    shake: 0,
    dying: false,
    diedAt: 0,
    finalized: false,
    tongueUntil: 0,
  };
}

export function spawnBurst(
  w: World,
  x: number,
  y: number,
  colors: string[],
  count: number,
  power: number
) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (0.6 + Math.random() * 1.4) * power;
    w.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 0.5,
      life: 1,
      ttl: 380 + Math.random() * 420,
      size: 0.09 + Math.random() * 0.13,
      color: colors[Math.floor(Math.random() * colors.length)],
      grav: 2.4,
    });
  }
  if (w.particles.length > 220) w.particles.splice(0, w.particles.length - 220);
}

export function addFloater(w: World, x: number, y: number, text: string, color: string) {
  w.floaters.push({ x, y, text, life: 1, ttl: 900, color });
}

export function speedLevel(cfg: DiffCfg, stepMs: number): number {
  const ratio = (cfg.baseMs - stepMs) / Math.max(1, cfg.baseMs - cfg.minMs);
  return Math.max(1, Math.min(10, 1 + Math.round(ratio * 9)));
}
