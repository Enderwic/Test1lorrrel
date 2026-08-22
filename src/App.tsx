import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useSnakeGame } from "./game/useSnakeGame";
import { initSfx } from "./game/audio";
import { initStats } from "./game/stats";
import { tgInit, tgUser } from "./game/telegram";
import { GameCanvas } from "./components/GameCanvas";
import { FocusHud } from "./components/Overlays";
import {
  BonusCard,
  ControlsPanel,
  DifficultyPanel,
  InvitePanel,
  RecordsPanel,
  ThemePanel,
} from "./components/Panels";
import {
  IconHome,
  IconPause,
  IconPlay,
  IconSoundOff,
  IconSoundOn,
  IconTelegram,
  LogoSnake,
} from "./components/icons";

/* ---------- живой фон ---------- */
const FIREFLIES = [
  { left: "6%", size: 5, color: "#a8e830", dur: 17, delay: 0, fo: 0.5, fx: "34px" },
  { left: "14%", size: 3, color: "#3bd6b0", dur: 21, delay: 4, fo: 0.6, fx: "-22px" },
  { left: "24%", size: 4, color: "#ffc94a", dur: 19, delay: 9, fo: 0.4, fx: "26px" },
  { left: "33%", size: 3, color: "#a8e830", dur: 23, delay: 2, fo: 0.55, fx: "-30px" },
  { left: "45%", size: 5, color: "#3bd6b0", dur: 18, delay: 12, fo: 0.45, fx: "40px" },
  { left: "56%", size: 3, color: "#a8e830", dur: 22, delay: 6, fo: 0.6, fx: "-24px" },
  { left: "64%", size: 4, color: "#ffc94a", dur: 16, delay: 14, fo: 0.4, fx: "20px" },
  { left: "73%", size: 3, color: "#3bd6b0", dur: 24, delay: 1, fo: 0.5, fx: "-36px" },
  { left: "82%", size: 5, color: "#a8e830", dur: 20, delay: 8, fo: 0.5, fx: "28px" },
  { left: "90%", size: 3, color: "#ffc94a", dur: 18, delay: 11, fo: 0.45, fx: "-20px" },
];

function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 700px at 16% -12%, rgba(96,190,96,0.16), transparent 62%), radial-gradient(950px 680px at 106% 110%, rgba(48,196,164,0.13), transparent 62%), radial-gradient(720px 520px at 88% 8%, rgba(255,201,74,0.05), transparent 55%)",
        }}
      />
      <div className="bg-grid absolute inset-0" />
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={
            {
              left: f.left,
              width: f.size,
              height: f.size,
              background: f.color,
              boxShadow: `0 0 ${f.size * 2.6}px ${f.color}`,
              animationDuration: `${f.dur}s`,
              animationDelay: `${-f.delay}s`,
              "--fo": f.fo,
              "--fx": f.fx,
            } as CSSProperties
          }
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(4,12,8,0.5) 100%)",
        }}
      />
    </div>
  );
}

