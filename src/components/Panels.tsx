import { DIFF_ORDER, GRID_OPTIONS, SPEED_MAX, SPEED_MIN, resolveCfg, DEFAULT_CUSTOM, type ThemeId } from "../game/core";
import { THEMES, THEME_ORDER } from "../game/themes";
import type { SnakeGame } from "../game/useSnakeGame";
import {
  IconApple,
  IconCloud,
  IconGamepad,
  IconHeart,
  IconSliders,
  IconTrophy,
  IconUsers,
  IconZap,
} from "./icons";

/* ---------- список сложностей + настройки своего режима ---------- */
export function DifficultyList({ game }: { game: SnakeGame }) {
  const locked =
    game.phase === "playing" || game.phase === "countdown" || game.phase === "paused";
  const barColor: Record<string, string> = {
    easy: "bg-lime",
    classic: "bg-gold",
    hard: "bg-coral",
    custom: "bg-teal",
  };
  return (
    <div className="flex flex-col gap-1.5">
      {DIFF_ORDER.map((d, idx) => {
        const cfg = resolveCfg(d, game.custom);
        const active = game.difficulty === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => !locked && game.setDifficulty(d)}
            className={`diff-row flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left ${
              active
                ? "border-lime/60 bg-lime/10 shadow-[0_0_18px_rgba(168,232,48,0.16)]"
                : "border-mint/10 bg-mint/[0.03] hover:border-mint/25"
            } ${locked ? "diff-off" : ""}`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors ${
                active ? "border-lime bg-lime shadow-[0_0_8px_rgba(168,232,48,0.8)]" : "border-fern/50"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-display text-xs font-bold text-mint sm:text-[13px]">
                  {cfg.label}
                </span>
                <span className="font-display text-[9px] font-bold uppercase tracking-wider text-gold">
                  {cfg.tag}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-fern sm:text-[11px]">
                {cfg.desc}
              </span>
            </span>
            {d === "custom" ? (
              <IconSliders size={15} className={active ? "text-teal" : "text-fern/50"} />
            ) : (
              <span className="flex shrink-0 items-end gap-0.5">
                {[0, 1, 2].map((b) => (
                  <span
                    key={b}
                    className={`w-1.5 rounded-sm ${b <= idx ? barColor[d] : "bg-mint/10"}`}
                    style={{ height: 6 + b * 4 }}
                  />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CustomControls({ game }: { game: SnakeGame }) {
  const c = game.custom;
  const speed = 1000 / c.baseMs;
  return (
    <div className="anim-rise flex flex-col gap-3 rounded-lg border border-teal/30 bg-teal/[0.06] p-3">
      <label className="block">
        <span className="mb-1 flex items-center justify-between text-[11px] text-fern">
          <span className="flex items-center gap-1.5">
            <IconZap size={12} className="text-teal" /> Базовая скорость
          </span>
          <span className="font-display font-bold text-teal">{speed.toFixed(1)} шаг/с</span>
        </span>
        <input
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={0.5}
          value={Math.round(speed * 10) / 10}
          onChange={(e) => game.setCustom({ baseMs: Math.round(1000 / Number(e.target.value)) })}
          className="slider w-full"
          aria-label="Базовая скорость"
        />
      </label>

      <button
        type="button"
        onClick={() => game.setCustom({ accel: !c.accel })}
        className="flex items-center justify-between gap-2 text-[11px] text-fern"
      >
        <span className="flex items-center gap-1.5">
          <IconZap size={12} className={c.accel ? "text-lime" : "text-fern/50"} />
          Ускорение за каждое яблоко
        </span>
        <span
          className={`switch ${c.accel ? "switch-on" : ""}`}
          role="switch"
          aria-checked={c.accel}
        >
          <span className="switch-dot" />
        </span>
      </button>

      <div>
        <div className="mb-1 text-[11px] text-fern">Размер поля</div>
        <div className="grid grid-cols-3 gap-1.5">
          {GRID_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => game.setCustom({ grid: g })}
              className={`rounded-lg border px-2 py-1.5 font-display text-[11px] font-bold transition-all ${
                c.grid === g
                  ? "border-teal/70 bg-teal/15 text-teal shadow-[0_0_12px_rgba(59,214,176,0.25)]"
                  : "border-mint/10 bg-mint/[0.03] text-fern hover:border-mint/30"
              }`}
            >
              {g}×{g}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-fern/70">
        Настройки сохраняются автоматически и попадают в статистику как режим «custom».
      </p>
    </div>
  );
}

export function DifficultyPanel({ game }: { game: SnakeGame }) {
  return (
    <section className="panel p-3.5 sm:p-4">
      <h3 className="panel-title mb-3 flex items-center gap-2">
        <IconGamepad size={14} className="text-teal" />
        Сложность
      </h3>
      <DifficultyList game={game} />
      {game.difficulty === "custom" && (
        <div className="mt-2">
          <CustomControls game={game} />
        </div>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-fern sm:text-[11px]">
        Рекорды хранятся отдельно для каждого режима — включая свой.
      </p>
    </section>
  );
}

/* ---------- темы оформления ---------- */
export function ThemePanel({ game }: { game: SnakeGame }) {
  const locked =
    game.phase === "playing" || game.phase === "countdown" || game.phase === "paused";
  return (
    <section className="panel p-3.5 sm:p-4">
      <h3 className="panel-title mb-3 flex items-center gap-2">
        <IconSliders size={14} className="text-lime" />
        Тема поля
      </h3>
      <div className="grid grid-cols-3 gap-1.5">
        {THEME_ORDER.map((t: ThemeId) => {
          const th = THEMES[t];
          const active = game.theme === t;
          return (
            <button
              key={t}
              type="button"
              disabled={locked}
              onClick={() => game.setTheme(t)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all ${
                active
                  ? "border-lime/60 bg-lime/10 shadow-[0_0_16px_rgba(168,232,48,0.18)]"
                  : "border-mint/10 bg-mint/[0.03] hover:border-mint/30"
              } ${locked ? "opacity-45" : ""}`}
            >
              <span
                className="h-9 w-full rounded-md border border-abyss/40"
                style={{
                  background: `linear-gradient(135deg, ${th.bg1} 0%, ${th.bg2} 55%), linear-gradient(${th.bg2}, ${th.bg2})`,
                }}
              >
                <span className="flex h-full items-center justify-center gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: `rgb(${th.head.join(",")})`,
                      boxShadow: `0 0 6px rgb(${th.head.join(",")})`,
                    }}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: th.foodStyle === "busstop" ? "#3f8cff" : "#f4483a" }}
                  />
                </span>
              </span>
              <span className={`font-display text-[10px] font-bold ${active ? "text-lime" : "text-fern"}`}>
                {th.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-[10px] leading-relaxed text-fern sm:text-[11px]">
        {THEMES[game.theme].note}
      </p>
    </section>
  );
}

/* ---------- рекорды ---------- */
export function RecordsPanel({ game }: { game: SnakeGame }) {
  return (
    <section className="panel p-3.5 sm:p-4">
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
              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 transition-colors ${
                active ? "border-gold/40 bg-gold/[0.07]" : "border-mint/10 bg-mint/[0.03]"
              }`}
            >
              <span className="flex items-center gap-2 text-[11px] text-fern">
                <IconTrophy size={12} className={val > 0 ? "text-gold" : "text-fern/40"} />
                {resolveCfg(d, DEFAULT_CUSTOM).label}
                {active && (
                  <span className="rounded bg-lime/15 px-1.5 py-0.5 font-display text-[8px] font-bold uppercase tracking-wider text-lime">
                    играем
                  </span>
                )}
              </span>
              <span className={`font-display text-sm font-black ${val > 0 ? "text-gold" : "text-fern/40"}`}>
                {val}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-mint/10 pt-3">
        <div className="flex items-center gap-2 text-[11px] text-fern">
          <IconGamepad size={14} className="text-teal" />
          Партий: <span className="font-display text-[13px] font-bold text-mint">{game.stats.games}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-fern">
          <IconApple size={14} className="text-coral" />
          Яблок: <span className="font-display text-[13px] font-bold text-mint">{game.stats.apples}</span>
        </div>
      </div>
      {game.tgMode ? (
        <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-fern/80">
          <IconCloud size={13} className="mt-px shrink-0 text-teal" />
          <span>Синхронизация с Telegram Cloud — рекорды доступны на всех устройствах.</span>
        </p>
      ) : (
        <p className="mt-2.5 text-[10px] text-fern/70">Сохраняются локально в вашем браузере.</p>
      )}
    </section>
  );
}

/* ---------- приглашения / рефералы ---------- */
export function InvitePanel({ game }: { game: SnakeGame }) {
  return (
    <section className="panel relative overflow-hidden p-3.5 sm:p-4">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,106,77,0.16), transparent 70%)" }}
      />
      <h3 className="panel-title mb-2 flex items-center gap-2 text-coral/90">
        <IconUsers size={14} />
        Пригласить друга
      </h3>
      <p className="text-[10px] leading-relaxed text-fern sm:text-[11px]">
        Друг, пришедший по вашей ссылке и сыгравший первую партию, дарит вам{" "}
        <span className="font-bold text-coral">+1 запасную жизнь</span>. Максимум +2.
      </p>
      <button className="btn btn-ghost mt-2.5 w-full px-4 py-2 text-[11px]" onClick={game.inviteFriend}>
        <IconUsers size={14} />
        Отправить приглашение
      </button>
      <div className="mt-2.5 flex items-center justify-between border-t border-mint/10 pt-2.5 text-[10px] text-fern">
        <span>Активировано: {game.refCount}</span>
        <span className="flex items-center gap-1">
          <IconHeart size={11} filled className={game.bonusLives > 0 ? "text-coral" : "text-fern/40"} />
          +{game.bonusLives} к жизням
        </span>
      </div>
    </section>
  );
}

/* ---------- управление ---------- */
export function ControlsPanel() {
  return (
    <section className="panel p-3.5 sm:p-4">
      <h3 className="panel-title mb-3">Управление</h3>
      <ul className="flex flex-col gap-2.5 text-[11px] text-fern">
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
      <div className="mt-3 border-t border-mint/10 pt-3 text-[10px] leading-relaxed text-fern sm:text-[11px]">
        На сенсорных экранах — свайпы по полю, тап ставит игру на паузу. Кнопок нет — только
        жесты, чтобы ничто не отвлекало.
      </div>
    </section>
  );
}

/* ---------- карточка про бонус ---------- */
export function BonusCard() {
  return (
    <section className="panel relative overflow-hidden p-3.5 sm:p-4">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,201,74,0.22), transparent 70%)" }}
      />
      <h3 className="panel-title mb-2 text-gold/90">Золотое яблоко</h3>
      <p className="text-[10px] leading-relaxed text-fern sm:text-[11px]">
        Каждая <span className="font-display font-bold text-lime">5-я</span> добыча призывает
        золотой бонус — <span className="font-display font-bold text-gold">×5 очков</span> и +2 к
        длине, но тает через 6,5 секунд. Кольцо показывает оставшееся время.
      </p>
    </section>
  );
}
