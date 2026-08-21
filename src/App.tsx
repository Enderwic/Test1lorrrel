import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useSnakeGame, type SnakeGame } from "./game/useSnakeGame";
import { initSfx } from "./game/audio";
import { tgInit, tgUser } from "./game/telegram";
import { GameCanvas } from "./components/GameCanvas";
import { DPad } from "./components/DPad";
import { BonusCard, ControlsPanel, DifficultyPanel, RecordsPanel } from "./components/Panels";
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
  { left: "50%", size: 4, color: "#a8e830", dur: 26, delay: 15, fo: 0.35, fx: "18px" },
  { left: "38%", size: 3, color: "#3bd6b0", dur: 15, delay: 5, fo: 0.5, fx: "-16px" },
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
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(4,12,8,0.5) 100%)",
        }}
      />
    </div>
  );
}

/* ---------- табло ---------- */
function Hud({ game }: { game: SnakeGame }) {
  return (
    <div className="panel flex w-full items-stretch divide-x divide-mint/10 py-2">
      <div className="flex-1 px-3 text-center sm:px-4 sm:text-left">
        <div className="panel-title">Счёт</div>
        <div
          key={game.score}
          className="anim-pop font-display text-2xl font-black leading-tight text-lime"
        >
          {game.score}
        </div>
      </div>
      <div className="flex-1 px-3 text-center sm:px-4">
        <div className="panel-title">Рекорд</div>
        <div className="font-display text-2xl font-black leading-tight text-gold">
          {game.best[game.difficulty]}
        </div>
      </div>
      <div className="hidden flex-1 px-3 text-center sm:block sm:px-4">
        <div className="panel-title">Длина</div>
        <div className="font-display text-2xl font-black leading-tight text-mint">
          {game.snakeLen}
        </div>
      </div>
      <div className="flex-1 px-3 text-center sm:px-4">
        <div className="panel-title">Скорость</div>
        <div className="mt-2 flex items-end justify-center gap-[3px] sm:justify-start">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={`h-3 w-[5px] rounded-sm transition-colors duration-300 ${
                i < game.speed
                  ? i < 4
                    ? "bg-lime"
                    : i < 7
                      ? "bg-gold"
                      : "bg-coral"
                  : "bg-mint/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- рама поля ---------- */
function BoardFrame({
  game,
  canvasRef,
}: {
  game: SnakeGame;
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

  /* Telegram Mini Apps: ready/expand, цвет шапки, свайпы, вьюпорт, BackButton */
  const backRef = useRef(game.onTgBack);
  backRef.current = game.onTgBack;
  useEffect(() => {
    tgInit({ onBack: () => backRef.current() });
  }, []);

  /* клавиатура */
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
          else if (game.phase === "menu" || game.phase === "over") game.start();
          break;
        case "Enter":
          if (game.phase === "menu" || game.phase === "over") game.start();
          break;
        case "KeyP":
        case "Escape":
          game.togglePause();
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

  const inRun = game.phase === "playing" || game.phase === "countdown" || game.phase === "paused";

  return (
    <div className="relative min-h-full font-body text-mint">
      <Ambient />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-5 pt-4 sm:pt-6">
        {/* шапка */}
        <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
          <div className="flex items-center gap-3">
            <LogoSnake size={42} className="drop-shadow-[0_0_14px_rgba(168,232,48,0.45)]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-black leading-none tracking-tight sm:text-2xl">
                  ЗМЕ<span className="text-lime">Й</span>КА
                </span>
                {game.tgMode && (
                  <span className="flex items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 font-display text-[8px] font-bold uppercase tracking-[0.14em] text-teal">
                    <IconTelegram size={11} />
                    Mini App
                  </span>
                )}
              </div>
              <div className="mt-1 font-display text-[8px] font-bold uppercase tracking-[0.32em] text-teal sm:text-[9px]">
                {user ? `Привет, ${user.first_name} · неоновая аркада` : "неоновый сад · аркада"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        <main className="grid flex-1 items-start gap-5 lg:grid-cols-[272px_minmax(0,1fr)_280px]">
          <aside className="hidden flex-col gap-4 lg:flex">
            <ControlsPanel />
            <BonusCard />
          </aside>

          <section className="flex flex-col items-center gap-4">
            <div className="board-size">
              <Hud game={game} />
            </div>
            <div className="board-size">
              <BoardFrame game={game} canvasRef={canvasRef} />
            </div>
            <DPad game={game} />
          </section>

          <aside className="flex flex-col gap-4">
            <DifficultyPanel game={game} />
            <RecordsPanel game={game} />
            {!inRun && (
              <div className="panel p-4 lg:hidden">
                <h3 className="panel-title mb-2">Управление</h3>
                <p className="text-[11px] leading-relaxed text-fern">
                  Свайпы по полю или стрелки под ним. Пауза — кнопка в центре крестовины. На
                  клавиатуре: <span className="kbd">W</span> <span className="kbd">A</span>{" "}
                  <span className="kbd">S</span> <span className="kbd">D</span>,{" "}
                  <span className="kbd px-2">Space</span> — пауза.
                </p>
              </div>
            )}
          </aside>
        </main>

        {/* подсказки */}
        <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-fern">
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