/* ---------- рама поля ---------- */
function BoardFrame({
  game,
  canvasRef,
}: {
  game: ReturnType<typeof useSnakeGame>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  return (
    <div className="relative w-full rounded-[16px] bg-gradient-to-br from-lime/45 via-teal/25 to-fern/10 p-[3px] shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
      <div className="relative overflow-hidden rounded-[13px] border border-abyss/70 bg-board">
        <GameCanvas game={game} canvasRef={canvasRef} />
        {game.phase === "menu" && (
          <div className="anim-blink pointer-events-none absolute right-2.5 top-2.5 z-30 rounded border border-coral/50 bg-coral/15 px-2 py-0.5 font-display text-[9px] font-bold tracking-[0.28em] text-coral">
            ДЕМО
          </div>
        )}
      </div>
      <span className="pointer-events-none absolute -left-1.5 -top-1.5 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-lime/70" />
      <span className="pointer-events-none absolute -right-1.5 -top-1.5 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-lime/70" />
      <span className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-teal/60" />
      <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-teal/60" />
    </div>
  );
}

/* ---------- приложение ---------- */
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useSnakeGame(canvasRef);
  const user = useMemo(() => tgUser(), []);

  /* Telegram Mini Apps + статистика: инициализация один раз */
  const backRef = useRef(game.onTgBack);
  backRef.current = game.onTgBack;
  useEffect(() => {
    tgInit({ onBack: () => backRef.current() });
    initStats();
  }, []);

  /* клавиатура (десктоп) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = e.code;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(c)) {
        e.preventDefault();
      }
      initSfx();
      switch (c) {
        case "ArrowUp":
        case "KeyW":
          game.input(0, -1);
          break;
        case "ArrowDown":
        case "KeyS":
          game.input(0, 1);
          break;
        case "ArrowLeft":
        case "KeyA":
          game.input(-1, 0);
          break;
        case "ArrowRight":
        case "KeyD":
          game.input(1, 0);
          break;
        case "Space":
          if (game.phase === "playing") game.pause();
          else if (game.phase === "paused") game.resume();
          else if (game.phase === "extraLife") game.continueRun();
          else if (game.phase === "menu" || game.phase === "over") game.start();
          break;
        case "Enter":
          if (game.phase === "menu" || game.phase === "over") game.start();
          else if (game.phase === "extraLife") game.continueRun();
          break;
        case "KeyP":
        case "Escape":
          if (game.phase === "extraLife") game.finishRun();
          else game.togglePause();
          break;
        case "KeyR":
          if (game.phase !== "menu") game.start();
          break;
        case "KeyM":
          game.toggleMuted();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  /* автопауза при потере фокуса */
  const pauseRef = useRef(game.pause);
  pauseRef.current = game.pause;
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) pauseRef.current();
    };
    const onBlur = () => pauseRef.current();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /* фокус-режим: во время игры — только поле и минимальный HUD */
  const focus = game.phase === "playing";

  if (focus) {
    return (
      <div className="app-pad relative flex min-h-[100dvh] flex-col items-center justify-center font-body text-mint">
        <div className="board-size flex w-full flex-col gap-2">
          <FocusHud game={game} />
          <BoardFrame game={game} canvasRef={canvasRef} />
          <p className="text-center text-[10px] text-fern/70">
            <span className="hidden md:inline">
              <span className="kbd px-2">Space</span> — пауза · стрелки / WASD — движение
            </span>
            <span className="md:hidden">свайп — поворот · тап — пауза</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-pad relative min-h-[100dvh] font-body text-mint">
      <Ambient />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col pt-1 pb-2">
        {/* шапка */}
        <header className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LogoSnake size={38} className="drop-shadow-[0_0_14px_rgba(168,232,48,0.45)] sm:h-[42px] sm:w-[42px]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-[clamp(17px,4.6vw,24px)] font-black leading-none tracking-tight">
                  ЗМЕ<span className="text-lime">Й</span>КА
                </span>
                {game.tgMode && (
                  <span className="hidden items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 font-display text-[8px] font-bold uppercase tracking-[0.14em] text-teal min-[380px]:flex">
                    <IconTelegram size={11} />
                    Mini App
                  </span>
                )}
              </div>
              <div className="mt-1 font-display text-[8px] font-bold uppercase tracking-[0.28em] text-teal sm:text-[9px]">
                {user ? `Привет, ${user.first_name}` : "неоновый сад · аркада"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="btn btn-icon"
              onClick={game.toggleMuted}
              title="Звук (M)"
              aria-label={game.muted ? "Включить звук" : "Выключить звук"}
            >
              {game.muted ? <IconSoundOff /> : <IconSoundOn />}
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={game.togglePause}
              disabled={!(game.phase === "playing" || game.phase === "paused")}
              title="Пауза (Space)"
              aria-label="Пауза"
            >
              {game.phase === "paused" ? <IconPlay /> : <IconPause />}
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={game.toMenu}
              disabled={game.phase === "menu"}
              title="В меню"
              aria-label="В меню"
            >
              <IconHome />
            </button>
          </div>
        </header>

        {/* основная сетка */}
        <main className="grid flex-1 items-start gap-4 lg:grid-cols-[264px_minmax(0,1fr)_280px] lg:gap-5">
          <aside className="order-2 hidden flex-col gap-4 lg:order-1 lg:flex">
            <ControlsPanel />
            <BonusCard />
          </aside>

          <section className="relative z-10 order-1 flex flex-col items-center gap-3 lg:order-2 lg:gap-4">
            <div className="board-size">
              <BoardFrame game={game} canvasRef={canvasRef} />
            </div>
            <p className="text-center text-[10px] text-fern/70 lg:hidden">
              свайп — поворот · тап по полю — пауза
            </p>
          </section>

          <aside className="order-3 flex flex-col gap-3 sm:gap-4 lg:order-3">
            <DifficultyPanel game={game} />
            <ThemePanel game={game} />
            <InvitePanel game={game} />
            <RecordsPanel game={game} />
          </aside>
        </main>

        {/* подсказки (только десктоп) */}
        <footer className="mt-5 hidden flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-1 text-[11px] text-fern md:flex">
          <span className="flex items-center gap-1.5">
            <span className="kbd px-2">Space</span> пауза
          </span>
          <span className="flex items-center gap-1.5">
            <span className="kbd">R</span> рестарт
          </span>
          <span className="flex items-center gap-1.5">
            <span className="kbd px-2">Enter</span> старт
          </span>
          <span className="flex items-center gap-1.5">
            <span className="kbd">M</span> звук
          </span>
        </footer>
      </div>
    </div>
  );
}
