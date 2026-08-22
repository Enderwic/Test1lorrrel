/* Статистика: fire-and-forget POST на Google Apps Script.
   Plain JSON с Content-Type: text/plain → простой запрос без CORS-preflight.
   Любые ошибки глотаются — игра никогда не блокируется сетью. */

import { STATS_WEBHOOK_URL, type CustomCfg, type Difficulty, type ThemeId } from "./core";

/* локальное чтение Telegram-пользователя без импорта telegram.ts (нет циклов) */
function tgUserLocal(): { id?: number; first_name?: string } | null {
  try {
    return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
  } catch {
    return null;
  }
}

const t0 = Date.now();

let mode: Difficulty = "classic";
let theme: ThemeId = "neon";
let custom: CustomCfg | null = null;
let shares = 0;
let extraLifeUsed = 0;
let refActivated = false;
let sessionBest = 0;

export const statsApi = {
  setMode(m: Difficulty) {
    mode = m;
  },
  setTheme(t: ThemeId) {
    theme = t;
  },
  setCustom(c: CustomCfg | null) {
    custom = c;
  },
  setExtraLifeUsed(n: number) {
    extraLifeUsed = n;
  },
  setRefActivated(v: boolean) {
    refActivated = v;
  },
  bumpShares() {
    shares += 1;
  },
  bumpBest(score: number) {
    if (score > sessionBest) sessionBest = score;
  },
  getMode(): Difficulty {
    return mode;
  },
};

export type StatsEvent = "game_over" | "page_hide" | "share_click" | "referral_activated";

export function track(event: StatsEvent, extra: Record<string, unknown> = {}) {
  try {
    const user = tgUserLocal();
    const payload: Record<string, unknown> = {
      event,
      telegram_id: user?.id ?? "unknown",
      first_name: user?.first_name ?? "unknown",
      mode,
      theme,
      score: sessionBest,
      session_sec: Math.round((Date.now() - t0) / 1000),
      shares,
      extra_life_used: extraLifeUsed,
      referral_activated: refActivated ? 1 : 0,
    };
    if (custom && mode === "custom") {
      payload.custom_speed_ms = custom.baseMs;
      payload.custom_accel = custom.accel ? 1 : 0;
      payload.custom_grid = custom.grid;
    }
    Object.assign(payload, extra);
    fetch(STATS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    /* статистика не должна ломать игру */
  }
}

let hideSentAt = 0;

/* подписки на скрытие страницы / закрытие мини-приложения (keepalive внутри track) */
export function initStats() {
  const send = () => {
    const now = Date.now();
    if (now - hideSentAt < 2500) return; // защита от двойного срабатывания
    hideSentAt = now;
    track("page_hide");
  };
  const onVis = () => {
    if (document.visibilityState === "hidden") send();
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", send);
}
