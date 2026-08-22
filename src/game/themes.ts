import type { ThemeId } from "./core";

type RGB = [number, number, number];

export interface ThemeDef {
  id: ThemeId;
  label: string;
  note: string;
  bg1: string;
  bg2: string;
  checker: string;
  gridLine: string;
  wall: string;
  wallGlow: string;
  wallOpen: string;
  head: RGB;
  mid: RGB;
  tail: RGB;
  outline: string;
  glow: string;
  glowAlpha: number;
  scale: string;
  eyeWhite: string;
  eyePupil: string;
  snakeStyle: "round" | "bus";
  foodStyle: "apple" | "busstop";
  foodParticles: string[];
  floatColor: string;
  bonusParticles: string[];
  light: boolean;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  neon: {
    id: "neon",
    label: "Неон",
    note: "Ночной неоново-лаймовый сад — фирменный стиль",
    bg1: "#0e2419",
    bg2: "#081a11",
    checker: "rgba(190,255,210,0.017)",
    gridLine: "rgba(140,230,170,0.05)",
    wall: "rgba(168,232,48,0.38)",
    wallGlow: "rgba(168,232,48,0.5)",
    wallOpen: "rgba(59,214,176,0.5)",
    head: [198, 246, 92],
    mid: [124, 206, 60],
    tail: [36, 118, 70],
    outline: "#0d3520",
    glow: "#a8e830",
    glowAlpha: 0.15,
    scale: "rgba(240,255,210,0.14)",
    eyeWhite: "#f4ffe8",
    eyePupil: "#0d2412",
    snakeStyle: "round",
    foodStyle: "apple",
    foodParticles: ["#ff6a4d", "#ffc94a", "#a8e830"],
    floatColor: "#ffc94a",
    bonusParticles: ["#ffc94a", "#ffe9a8", "#ff9d2e"],
    light: false,
  },
  city: {
    id: "city",
    label: "Город",
    note: "Ночной маршрут: вы — автобус, еда — остановки",
    bg1: "#161c2a",
    bg2: "#0e1220",
    checker: "rgba(170,190,255,0.022)",
    gridLine: "rgba(140,165,225,0.06)",
    wall: "rgba(120,160,255,0.4)",
    wallGlow: "rgba(90,140,255,0.5)",
    wallOpen: "rgba(255,210,63,0.45)",
    head: [255, 216, 80],
    mid: [250, 176, 52],
    tail: [198, 120, 34],
    outline: "#57430f",
    glow: "#ffcf4d",
    glowAlpha: 0.14,
    scale: "rgba(210,235,255,0.5)",
    eyeWhite: "#eaf2ff",
    eyePupil: "#20263a",
    snakeStyle: "bus",
    foodStyle: "busstop",
    foodParticles: ["#5aa2ff", "#8fc1ff", "#ffd23f"],
    floatColor: "#8fc1ff",
    bonusParticles: ["#ffd23f", "#fff0b0", "#ff9d2e"],
    light: false,
  },
  google: {
    id: "google",
    label: "Ретро",
    note: "Светлая «шахматка» и красная змейка — оммаж классике",
    bg1: "#eef3ec",
    bg2: "#e6eee2",
    checker: "rgba(96,140,90,0.10)",
    gridLine: "rgba(96,140,90,0)",
    wall: "rgba(112,148,100,0.9)",
    wallGlow: "rgba(112,148,100,0.35)",
    wallOpen: "rgba(112,148,100,0.55)",
    head: [238, 90, 60],
    mid: [222, 64, 46],
    tail: [158, 38, 28],
    outline: "rgba(120,32,20,0.28)",
    glow: "#e7471d",
    glowAlpha: 0.08,
    scale: "rgba(255,255,255,0.35)",
    eyeWhite: "#ffffff",
    eyePupil: "#2b1410",
    snakeStyle: "round",
    foodStyle: "apple",
    foodParticles: ["#e7471d", "#7ac74f", "#f4b942"],
    floatColor: "#d33c22",
    bonusParticles: ["#f4b942", "#ffe9a8", "#e8960c"],
    light: true,
  },
};

export const THEME_ORDER: ThemeId[] = ["neon", "city", "google"];
