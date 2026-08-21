/* Интеграция Telegram Mini Apps SDK (telegram-web-app.js).
   Вне Telegram все методы — безопасные заглушки, игра работает как обычно. */

export interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TgHaptic {
  impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
  notificationOccurred(type: "error" | "success" | "warning"): void;
  selectionChanged(): void;
}

interface TgMainButton {
  text: string;
  isVisible: boolean;
  setParams(p: Record<string, unknown>): void;
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

interface TgBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

interface TgCloudStorage {
  setItem(key: string, value: string, cb?: (err: unknown, ok?: boolean) => void): void;
  getItem(key: string, cb: (err: unknown, value?: string) => void): void;
  getKeys(cb: (err: unknown, keys?: string[]) => void): void;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  version?: string;
  platform?: string;
  colorScheme?: "light" | "dark";
  initData?: string;
  initDataUnsafe?: { user?: TgUser; query_id?: string };
  themeParams?: Record<string, string>;
  viewportHeight?: number;
  viewportStableHeight?: number;
  MainButton?: TgMainButton;
  BackButton?: TgBackButton;
  HapticFeedback?: TgHaptic;
  CloudStorage?: TgCloudStorage;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  setBottomBarColor?(color: string): void;
  disableVerticalSwipes?(): void;
  onEvent?(event: string, cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function tg(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/* Скрипт SDK присутствует только внутри клиентов Telegram (или при локальной отладке с ним) */
export function isTelegram(): boolean {
  return tg() !== null;
}

export function tgUser(): TgUser | null {
  return tg()?.initDataUnsafe?.user ?? null;
}

export function tgPlatform(): string {
  return tg()?.platform ?? "web";
}

function applyViewport() {
  const w = tg();
  if (!w) return;
  const h = w.viewportStableHeight ?? w.viewportHeight;
  if (h && h > 0) {
    document.documentElement.style.setProperty("--tg-vh", `${Math.round(h)}px`);
  }
}

interface TgHandlers {
  onBack?: () => void;
}

/* Вызывается один раз при монтировании приложения */
export function tgInit(handlers: TgHandlers = {}) {
  const w = tg();
  if (!w) return;
  try {
    w.ready();
    w.expand();
  } catch {
    /* старые версии клиента — не критично */
  }
  try {
    w.setHeaderColor?.("#071510");
    w.setBackgroundColor?.("#071510");
    w.setBottomBarColor?.("#0a1c13");
  } catch {
    /* окраска шапки доступна не везде */
  }
  try {
    /* вертикальные свайпы управляют змейкой — не даём им закрывать мини-приложение */
    w.disableVerticalSwipes?.();
  } catch {
    /* метод появился в Bot API 7.8, на старых клиентах просто нет */
  }
  applyViewport();
  try {
    w.onEvent?.("viewportChanged", applyViewport);
  } catch {
    /* не все события доступны на десктопе */
  }
  if (handlers.onBack && w.BackButton) {
    try {
      w.BackButton.onClick(handlers.onBack);
    } catch {
      /* ignore */
    }
  }
}

/* ---------- нативная нижняя кнопка (MainButton) ---------- */
let mbHandler: (() => void) | null = null;

export function tgMainButton(text: string | null, action?: () => void) {
  const mb = tg()?.MainButton;
  if (!mb) return;
  try {
    if (!text) {
      mb.hide();
      return;
    }
    if (mbHandler) mb.offClick(mbHandler);
    mbHandler = action ?? null;
    if (mbHandler) mb.onClick(mbHandler);
    mb.setParams({
      text,
      color: "#a8e830",
      text_color: "#07150d",
      is_visible: true,
      is_active: true,
      is_progress_visible: false,
    });
    mb.show();
  } catch {
    /* ignore */
  }
}

/* ---------- кнопка «Назад» (BackButton, Android-клиент) ---------- */
export function tgBackButton(visible: boolean) {
  const b = tg()?.BackButton;
  if (!b) return;
  try {
    if (visible) b.show();
    else b.hide();
  } catch {
    /* ignore */
  }
}

/* ---------- тактильный отклик (iOS/Android) ---------- */
export function haptic(kind: "turn" | "eat" | "bonus" | "die" | "record" | "start" | "select") {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  try {
    switch (kind) {
      case "turn":
      case "select":
        h.selectionChanged();
        break;
      case "eat":
        h.impactOccurred("light");
        break;
      case "bonus":
      case "start":
        h.impactOccurred("medium");
        break;
      case "die":
        h.impactOccurred("heavy");
        h.notificationOccurred("error");
        break;
      case "record":
        h.notificationOccurred("success");
        break;
    }
  } catch {
    /* ignore */
  }
}

/* ---------- CloudStorage: рекорды между устройствами пользователя ---------- */
export const CLOUD_KEYS = {
  bestEasy: "snake_best_easy",
  bestClassic: "snake_best_classic",
  bestHard: "snake_best_hard",
  games: "snake_stats_games",
  apples: "snake_stats_apples",
} as const;

export function tgCloudLoad(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const cs = tg()?.CloudStorage;
    if (!cs) {
      resolve({});
      return;
    }
    const keys = Object.values(CLOUD_KEYS);
    const out: Record<string, number> = {};
    let settled = false;
    let pending = keys.length;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(out);
    };
    /* страховка: не ждём облако дольше 2,5 секунд */
    window.setTimeout(finish, 2500);
    keys.forEach((k) => {
      try {
        cs.getItem(k, (err, value) => {
          if (!err && value != null) {
            const n = Number(value);
            if (!Number.isNaN(n)) out[k] = n;
          }
          if (--pending <= 0) finish();
        });
      } catch {
        if (--pending <= 0) finish();
      }
    });
  });
}

/* CloudStorage лимитирует частоту записи, поэтому батчим по ключу */
const saveTimers = new Map<string, number>();

export function tgCloudSave(key: string, value: number) {
  const cs = tg()?.CloudStorage;
  if (!cs) return;
  if (saveTimers.has(key)) return;
  saveTimers.set(
    key,
    window.setTimeout(() => {
      saveTimers.delete(key);
      try {
        cs.setItem(key, String(Math.round(value)));
      } catch {
        /* ignore */
      }
    }, 1200)
  );
}
