import { DIFFS, DIFF_ORDER } from "../game/core";
import type { SnakeGame } from "../game/useSnakeGame";
import { IconApple, IconGamepad, IconTrophy } from "./icons";

/* ---------- список сложностей (меню + правая панель) ---------- */
export function DifficultyList({ game }: { game: SnakeGame }) {
  const locked =
    game.phase === "playing" || game.phase === "countdown" || game.phase === "paused";
  return (
    <div className="flex flex-col gap-1.5">
      {DIFF_ORDER.map((d, idx) => {
        const cfg = DIFFS[d];
        const active = game.difficulty === d;
        const barColor = ["bg-lime", "bg-gold", "bg-coral"][idx];
        return (
          <button
            key={d}
            type="button"
            onClick={() => !locked && game.setDifficulty(d)}
            className={`diff-row flex items-center gap-3 rounded-lg border px-3 py-2 text-left ${
              active
                ? "border-lime/60 bg-lime/10 shadow-[0_0_18px_rgba(168,232,48,0.16)]"
                : "border-mint/10 bg-mint/[0.03] hover:border-mint/25"
            } ${locked ? "diff-off" : ""}`}
          >
            <span
              className={`h-3 w-3 shrink-0 rounded-full border-2 transition-colors ${
                active ? "border-lime bg-lime shadow-[0_0_8px_rgba(168,232,48,0.8)]" : "border-fern/50"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-display text-[13px] font-bold text-mint">{cfg.label}</span>
                <span className="font-display text-[9px] font-bold uppercase tracking-wider text-gold">
                  {cfg.tag}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-fern">{cfg.desc}</span>
            </span>
            <span className="flex shrink-0 items-end gap-0.5">
              {[0, 1, 2].map((b) => (
                <span
                  key={b}
                  className={`w-1.5 rounded-sm ${b <= idx ? barColor : "bg-mint/10"}`}
                  style={{ height: 6 + b * 4 }}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function DifficultyPanel({ game }: { game: SnakeGame }) {
  return (
    <section className="panel p-4">
      <h3 className="panel-title mb-3 flex items-center gap-2">
        <IconGamepad size={14} className="text-teal" />
        Сложность
      </h3>
      <DifficultyList game={game} />
      <p className="mt-3 text-[11px] leading-relaxed text-fern">
        Смена сложности доступна в меню и после финиша — рекорды хранятся отдельно для каждого
        режима.
      </p>
    </section>
  );
}

/* ---------- рекорды ---------- */
export function RecordsPanel({ game }: { game: SnakeGame }) {
  return (
    <section className="panel p-4">
      <h3 className="panel-title mb-3 flex items-center gap-2">
        <IconTrophy size={14} className="text-gold" />
        Рекорды
      </h3>
      <ul className="flex flex-col gap-1.5">
        {DIFF_ORDER.map((d) => {
          const active = game.difficulty === d;
          const val = game.best[d];
          return (
            <li
              key={d}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                active ? "border-gold/40 bg-gold/[0.07]" : "border-mint/10 bg-mint/[0.03]"
              }`}
            >
              <span className="flex items-center gap-2 text-xs text-fern">
                <IconTrophy size={13} className={val > 0 ? "text-gold" : "text-fern/40"} />
                {DIFFS[d].label}
                {active && (
                  <span className="rounded bg-lime/15 px-1.5 py-0.5 font-display text-[8px] font-bold uppercase tracking-wider text-lime">
                    играем
                  </span>
                )}
              </span>
              <span
                className={`font-display text-base font-black ${val > 0 ? "text-gold" : "text-fern/40"}`}
              >
                {val}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-mint/10 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-fern">
          <IconGamepad size={14} className="text-teal" />
          Партий:{" "}
          <span className="font-display text-[13px] font-bold text-mint">{game.stats.games}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-fern">
          <IconApple size={14} className="text-coral" />
          Яблок:{" "}
          <span className="font-display text-[13px] font-bold text-mint">{game.stats.apples}</span>
        </div>
      </div>
      <p className="mt-2.5 text-[10px] text-fern/70">Сохраняются локально в вашем браузере.</p>
    </section>
  );
}

/* ---------- управление ---------- */
export function ControlsPanel() {
  return (
    <section className="panel p-4">
      <h3 className="panel-title mb-3">Управление</h3>
      <ul className="flex flex-col gap-3 text-xs text-fern">
        <li className="flex items-center justify-between gap-2">
          <span>Движение</span>
          <span className="flex items-center gap-1">
            <span className="kbd">W</span>
            <span className="kbd">A</span>
            <span className="kbd">S</span>
            <span className="kbd">D</span>
            <span className="mx-0.5 text-fern/50">/</span>
            <span className="kbd">←↑↓→</span>
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span>Пауза</span>
          <span className="flex items-center gap-1">
            <span className="kbd px-2">Space</span>
            <span className="kbd">P</span>
            <span className="kbd">Esc</span>
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span>Рестарт</span>
          <span className="kbd">R</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span>Старт</span>
          <span className="kbd px-2">Enter</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span>Звук</span>
          <span className="kbd">M</span>
        </li>
      </ul>
      <div className="mt-3 border-t border-mint/10 pt-3 text-[11px] leading-relaxed text-fern">
        На сенсорных экранах — свайпы прямо по полю или кнопки-стрелки под ним.
      </div>
    </section>
  );
}

/* ---------- карточка про бонус ---------- */
export function BonusCard() {
  return (
    <section className="panel relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,201,74,0.22), transparent 70%)" }}
      />
      <h3 className="panel-title mb-2 text-gold/90">Золотое яблоко</h3>
      <p className="text-[11px] leading-relaxed text-fern">
        Каждая <span className="font-display font-bold text-lime">5-я</span> добыча призывает
        золотой бонус — он даёт <span className="font-display font-bold text-gold">×5 очков</span>{" "}
        и +2 к длине, но тает через 6,5 секунд. Кольцо вокруг показывает оставшееся время.
      </p>
    </section>
  );
}
