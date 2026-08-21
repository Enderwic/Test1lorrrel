import type { PointerEvent } from "react";
import type { SnakeGame } from "../game/useSnakeGame";
import { IconChevronUp, IconPause, IconPlay } from "./icons";

export function DPad({ game }: { game: SnakeGame }) {
  const press = (dx: number, dy: number) => (e: PointerEvent) => {
    e.preventDefault();
    game.input(dx, dy);
  };

  const center =
    game.phase === "playing" || game.phase === "countdown"
      ? { icon: <IconPause size={20} />, fn: game.pause, label: "Пауза" }
      : game.phase === "paused"
        ? { icon: <IconPlay size={20} />, fn: game.resume, label: "Продолжить" }
        : { icon: <IconPlay size={20} />, fn: game.start, label: "Старт" };

  return (
    <div
      className="grid w-48 grid-cols-3 gap-2 md:hidden"
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Сенсорное управление"
    >
      <span />
      <button type="button" className="dpad-btn flex h-14 items-center justify-center rounded-xl" onPointerDown={press(0, -1)} aria-label="Вверх">
        <IconChevronUp size={22} />
      </button>
      <span />
      <button type="button" className="dpad-btn flex h-14 items-center justify-center rounded-xl" onPointerDown={press(-1, 0)} aria-label="Влево">
        <IconChevronUp size={22} className="-rotate-90" />
      </button>
      <button
        type="button"
        className="dpad-btn flex h-14 items-center justify-center rounded-xl text-lime"
        onPointerDown={(e) => {
          e.preventDefault();
          center.fn();
        }}
        aria-label={center.label}
      >
        {center.icon}
      </button>
      <button type="button" className="dpad-btn flex h-14 items-center justify-center rounded-xl" onPointerDown={press(1, 0)} aria-label="Вправо">
        <IconChevronUp size={22} className="rotate-90" />
      </button>
      <span />
      <button type="button" className="dpad-btn flex h-14 items-center justify-center rounded-xl" onPointerDown={press(0, 1)} aria-label="Вниз">
        <IconChevronUp size={22} className="rotate-180" />
      </button>
      <span />
    </div>
  );
}
