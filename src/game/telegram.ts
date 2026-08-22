/* Интеграция Telegram Mini Apps SDK (telegram-web-app.js).
   Вне Telegram все методы — безопасные заглушки, игра работает как обычно. */

import { STATS_WEBHOOK_URL } from "./core";

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
  initDataUnsafe?: { user?: TgUser; query_id?: string; start_param?: string };
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
  switchInlineChat?(text: string, chatTypes?: string[]): void;
  openTelegramLink?(url: string): void;
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

export function isTelegram(): boolean {
  return tg() !== null;
}

export function tgUser(): TgUser | null {
  return tg()?.initDataUnsafe?.user ?? null;
}

export function getMyId(): string {
  const id = tgUser()?.id;
  return id != null ? String(id) : "unknown";
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
  bestCustom: "snake_best_custom",
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

export function tgCloudSetRaw(key: string, value: string) {
  try {
    tg()?.CloudStorage?.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/* ---------- шаринг и рефералы ---------- */

export function getAppUrl(): string {
  try {
    return `${window.location.origin}${window.location.pathname}`;
  } catch {
    return "";
  }
}

export function buildRefLink(): string {
  const id = getMyId();
  return `${getAppUrl()}?ref=${id}`;
}

/* ?ref= из URL или start_param из Telegram deep-link */
export function getRefParam(): string | null {
  try {
    const sp = tg()?.initDataUnsafe?.start_param ?? "";
    if (sp) {
      const cleaned = sp.replace(/^ref[_-]?/i, "");
      if (/^\d+$/.test(cleaned)) return cleaned;
      if (/^\d+$/.test(sp)) return sp;
    }
    const q = new URLSearchParams(window.location.search).get("ref");
    if (q && q !== "undefined") return q;
  } catch {
    /* ignore */
  }
  return null;
}

function shareVia(text: string, link: string) {
  const w = tg();
  // 1) нативный выбор чата внутри Telegram
  if (w?.switchInlineChat) {
    try {
      w.switchInlineChat(`${text} ${link}`, ["users", "groups", "channels"]);
      return;
    } catch {
      /* пробуем дальше */
    }
  }
  // 2) классический share-диалог Telegram
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  if (w?.openTelegramLink) {
    try {
      w.openTelegramLink(shareUrl);
      return;
    } catch {
      /* и дальше */
    }
  }
  // 3) вне Telegram — системный/браузерный шаринг
  try {
    const nav = navigator as Navigator & { share?: (d: { text: string; url: string }) => Promise<void> };
    if (nav.share) {
      nav.share({ text, url: link }).catch(() => {});
      return;
    }
  } catch {
    /* ignore */
  }
  try {
    window.open(shareUrl, "_blank", "noopener");
  } catch {
    /* ignore */
  }
}

export function tgShareResult(score: number) {
  const text = `Хей, присоединяйся ко мне в игру! Я набрал ${score} очков в змейке 🐍 Сколько сможешь ты?`;
  shareVia(text, buildRefLink());
}

export function tgInviteFriend() {
  const text = "Хей, присоединяйся ко мне в игру! Гоняем в неоновую змейку 🐍";
  shareVia(text, buildRefLink());
}

/* ---------- JSONP-запрос к Apps Script: число активированных рефералов ---------- */

export function fetchReferralCount(id: string): Promise<number> {
  return new Promise((resolve) => {
    let done = false;
    const cbName = `__snakeRefCb${Date.now()}_${Math.floor(Math.random() * 1e5)}`;
    const w = window as unknown as Record<string, unknown>;

    const finish = (v: number) => {
      if (done) return;
      done = true;
      try {
        delete w[cbName];
      } catch {
        /* ignore */
      }
      script.remove();
      resolve(v);
    };

    const timer = window.setTimeout(() => finish(-1), 4000);
    w[cbName] = (data: { count?: unknown }) => {
      window.clearTimeout(timer);
      const n = Number(data?.count);
      finish(Number.isFinite(n) && n >= 0 ? n : 0);
    };

    const script = document.createElement("script");
    script.src = `${STATS_WEBHOOK_URL}?action=refcount&id=${encodeURIComponent(id)}&cb=${cbName}`;
    script.onerror = () => {
      window.clearTimeout(timer);
      finish(-1);
    };
    document.head.appendChild(script);
  });
}
