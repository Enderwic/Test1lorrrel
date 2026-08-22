import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CUSTOM,
  DEFAULT_GRID,
  resolveCfg,
  createWorld,
  randomFree,
  spawnBurst,
  addFloater,
  speedLevel,
  type CustomCfg,
  type Difficulty,
  type Phase,
  type Pt,
  type ThemeId,
  type World,
} from "./core";
import { THEMES } from "./themes";
import { draw } from "./render";
import { sfx, setSfxMuted, initSfx } from "./audio";
import {
  CLOUD_KEYS,
  fetchReferralCount,
  getMyId,
  getRefParam,
  haptic,
  isTelegram,
  tgBackButton,
  tgCloudLoad,
  tgCloudSave,
  tgCloudSetRaw,
  tgInviteFriend,
  tgMainButton,
  tgShareResult,
} from "./telegram";
import { statsApi, track } from "./stats";

function lsGet(k: string, d = ""): string {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
}
function lsSet(k: string, v: string | number) {
  try {
    localStorage.setItem(k, String(v));
  } catch {
    /* приватный режим — играем без сохранений */
  }
}

export interface RunStats {
  games: number;
  apples: number;
}

function loadBest(): Record<Difficulty, number> {
  return {
    easy: Number(lsGet("snake.best.easy", "0")) || 0,
    classic: Number(lsGet("snake.best.classic", "0")) || 0,
    hard: Number(lsGet("snake.best.hard", "0")) || 0,
    custom: Number(lsGet("snake.best.custom", "0")) || 0,
  };
}

function loadStats(): RunStats {
  return {
    games: Number(lsGet("snake.games", "0")) || 0,
    apples: Number(lsGet("snake.apples", "0")) || 0,
  };
}

function loadCustom(): CustomCfg {
  try {
    const raw = JSON.parse(lsGet("snake.custom", "null")) as Partial<CustomCfg> | null;
    if (raw && typeof raw.baseMs === "number") {
      return {
        baseMs: Math.max(60, Math.min(200, raw.baseMs)),
        accel: raw.accel !== false,
        grid: raw.grid === 15 || raw.grid === 27 ? raw.grid : DEFAULT_GRID,
      };
    }
  } catch {
    /* повреждённые настройки — берём дефолт */
  }
  return { ...DEFAULT_CUSTOM };
}

function loadTheme(): ThemeId {
  const t = lsGet("snake.theme", "neon");
  return t === "city" || t === "google" ? t : "neon";
}

function aiSteer(w: World) {
  const cfg = w.cfg;
  const head = w.snake[0];
  const dirs: Pt[] = [
    w.dir,
    { x: -w.dir.y, y: w.dir.x },
    { x: w.dir.y, y: -w.dir.x },
  ];
  const isSafe = (d: Pt) => {
    let nx = head.x + d.x;
    let ny = head.y + d.y;
    if (cfg.walls) {
      if (nx < 0 || ny < 0 || nx >= w.cols || ny >= w.rows) return false;
    } else {
      nx = (nx + w.cols) % w.cols;
      ny = (ny + w.rows) % w.rows;
    }
    for (let i = 0; i < w.snake.length - 1; i++) {
      if (w.snake[i].x === nx && w.snake[i].y === ny) return false;
    }
    return true;
  };
  const dist = (d: Pt) => {
    let nx = head.x + d.x;
    let ny = head.y + d.y;
    if (!cfg.walls) {
      nx = (nx + w.cols) % w.cols;
      ny = (ny + w.rows) % w.rows;
    }
    const dx = Math.min(Math.abs(nx - w.food.x), w.cols - Math.abs(nx - w.food.x));
    const dy = Math.min(Math.abs(ny - w.food.y), w.rows - Math.abs(ny - w.food.y));
    return dx + dy;
  };
  const safe = dirs.filter(isSafe);
  if (safe.length === 0) return;
  safe.sort((a, b) => dist(a) - dist(b));
  const pick = safe.length > 1 && Math.random() < 0.07 ? safe[1] : safe[0];
  if (!(pick.x === -w.dir.x && pick.y === -w.dir.y)) w.dir = pick;
}

