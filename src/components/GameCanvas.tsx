import { useRef, type TouchEvent } from "react";
import type { SnakeGame } from "../game/useSnakeGame";
import { GameOverlay } from "./Overlays";

interface Props {
  game: SnakeGame;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function GameCanvas({ game, canvasRef }: Props) {
  const origin = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    origin.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!origin.current) return;
    const t = e.touches[0];
    const dx = t.clientX - origin.current.x;
    const dy = t.clientY - origin.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
    if (Math.abs(dx) > Math.abs(dy)) game.input(dx > 0 ? 1 : -1, 0);
    else game.input(0, dy > 0 ? 1 : -1);
    origin.current = { x: t.clientX, y: t.clientY };
  };

  return (
    <div
      className="relative aspect-square w-full touch-none select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => (origin.current = null)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <GameOverlay game={game} />
    </div>
  );
}
