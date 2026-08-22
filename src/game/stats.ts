/* Простая статистика fire-and-forget: финиш партии и закрытие приложения
   отправляются в Google Apps Script. Тело — plain JSON с Content-Type: text/plain
   (простой запрос без CORS-preflight, ответ непрозрачный). Лбая ошибка глотается:
   статистика никогда не должна мешать игре. */

import { tgUser } from "./telegram";
import type { Difficulty } from "./core";

const STATS_URL =
  "https://script.google.com/macros/s/AKfycbzqiIQskyorFQCn9zCSL3F8ZSBOFro33vqJQyjLpwzvYzva2AL0yJFBmCRymsxHnig/exec";

const openedAt = Date.now();
let currentMode = "classic";
let sessionBest = 0;
let lastCloseSentAt = 0;

/* актуальная сложность — для события закрытия приложения */
export function setStatsMode(mode: Difficulty) {
  currentMode = mode;
}

/* лучший счёт текущей сессии (максимум по всем сыгранным партиям) */
export function trackSessionBest(score: number) {
  if (score > sessionBest) sessionBest = score;
}

function fire(mode: string, keepalive: boolean) {
  /* защита от двойного «закрытия»: visibilitychange + pagehide подряд */
  if (keepalive) {
    const now = Date.now();
    if (now - lastCloseSentAt < 2500) return;
    lastCloseSentAt = now;
  }
  const user = tgUser();
  const payload = JSON.stringify({
    telegram_id: user?.id ?? "unknown",
    first_name: user?.first_name ?? "unknown",
    mode,
    score: sessionBest,
    session_sec: Math.round((Date.now() - openedAt) / 1000),
  });
  try {
    void fetch(STATS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: payload,
      keepalive,
    }).catch(() => {
      /* молча */
    });
  } catch {
    /* молча */
  }
}

/* 1) каждый финиш партии */
export function sendGameOverStats(mode: Difficulty) {
  fire(mode, false);
}

/* 2) скрытие страницы / закрытие приложения — с keepalive, чтобы запрос
   успел уйти даже при мгновенном закрытии вьюпорта */
if (typeof window !== "undefined") {
  const onClose = () => fire(currentMode, true);
  window.addEventListener("pagehide", onClose);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) onClose();
  });
}