const demoWorld = () =>
  createWorld(true, resolveCfg("classic", DEFAULT_CUSTOM), DEFAULT_GRID, DEFAULT_GRID, 0);

export function useSnakeGame(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const dataRef = useRef({ best: loadBest(), stats: loadStats() });

  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficultyState] = useState<Difficulty>(() => {
    const d = lsGet("snake.diff", "classic");
    return d === "easy" || d === "hard" || d === "custom" ? d : "classic";
  });
  const [custom, setCustomState] = useState<CustomCfg>(loadCustom);
  const [theme, setThemeState] = useState<ThemeId>(loadTheme);
  const [score, setScore] = useState(0);
  const [apples, setApples] = useState(0);
  const [snakeLen, setSnakeLen] = useState(3);
  const [speed, setSpeed] = useState(1);
  const [best, setBest] = useState<Record<Difficulty, number>>(dataRef.current.best);
  const [stats, setStats] = useState<RunStats>(dataRef.current.stats);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [muted, setMutedState] = useState(() => lsGet("snake.muted", "0") === "1");
  const [lives, setLives] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [bonusLives, setBonusLives] = useState(0);
  const [refCount, setRefCount] = useState(0);

  const phaseRef = useRef<Phase>("menu");
  const diffRef = useRef<Difficulty>(difficulty);
  const customRef = useRef<CustomCfg>(custom);
  const themeRef = useRef<ThemeId>(theme);
  const bonusLivesRef = useRef(0);
  const worldRef = useRef<World>(demoWorld());
  const countdownRef = useRef(-1);
  const flashTimer = useRef(0);
  const lastElapsedRef = useRef(-1);

  const setPhaseAll = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* синхронизация модуля статистики с настройками */
  useEffect(() => {
    setSfxMuted(lsGet("snake.muted", "0") === "1");
    statsApi.setMode(diffRef.current);
    statsApi.setTheme(themeRef.current);
    statsApi.setCustom(diffRef.current === "custom" ? customRef.current : null);
  }, []);

  /* реферальный бонус: локальное значение сразу, серверное — как придёт */
  useEffect(() => {
    const myId = getMyId();
    if (myId !== "unknown") {
      const saved = Math.min(2, Number(lsGet(`snake.refBonus.${myId}`, "0")) || 0);
      if (saved > 0) {
        bonusLivesRef.current = saved;
        setBonusLives(saved);
      }
      fetchReferralCount(myId).then((count) => {
        if (count < 0) return; // сеть недоступна — живём с локальным
        const bonus = Math.min(2, count);
        bonusLivesRef.current = bonus;
        setBonusLives(bonus);
        setRefCount(count);
        lsSet(`snake.refBonus.${myId}`, bonus);
        tgCloudSetRaw(`snake_ref_bonus_${myId}`, String(bonus));
      });
    }
  }, []);

  const finalize = useCallback(
    (w: World) => {
      const d = diffRef.current;
      const data = dataRef.current;
      const rec = w.score > data.best[d];
      data.stats = { games: data.stats.games + 1, apples: data.stats.apples + w.eaten };
      lsSet("snake.games", data.stats.games);
      lsSet("snake.apples", data.stats.apples);
      tgCloudSave(CLOUD_KEYS.games, data.stats.games);
      tgCloudSave(CLOUD_KEYS.apples, data.stats.apples);
      setStats({ ...data.stats });
      if (rec && w.score > 0) {
        data.best = { ...data.best, [d]: w.score };
        lsSet(`snake.best.${d}`, w.score);
        tgCloudSave(
          CLOUD_KEYS[`best${d[0].toUpperCase()}${d.slice(1)}` as keyof typeof CLOUD_KEYS],
          w.score
        );
        setBest(data.best);
        setNewRecord(true);
      }
      /* статистика: лучший счёт сессии + активация реферала после первого финиша */
      statsApi.bumpBest(w.score);
      if (pendingRef && !lsGet("snake.refActivated")) {
        lsSet("snake.refActivated", "1");
        statsApi.setRefActivated(true);
        track("referral_activated", { ref: pendingRef });
      }
      track("game_over", { extra_life_used: w.extraUsed, run_score: w.score, run_apples: w.eaten });
      setPhaseAll("over");
      sfx.over();
      if (rec && w.score > 0) {
        haptic("record");
        window.setTimeout(() => sfx.record(), 550);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setPhaseAll]
  );

  /* отложенный реферал: ?ref= в адресе + отсутствие локального флага активации */
  const pendingRef = useMemo(() => {
    const r = getRefParam();
    if (!r) return null;
    if (lsGet("snake.refActivated")) return null;
    if (r === getMyId()) return null; // сам себя пригласить нельзя
    return r;
  }, []);

  const kill = useCallback(
    (w: World, now: number) => {
      const h = w.snake[0];
      spawnBurst(w, h.x + 0.5, h.y + 0.5, ["#a8e830", "#7cc93e", "#ff6a4d", "#d8fb7e"], 26, 3.2);
      w.shake = 1;
      if (!w.demo && w.lives > 0) {
        /* есть запасная жизнь — предлагаем продолжить, змейка цела */
        sfx.die();
        haptic("die");
        setLives(w.lives);
        setPhaseAll("extraLife");
        return;
      }
      w.dying = true;
      w.diedAt = now;
      if (!w.demo) {
        sfx.die();
        haptic("die");
      }
    },
    [setPhaseAll]
  );

  const doStep = useCallback(
    (w: World, now: number) => {
      const cfg = w.cfg;
      if (w.demo) aiSteer(w);
      if (w.queue.length) {
        const d = w.queue.shift()!;
        if (!(d.x === -w.dir.x && d.y === -w.dir.y) && !(d.x === w.dir.x && d.y === w.dir.y)) {
          w.dir = d;
        }
      }
      const head = w.snake[0];
      let nx = head.x + w.dir.x;
      let ny = head.y + w.dir.y;
      const invuln = now < w.invulnUntil;
      if (cfg.walls) {
        if (nx < 0 || ny < 0 || nx >= w.cols || ny >= w.rows) {
          if (invuln) {
            nx = (nx + w.cols) % w.cols;
            ny = (ny + w.rows) % w.rows;
          } else {
            kill(w, now);
            return;
          }
        }
      } else {
        nx = (nx + w.cols) % w.cols;
        ny = (ny + w.rows) % w.rows;
      }
      const eatingFood = nx === w.food.x && ny === w.food.y;
      const willGrow = w.grow > 0 || eatingFood;
      const body = willGrow ? w.snake : w.snake.slice(0, -1);
      if (!invuln && body.some((s) => s.x === nx && s.y === ny)) {
        kill(w, now);
        return;
      }

      const old = w.snake;
      w.prev = old;
      w.snake = [{ x: nx, y: ny }, ...old];

      if (eatingFood) {
        const pts = 10 * cfg.mult;
        w.score += pts;
        w.eaten += 1;
        w.grow += 1;
        w.tongueUntil = now + 550;
        const th = THEMES[themeRef.current];
        spawnBurst(w, nx + 0.5, ny + 0.5, th.foodParticles, 16, 2.4);
        addFloater(w, nx, ny - 0.4, `+${pts}`, th.floatColor);
        w.food = randomFree([...w.snake, ...(w.bonus ? [w.bonus.pos] : [])], w.cols, w.rows);
        w.foodSeed = Math.random() * 1000;
        if (cfg.accel > 0) w.stepMs = Math.max(cfg.minMs, w.stepMs - cfg.accel);
        if (w.eaten % 5 === 0 && !w.bonus) {
          w.bonus = { pos: randomFree([...w.snake, w.food], w.cols, w.rows), born: now, ttl: 6500 };
          if (!w.demo) {
            sfx.bonusSpawn();
            haptic("bonus");
          }
        }
        if (!w.demo) {
          sfx.eat();
          haptic("eat");
          w.shake = Math.min(1, w.shake + 0.22);
          setScore(w.score);
          setApples(w.eaten);
          setSnakeLen(w.snake.length);
          setSpeed(speedLevel(cfg, w.stepMs));
        }
      } else if (w.bonus && nx === w.bonus.pos.x && ny === w.bonus.pos.y) {
        const pts = 50 * cfg.mult;
        w.score += pts;
        w.grow += 2;
        w.tongueUntil = now + 550;
        const th = THEMES[themeRef.current];
        spawnBurst(w, nx + 0.5, ny + 0.5, th.bonusParticles, 22, 3);
        addFloater(w, nx, ny - 0.4, `+${pts}`, th.floatColor);
        w.bonus = null;
        if (!w.demo) {
          sfx.bonus();
          haptic("bonus");
          w.shake = Math.min(1, w.shake + 0.4);
          setScore(w.score);
          setSnakeLen(w.snake.length);
        }
      }

      if (w.grow > 0) w.grow -= 1;
      else w.snake.pop();

      w.lastStep += w.stepMs;
    },
    [kill]
  );

  /* ---------- главный цикл ---------- */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(50, now - last);
      last = now;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const size = canvas.clientWidth || 300;
      const px = Math.round(size * dpr);
      if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px;
        canvas.height = px;
      }

      const w = worldRef.current;
      const ph = phaseRef.current;

      if (ph === "countdown") {
        const rem = w.countdownEnd - now;
        const num = Math.max(0, Math.min(3, Math.ceil(rem / 500)));
        if (num !== countdownRef.current) {
          countdownRef.current = num;
          setCountdown(num);
          sfx.count(num === 0);
        }
        if (rem <= 0) {
          setPhaseAll("playing");
          w.lastStep = now;
          setFlash(true);
          window.clearTimeout(flashTimer.current);
          flashTimer.current = window.setTimeout(() => setFlash(false), 650);
          sfx.start();
        }
      }

      if (ph === "playing") {
        w.elapsed += dt;
        const sec = Math.floor(w.elapsed / 1000);
        if (sec !== lastElapsedRef.current) {
          lastElapsedRef.current = sec;
          setElapsedSec(sec);
        }
      }

      if ((ph === "playing" || ph === "menu") && !w.dying) {
        let guard = 0;
        while (now - w.lastStep >= w.stepMs && guard++ < 3) {
          doStep(w, now);
          if (w.dying || phaseRef.current === "extraLife") break;
        }
      }

      if (w.dying && !w.finalized) {
        if (w.demo) {
          if (now - w.diedAt > 600) worldRef.current = demoWorld();
        } else if (now - w.diedAt > 720) {
          w.finalized = true;
          finalize(w);
        }
      }

      if (w.bonus && now - w.bonus.born > w.bonus.ttl) {
        spawnBurst(w, w.bonus.pos.x + 0.5, w.bonus.pos.y + 0.5, ["#ffc94a"], 6, 1.2);
        w.bonus = null;
      }

      for (const p of w.particles) {
        p.life -= dt / p.ttl;
        p.x += (p.vx * dt) / 1000;
        p.y += (p.vy * dt) / 1000;
        p.vy += (p.grav * dt) / 1000;
      }
      w.particles = w.particles.filter((p) => p.life > 0);
      for (const f of w.floaters) f.life -= dt / f.ttl;
      w.floaters = w.floaters.filter((f) => f.life > 0);
      w.shake = Math.max(0, w.shake - dt / 300);

      draw(ctx, w, now, themeRef.current, size, dpr, ph);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(flashTimer.current);
    };
  }, [canvasRef, doStep, finalize, setPhaseAll]);

  /* ---------- действия ---------- */
  const start = useCallback(() => {
    initSfx();
    const d = diffRef.current;
    const cfg = resolveCfg(d, customRef.current);
    const grid = d === "custom" ? customRef.current.grid : DEFAULT_GRID;
    /* w.lives — только БОНУСНЫЕ жизни (за рефералов). Базовая жизнь одна,
       она не считается запасной: без рефералов continue не предлагается. */
    const totalLives = bonusLivesRef.current;
    const w = createWorld(false, cfg, grid, grid, totalLives);
    w.countdownEnd = performance.now() + 1500;
    worldRef.current = w;
    countdownRef.current = -1;
    lastElapsedRef.current = -1;
    setCountdown(3);
    setScore(0);
    setApples(0);
    setSnakeLen(3);
    setSpeed(1);
    setLives(totalLives);
    setElapsedSec(0);
    setNewRecord(false);
    statsApi.setMode(d);
    statsApi.setCustom(d === "custom" ? customRef.current : null);
    statsApi.setExtraLifeUsed(0);
    setPhaseAll("countdown");
    sfx.click();
  }, [setPhaseAll]);

  const pause = useCallback(() => {
    if (phaseRef.current === "playing") {
      setPhaseAll("paused");
      sfx.click();
    }
  }, [setPhaseAll]);

  const resume = useCallback(() => {
    if (phaseRef.current === "paused") {
      worldRef.current.lastStep = performance.now();
      setPhaseAll("playing");
      sfx.click();
    }
  }, [setPhaseAll]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") pause();
    else if (phaseRef.current === "paused") resume();
  }, [pause, resume]);

  const toMenu = useCallback(() => {
    worldRef.current = demoWorld();
    setPhaseAll("menu");
    setScore(0);
    setNewRecord(false);
    sfx.click();
  }, [setPhaseAll]);

  const continueRun = useCallback(() => {
    if (phaseRef.current !== "extraLife") return;
    const w = worldRef.current;
    w.lives -= 1;
    w.extraUsed += 1;
    setLives(w.lives);
    statsApi.setExtraLifeUsed(w.extraUsed);
    w.dying = false;
    w.invulnUntil = performance.now() + 1000;
    w.lastStep = performance.now();
    setPhaseAll("playing");
    sfx.start();
    haptic("start");
  }, [setPhaseAll]);

  const finishRun = useCallback(() => {
    if (phaseRef.current !== "extraLife") return;
    const w = worldRef.current;
    w.dying = true;
    w.finalized = true;
    finalize(w);
  }, [finalize]);

  const setDifficulty = useCallback((d: Difficulty) => {
    initSfx();
    diffRef.current = d;
    setDifficultyState(d);
    lsSet("snake.diff", d);
    sfx.click();
    haptic("select");
  }, []);

  const setCustom = useCallback((patch: Partial<CustomCfg>) => {
    setCustomState((prev) => {
      const next = { ...prev, ...patch };
      customRef.current = next;
      lsSet("snake.custom", JSON.stringify(next));
      if (diffRef.current === "custom") statsApi.setCustom(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((t: ThemeId) => {
    themeRef.current = t;
    setThemeState(t);
    lsSet("snake.theme", t);
    statsApi.setTheme(t);
    initSfx();
    sfx.click();
    haptic("select");
  }, []);

  const input = useCallback((dx: number, dy: number) => {
    const ph = phaseRef.current;
    if (ph !== "playing" && ph !== "countdown") return;
    const w = worldRef.current;
    const lastD = w.queue.length ? w.queue[w.queue.length - 1] : w.dir;
    if (dx === -lastD.x && dy === -lastD.y) return;
    if (dx === lastD.x && dy === lastD.y) return;
    if (w.queue.length >= 3) w.queue.shift();
    w.queue.push({ x: dx, y: dy });
    haptic("turn");
  }, []);

  const toggleMuted = useCallback(() => {
    initSfx();
    setMutedState((m) => {
      const nm = !m;
      lsSet("snake.muted", nm ? "1" : "0");
      setSfxMuted(nm);
      if (!nm) sfx.click();
      return nm;
    });
  }, []);

  const shareResult = useCallback(() => {
    initSfx();
    sfx.click();
    tgShareResult(score);
    statsApi.bumpShares();
    track("share_click", { source: "result" });
  }, [score]);

  const inviteFriend = useCallback(() => {
    initSfx();
    sfx.click();
    tgInviteFriend();
    track("share_click", { source: "invite" });
  }, []);

  /* ---------- Telegram Mini Apps ---------- */
  const tgMode = isTelegram();

  /* системная кнопка «Назад» */
  const onTgBack = useCallback(() => {
    const ph = phaseRef.current;
    if (ph === "playing") pause();
    else if (ph === "countdown") toMenu();
    else if (ph === "extraLife") finishRun();
    else if (ph === "paused" || ph === "over") toMenu();
  }, [pause, toMenu, finishRun]);

  /* нативные кнопки клиента Telegram следуют за фазой игры */
  useEffect(() => {
    if (!tgMode) return;
    if (phase === "menu") tgMainButton("ИГРАТЬ", start);
    else if (phase === "paused") tgMainButton("ПРОДОЛЖИТЬ", resume);
    else if (phase === "over") tgMainButton("ЕЩЁ РАЗ", start);
    else if (phase === "extraLife") tgMainButton("ПРОДОЛЖИТЬ", continueRun);
    else tgMainButton(null);
    tgBackButton(phase !== "menu");
  }, [tgMode, phase, start, resume, continueRun]);

  /* рекорды из Telegram CloudStorage (синхронизация между устройствами) */
  useEffect(() => {
    if (!tgMode) return;
    let alive = true;
    tgCloudLoad().then((remote) => {
      if (!alive) return;
      const data = dataRef.current;
      const cloudBest: Record<Difficulty, number> = {
        easy: remote[CLOUD_KEYS.bestEasy] ?? 0,
        classic: remote[CLOUD_KEYS.bestClassic] ?? 0,
        hard: remote[CLOUD_KEYS.bestHard] ?? 0,
        custom: remote[CLOUD_KEYS.bestCustom] ?? 0,
      };
      const merged: Record<Difficulty, number> = {
        easy: Math.max(data.best.easy, cloudBest.easy),
        classic: Math.max(data.best.classic, cloudBest.classic),
        hard: Math.max(data.best.hard, cloudBest.hard),
        custom: Math.max(data.best.custom, cloudBest.custom),
      };
      const games = Math.max(data.stats.games, remote[CLOUD_KEYS.games] ?? 0);
      const applesTotal = Math.max(data.stats.apples, remote[CLOUD_KEYS.apples] ?? 0);
      if (
        merged.easy !== data.best.easy ||
        merged.classic !== data.best.classic ||
        merged.hard !== data.best.hard ||
        merged.custom !== data.best.custom
      ) {
        data.best = merged;
        lsSet("snake.best.easy", merged.easy);
        lsSet("snake.best.classic", merged.classic);
        lsSet("snake.best.hard", merged.hard);
        lsSet("snake.best.custom", merged.custom);
        setBest(merged);
      }
      if (games !== data.stats.games || applesTotal !== data.stats.apples) {
        data.stats = { games, apples: applesTotal };
        lsSet("snake.games", games);
        lsSet("snake.apples", applesTotal);
        setStats(data.stats);
      }
    });
    return () => {
      alive = false;
    };
  }, [tgMode]);

  return {
    phase,
    difficulty,
    custom,
    theme,
    score,
    apples,
    snakeLen,
    speed,
    best,
    stats,
    countdown,
    flash,
    newRecord,
    muted,
    lives,
    elapsedSec,
    bonusLives,
    refCount,
    tgMode,
    onTgBack,
    start,
    pause,
    resume,
    togglePause,
    toMenu,
    continueRun,
    finishRun,
    setDifficulty,
    setCustom,
    setTheme,
    input,
    toggleMuted,
    shareResult,
    inviteFriend,
  };
}

export type SnakeGame = ReturnType<typeof useSnakeGame>;
