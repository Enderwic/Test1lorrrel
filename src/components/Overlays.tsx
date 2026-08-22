import { fmtTime } from "../game/core";
import type { SnakeGame } from "../game/useSnakeGame";
import { CustomControls, DifficultyList } from "./Panels";
import {
  IconFlag,
  IconHeart,
  IconHome,
  IconPlay,
  IconRestart,
  IconShare,
  IconTrophy,
  IconUsers,
} from "./icons";

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
      {game.phase === "extraLife" && <ExtraLifeOverlay game={game} />}
      {game.phase === "over" && <OverOverlay game={game} />}
    </>
  );
}

/* ---------- минимальный HUD фокус-режима (без кнопок) ---------- */
export function FocusHud({ game }: { game: SnakeGame }) {
  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-mint/10 bg-pine/80 px-3 py-1.5 backdrop-blur-sm">
      <HudCell label="Счёт" value={String(game.score)} color="text-lime" />
      <HudCell label="Рекорд" value={String(game.best[game.difficulty])} color="text-gold" />
      <HudCell label="Время" value={fmtTime(game.elapsedSec)} color="text-mint" />
      <div className="flex flex-col items-end">
        <span className="panel-title !text-[8px]">Жизни</span>
        <span className="mt-1 flex items-center gap-[3px]" aria-label={`Бонусных жизней: ${game.lives}`}>
          {[0, 1].map((i) => (
            <IconHeart
              key={i}
              size={11}
              filled={i < game.lives}
              className={i < game.lives ? "text-coral drop-shadow-[0_0_6px_rgba(255,106,77,0.8)]" : "text-mint/20"}
            />
          ))}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="panel-title !text-[8px]">Скорость</span>
        <span className="mt-1 flex items-end gap-[2px]">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className={`w-[4px] rounded-sm transition-colors duration-300 ${
                i < Math.ceil(game.speed * 0.8)
                  ? i < 3
                    ? "bg-lime"
                    : i < 6
                      ? "bg-gold"
                      : "bg-coral"
                  : "bg-mint/10"
              }`}
              style={{ height: 6 + i * 1.4 }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function HudCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="min-w-0">
      <div className="panel-title !text-[8px]">{label}</div>
      <div className={`font-display text-lg font-black leading-tight sm:text-xl ${color}`}>{value}</div>
    </div>
  );
}

function MenuOverlay({ game }: { game: SnakeGame }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-abyss/80 p-3 backdrop-blur-[3px] sm:gap-4 sm:p-4">
      <div className="anim-rise text-center">
        <div className="mb-1 font-display text-[8px] font-bold uppercase tracking-[0.3em] text-teal">
          неоновая аркада
        </div>
        <div className="font-display text-[clamp(22px,7vw,30px)] font-black leading-none text-mint">
          ЗМЕ<span className="text-lime">Й</span>КА
        </div>
      </div>

      <div className="anim-rise-1 w-full max-w-[330px]">
        <DifficultyList game={game} />
        {game.difficulty === "custom" && (
          <div className="mt-2">
            <CustomControls game={game} />
          </div>
        )}
      </div>

      <div className="anim-rise-2 flex w-full max-w-[330px] flex-col gap-2">
        <button className="btn btn-primary anim-pulseglow px-9 py-2.5 text-sm" onClick={game.start}>
          <IconPlay size={16} />
          Играть
        </button>
        <button className="btn btn-ghost px-6 py-2 text-[11px]" onClick={game.inviteFriend}>
          <IconUsers size={14} />
          Пригласить друга · +1 жизнь
        </button>
      </div>

      <div className="anim-rise-2 pb-1 text-center text-[10px] leading-relaxed text-fern">
        <span className="kbd">Enter</span> старт · свайпы или <span className="kbd">WASD</span> —
        движение
        {game.bonusLives > 0 && (
          <span className="mt-1 flex items-center justify-center gap-1 text-coral">
            <IconHeart size={11} filled /> бонусные жизни от друзей: +{game.bonusLives}
          </span>
        )}
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
        <span className="kbd">Space</span> — продолжить · тап по полю на сенсорных
      </div>
    </div>
  );
}

function ExtraLifeOverlay({ game }: { game: SnakeGame }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-abyss/88 p-4 backdrop-blur-[3px]">
      <div className="anim-rise relative">
        <span className="anim-breathe absolute -inset-4 rounded-full bg-coral/20 blur-xl" />
        <IconHeart size={44} filled className="anim-wiggle relative text-coral drop-shadow-[0_0_18px_rgba(255,106,77,0.7)]" />
      </div>
      <div className="anim-rise font-display text-xl font-black uppercase tracking-[0.14em] text-mint">
        Продолжить?
      </div>
      <div className="anim-rise-1 text-center text-xs text-fern">
        Осталось жизней:{" "}
        <span className="font-display text-base font-black text-coral">{game.lives}</span>
        <div className="mt-1 text-[10px] text-fern/80">После продолжения — 1 секунда неуязвимости</div>
      </div>
      <div className="anim-rise-2 mt-1 flex w-full max-w-[250px] flex-col gap-2">
        <button className="btn btn-primary px-6 py-2.5 text-xs" onClick={game.continueRun}>
          <IconPlay size={14} />
          Продолжить
        </button>
        <button className="btn btn-ghost px-6 py-2.5 text-xs" onClick={game.finishRun}>
          <IconFlag size={14} />
          Завершить
        </button>
      </div>
      <div className="anim-rise-2 text-[10px] text-fern">
        <span className="kbd px-2">Space</span> — продолжить · <span className="kbd">Esc</span> —
        завершить
      </div>
    </div>
  );
}

function OverOverlay({ game }: { game: SnakeGame }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 overflow-y-auto bg-abyss/85 p-3 backdrop-blur-[3px] sm:gap-3 sm:p-4">
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

      <div className="anim-rise-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-fern">
        <span>
          Рекорд <span className="font-display text-[13px] font-bold text-gold">{game.best[game.difficulty]}</span>
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

      <div className="anim-rise-2 mt-1 flex w-full max-w-[300px] flex-col gap-2">
        <button className="btn btn-primary px-6 py-2.5 text-xs" onClick={game.shareResult}>
          <IconShare size={14} />
          Поделиться результатом
        </button>
        <div className="flex gap-2">
          <button className="btn btn-ghost flex-1 px-4 py-2.5 text-xs" onClick={game.start}>
            <IconRestart size={14} />
            Играть снова
          </button>
          <button className="btn btn-ghost px-4 py-2.5 text-xs" onClick={game.toMenu}>
            <IconHome size={14} />В меню
          </button>
        </div>
        <button className="btn px-4 py-1.5 text-[10px] text-teal/90 hover:text-teal" onClick={game.inviteFriend}>
          <IconUsers size={13} />
          Пригласить друга · +1 жизнь
        </button>
      </div>

      <div className="anim-rise-2 pb-1 text-[10px] text-fern">
        <span className="kbd">Enter</span> — реванш
        <span className="mx-1.5 text-fern/40">·</span>
        <span className="kbd">R</span> — рестарт
      </div>
    </div>
  );
}
