import { useRef, type TouchEvent } from "react";
import type { SnakeGame } from "../game/useSnakeGame";
import { GameOverlay } from "./Overlays";

interface Props {
  game: SnakeGame;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function GameCanvas({ game, canvasRef }: Props) {
  const origin = useRef<{ x: number; y: number; t: number; moved: boolean } | null>(null);
  const lastTouchAt = useRef(0);

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    origin.current = { x: t.clientX, y: t.clientY, t: Date.now(), moved: false };
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!origin.current) return;
    const t = e.touches[0];
    const dx = t.clientX - origin.current.x;
    const dy = t.clientY - origin.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    origin.current.moved = true;
    if (Math.abs(dx) > Math.abs(dy)) game.input(dx > 0 ? 1 : -1, 0);
    else game.input(0, dy > 0 ? 1 : -1);
    origin.current = { x: t.clientX, y: t.clientY, t: origin.current.t, moved: true };
  };

  /* короткий тап без движения = пауза (кнопок на сенсорных нет) */
  const onTouchEnd = () => {
    const o = origin.current;
    origin.current = null;
    if (!o) return;
    lastTouchAt.current = Date.now();
    const quick = Date.now() - o.t < 280;
    if (!o.moved && quick && (game.phase === "playing" || game.phase === "paused")) {
      game.togglePause();
    }
  };

  /* на десктопе клик по полю во время партии тоже ставит паузу;
     «призрачные» клики сразу после касания игнорируем */
  const onClick = () => {
    if (Date.now() - lastTouchAt.current < 600) return;
    if (game.phase === "playing") game.pause();
  };

  return (
    <div
      className="relative aspect-square w-full touch-none select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <GameOverlay game={game} />
    </div>
  );
}
