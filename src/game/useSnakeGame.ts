import { useCallback, useEffect, useRef, useState } from "react";
import {
  COLS,
  ROWS,
  DIFFS,
  createWorld,
  randomFree,
  spawnBurst,
  addFloater,
  speedLevel,
  type Difficulty,
  type DiffCfg,
  type Phase,
  type Pt,
  type World,
} from "./core";
import { draw } from "./render";
import { sfx, setSfxMuted, initSfx } from "./audio";
import {
  CLOUD_KEYS,
  haptic,
  isTelegram,
  tgBackButton,
  tgCloudLoad,
  tgCloudSave,
  tgMainButton,
} from "./telegram";

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
  };
}

function loadStats(): RunStats {
  return {
    games: Number(lsGet("snake.games", "0")) || 0,
    apples: Number(lsGet("snake.apples", "0")) || 0,
  };
}

function aiSteer(w: World, cfg: DiffCfg) {
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
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
    } else {
      nx = (nx + COLS) % COLS;
      ny = (ny + ROWS) % ROWS;
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
      nx = (nx + COLS) % COLS;
      ny = (ny + ROWS) % ROWS;
    }
    const dx = Math.min(Math.abs(nx - w.food.x), COLS - Math.abs(nx - w.food.x));
    const dy = Math.min(Math.abs(ny - w.food.y), ROWS - Math.abs(ny - w.food.y));
    return dx + dy;
  };
  const safe = dirs.filter(isSafe);
  if (safe.length === 0) return;
  safe.sort((a, b) => dist(a) - dist(b));
  const pick = safe.length > 1 && Math.random() < 0.07 ? safe[1] : safe[0];
  if (!(pick.x === -w.dir.x && pick.y === -w.dir.y)) w.dir = pick;
}

