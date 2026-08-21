import type { SnakeGame } from "../game/useSnakeGame";
import { DifficultyList } from "./Panels";
import { IconHome, IconPlay, IconRestart, IconTrophy } from "./icons";

export function GameOverlay({ game }: { game: SnakeGame }) {
  return (
    <>
      {game.phase === "menu" && <MenuOverlay game={game} />}
      {game.phase === "countdown" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          {game.countdown > 0 && (
            <span
              key={game.countdown}
              className="anim-count font-display text-7xl font-black text-lime drop-shadow-[0_0_32px_rgba(168,232,48,0.75)] sm:text-8xl"
            >
              {game.countdown}
            </span>
          )}
        </div>
      )}
      {game.flash && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="anim-flash font-display text-3xl font-black tracking-[0.14em] text-lime drop-shadow-[0_0_26px_rgba(168,232,48,0.85)] sm:text-4xl">
            СТАРТ!
          </span>
        </div>
      )}
      {game.phase === "paused" && <PauseOverlay game={game} />}
      {game.phase === "over" && <OverOverlay game={game} />}
    </>
  );
}

function MenuOverlay({ game }: { game: SnakeGame }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-abyss/80 p-4 backdrop-blur-[3px] sm:gap-4">
      <div className="anim-rise text-center">
        <div className="mb-1.5 font-display text-[9px] font-bold uppercase tracking-[0.34em] text-teal">
          неоновая аркада
        </div>
        <div className="font-display text-3xl font-black leading-none text-mint sm:text-4xl">
          ЗМЕ<span className="text-lime">Й</span>КА
        </div>
      </div>

      <div className="anim-rise-1 w-full max-w-[320px]">
        <DifficultyList game={game} />
      </div>

      <button className="btn btn-primary anim-rise-2 anim-pulseglow px-9 py-3 text-sm" onClick={game.start}>
        <IconPlay size={16} />
        Играть
      </button>

      <div className="anim-rise-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-fern">
        <span className="kbd">Enter</span> старт
        <span className="text-fern/50">·</span>
        свайпы или стрелки — движение
      </div>
    </div>
  );
}

function PauseOverlay({ game }: { game: SnakeGame }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-abyss/90 p-4 backdrop-blur-[4px]">
      <div className="anim-rise font-display text-2xl font-black uppercase tracking-[0.2em] text-mint">
        Пауза
      </div>
      <div className="anim-rise text-xs text-fern">Змейка замерла и ждёт команды…</div>
      <div className="anim-rise-1 mt-1 flex w-full max-w-[240px] flex-col gap-2">
        <button className="btn btn-primary px-6 py-2.5 text-xs" onClick={game.resume}>
          <IconPlay size={14} />
          Продолжить
        </button>
        <button className="btn btn-ghost px-6 py-2.5 text-xs" onClick={game.start}>
          <IconRestart size={14} />
          Сначала
        </button>
        <button className="btn btn-ghost px-6 py-2.5 text-xs" onClick={game.toMenu}>
          <IconHome size={14} />В меню
        </button>
      </div>
      <div className="anim-rise-2 text-[11px] text-fern">
        <span className="kbd">Space</span> — продолжить
      </div>
    </div>
  );
}

function OverOverlay({ game }: { game: SnakeGame }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 overflow-y-auto bg-abyss/85 p-4 backdrop-blur-[3px] sm:gap-3">
      {game.newRecord ? (
        <div className="anim-rise relative">
          <div
            className="anim-rayspin absolute -inset-5 rounded-full"
            style={{
              background:
                "repeating-conic-gradient(rgba(255,201,74,0.2) 0deg 14deg, transparent 14deg 30deg)",
            }}
          />
          <div className="anim-wiggle relative flex items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
            <IconTrophy size={14} />
            Новый рекорд
          </div>
        </div>
      ) : (
        <div className="anim-rise font-display text-[10px] font-bold uppercase tracking-[0.3em] text-coral">
          Игра окончена
        </div>
      )}

      <div className="anim-rise text-center">
        <div className="font-display text-[10px] uppercase tracking-[0.24em] text-fern">Счёт</div>
        <div key={game.score} className="anim-pop font-display text-5xl font-black leading-tight text-mint sm:text-6xl">
          {game.score}
        </div>
      </div>

      <div className="anim-rise-1 flex items-center gap-4 text-[11px] text-fern">
        <span>
          Рекорд{" "}
          <span className="font-display text-[13px] font-bold text-gold">{game.best[game.difficulty]}</span>
        </span>
        <span className="text-fern/40">·</span>
        <span>
          Яблок <span className="font-display text-[13px] font-bold text-lime">{game.apples}</span>
        </span>
        <span className="text-fern/40">·</span>
        <span>
          Длина <span className="font-display text-[13px] font-bold text-mint">{game.snakeLen}</span>
        </span>
      </div>

      <div className="anim-rise-2 mt-1 flex gap-2">
        <button className="btn btn-primary px-6 py-2.5 text-xs" onClick={game.start}>
          <IconRestart size={14} />
          Ещё раз
        </button>
        <button className="btn btn-ghost px-5 py-2.5 text-xs" onClick={game.toMenu}>
          <IconHome size={14} />В меню
        </button>
      </div>

      <div className="anim-rise-2 text-[11px] text-fern">
        <span className="kbd">Enter</span> — реванш
        <span className="mx-1.5 text-fern/40">·</span>
        <span className="kbd">R</span> — рестарт
      </div>
    </div>
  );
}