export function useSnakeGame(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const dataRef = useRef({ best: loadBest(), stats: loadStats() });

  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficultyState] = useState<Difficulty>(() => {
    const d = lsGet("snake.diff", "classic");
    return d === "easy" || d === "hard" ? d : "classic";
  });
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

  const phaseRef = useRef<Phase>("menu");
  const diffRef = useRef<Difficulty>(difficulty);
  const worldRef = useRef<World>(createWorld(true, 110));
  const countdownRef = useRef(-1);
  const flashTimer = useRef(0);

  const setPhaseAll = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  useEffect(() => {
    setSfxMuted(lsGet("snake.muted", "0") === "1");
  }, []);

  const kill = useCallback((w: World, now: number) => {
    w.dying = true;
    w.diedAt = now;
    const h = w.snake[0];
    spawnBurst(w, h.x + 0.5, h.y + 0.5, ["#a8e830", "#7cc93e", "#ff6a4d", "#d8fb7e"], 26, 3.2);
    w.shake = 1;
    if (!w.demo) {
      sfx.die();
      haptic("die");
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
        tgCloudSave(CLOUD_KEYS[`best${d[0].toUpperCase()}${d.slice(1)}` as keyof typeof CLOUD_KEYS], w.score);
        setBest(data.best);
        setNewRecord(true);
      }
      setPhaseAll("over");
      sfx.over();
      if (rec && w.score > 0) {
        haptic("record");
        window.setTimeout(() => sfx.record(), 550);
      }
    },
    [setPhaseAll]
  );

  const doStep = useCallback(
    (w: World, now: number) => {
      const cfg = w.demo ? DIFFS.classic : DIFFS[diffRef.current];
      if (w.demo) aiSteer(w, cfg);
      if (w.queue.length) {
        const d = w.queue.shift()!;
        if (!(d.x === -w.dir.x && d.y === -w.dir.y) && !(d.x === w.dir.x && d.y === w.dir.y)) {
          w.dir = d;
        }
      }
      const head = w.snake[0];
      let nx = head.x + w.dir.x;
      let ny = head.y + w.dir.y;
      if (cfg.walls) {
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
          kill(w, now);
          return;
        }
      } else {
        nx = (nx + COLS) % COLS;
        ny = (ny + ROWS) % ROWS;
      }
      const eatingFood = nx === w.food.x && ny === w.food.y;
      const willGrow = w.grow > 0 || eatingFood;
      const body = willGrow ? w.snake : w.snake.slice(0, -1);
      if (body.some((s) => s.x === nx && s.y === ny)) {
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
        spawnBurst(w, nx + 0.5, ny + 0.5, ["#ff6a4d", "#ffc94a", "#a8e830"], 16, 2.4);
        addFloater(w, nx, ny - 0.4, `+${pts}`, "#ffc94a");
        w.food = randomFree([...w.snake, ...(w.bonus ? [w.bonus.pos] : [])]);
        w.foodSeed = Math.random() * 1000;
        w.stepMs = Math.max(cfg.minMs, w.stepMs - cfg.accel);
        if (w.eaten % 5 === 0 && !w.bonus) {
          w.bonus = { pos: randomFree([...w.snake, w.food]), born: now, ttl: 6500 };
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
        spawnBurst(w, nx + 0.5, ny + 0.5, ["#ffc94a", "#ffe9a8", "#ff9d2e"], 22, 3);
        addFloater(w, nx, ny - 0.4, `+${pts}`, "#ffe9a8");
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

      if ((ph === "playing" || ph === "menu") && !w.dying) {
        let guard = 0;
        while (now - w.lastStep >= w.stepMs && guard++ < 3) {
          doStep(w, now);
          if (w.dying) break;
        }
      }

      if (w.dying && !w.finalized) {
        if (w.demo) {
          if (now - w.diedAt > 600) worldRef.current = createWorld(true, 110);
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

      draw(ctx, w, now, diffRef.current, size, dpr, ph);
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
    const cfg = DIFFS[diffRef.current];
    const w = createWorld(false, cfg.baseMs);
    w.countdownEnd = performance.now() + 1500;
    worldRef.current = w;
    countdownRef.current = -1;
    setCountdown(3);
    setScore(0);
    setApples(0);
    setSnakeLen(3);
    setSpeed(1);
    setNewRecord(false);
    setPhaseAll("countdown");
    sfx.click();
    haptic("start");
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
    worldRef.current = createWorld(true, 110);
    setPhaseAll("menu");
    setScore(0);
    setNewRecord(false);
    sfx.click();
  }, [setPhaseAll]);

  const setDifficulty = useCallback((d: Difficulty) => {
    initSfx();
    diffRef.current = d;
    setDifficultyState(d);
    lsSet("snake.diff", d);
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
    if (ph === "playing") haptic("turn");
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

  /* ---------- Telegram Mini Apps ---------- */
  const tgMode = isTelegram();

  /* системная кнопка «Назад»: в игре — пауза, иначе — в меню */
  const onTgBack = useCallback(() => {
    const ph = phaseRef.current;
    if (ph === "playing") pause();
    else if (ph === "countdown" || ph === "paused" || ph === "over") toMenu();
  }, [pause, toMenu]);

  /* нативные кнопки клиента Telegram следуют за фазой игры */
  useEffect(() => {
    if (!tgMode) return;
    if (phase === "menu") tgMainButton("ИГРАТЬ", start);
    else if (phase === "paused") tgMainButton("ПРОДОЛЖИТЬ", resume);
    else if (phase === "over") tgMainButton("ЕЩЁ РАЗ", start);
    else tgMainButton(null);
    tgBackButton(phase !== "menu");
  }, [tgMode, phase, start, resume]);

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
      };
      const merged: Record<Difficulty, number> = {
        easy: Math.max(data.best.easy, cloudBest.easy),
        classic: Math.max(data.best.classic, cloudBest.classic),
        hard: Math.max(data.best.hard, cloudBest.hard),
      };
      const games = Math.max(data.stats.games, remote[CLOUD_KEYS.games] ?? 0);
      const applesTotal = Math.max(data.stats.apples, remote[CLOUD_KEYS.apples] ?? 0);
      if (merged.easy !== data.best.easy || merged.classic !== data.best.classic || merged.hard !== data.best.hard) {
        data.best = merged;
        lsSet("snake.best.easy", merged.easy);
        lsSet("snake.best.classic", merged.classic);
        lsSet("snake.best.hard", merged.hard);
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
    tgMode,
    onTgBack,
    phase,
    difficulty,
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
    start,
    pause,
    resume,
    togglePause,
    toMenu,
    setDifficulty,
    input,
    toggleMuted,
  };
}

export type SnakeGame = ReturnType<typeof useSnakeGame>;
