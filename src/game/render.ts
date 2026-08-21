import {
  COLS,
  ROWS,
  DIFFS,
  type World,
  type Difficulty,
  type Phase,
  type Pt,
} from "./core";

type RGB = [number, number, number];

const HEAD_C: RGB = [198, 246, 92];
const MID_C: RGB = [124, 206, 60];
const TAIL_C: RGB = [36, 118, 70];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mix(a: RGB, b: RGB, t: number): string {
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(
    lerp(a[1], b[1], t)
  )},${Math.round(lerp(a[2], b[2], t))})`;
}

function segColor(f: number): string {
  return f < 0.35 ? mix(HEAD_C, MID_C, f / 0.35) : mix(MID_C, TAIL_C, (f - 0.35) / 0.65);
}

function wrapAdjust(p: Pt, s: Pt): Pt {
  let px = p.x;
  let py = p.y;
  if (px - s.x > COLS / 2) px -= COLS;
  if (s.x - px > COLS / 2) px += COLS;
  if (py - s.y > ROWS / 2) py -= ROWS;
  if (s.y - py > ROWS / 2) py += ROWS;
  return { x: px, y: py };
}

export function draw(
  ctx: CanvasRenderingContext2D,
  w: World,
  now: number,
  diff: Difficulty,
  cssSize: number,
  dpr: number,
  phase: Phase
) {
  const cfg = w.demo ? DIFFS.classic : DIFFS[diff];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssSize, cssSize);

  const cell = cssSize / COLS;

  if (w.shake > 0.01) {
    const s = w.shake * cell * 0.4;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  /* ---- фон поля ---- */
  const bg = ctx.createLinearGradient(0, 0, cssSize, cssSize);
  bg.addColorStop(0, "#0e2419");
  bg.addColorStop(1, "#081a11");
  ctx.fillStyle = bg;
  ctx.fillRect(-cell, -cell, cssSize + cell * 2, cssSize + cell * 2);

  ctx.fillStyle = "rgba(190,255,210,0.017)";
  for (let y = 0; y < ROWS; y++) {
    for (let x = y % 2; x < COLS; x += 2) {
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  ctx.strokeStyle = "rgba(140,230,170,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < COLS; i++) {
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, cssSize);
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.moveTo(0, i * cell);
    ctx.lineTo(cssSize, i * cell);
  }
  ctx.stroke();

  /* ---- рамка: стены или «бегущий пунктир» сквозных краёв ---- */
  ctx.save();
  ctx.lineWidth = 2;
  if (cfg.walls) {
    ctx.strokeStyle = "rgba(168,232,48,0.38)";
    ctx.shadowColor = "rgba(168,232,48,0.5)";
    ctx.shadowBlur = 9;
    ctx.strokeRect(1, 1, cssSize - 2, cssSize - 2);
  } else {
    ctx.strokeStyle = "rgba(59,214,176,0.5)";
    ctx.setLineDash([cell * 0.55, cell * 0.45]);
    ctx.lineDashOffset = -now / 40;
    ctx.strokeRect(1, 1, cssSize - 2, cssSize - 2);
  }
  ctx.restore();

  /* ---- интерполированные позиции змейки ---- */
  let t = phase === "playing" || phase === "menu" ? (now - w.lastStep) / w.stepMs : 1;
  if (w.dying) t = 1;
  t = Math.max(0, Math.min(1, t));

  const pts = w.snake.map((s, i) => {
    const raw = w.prev[i] ?? s;
    const p = wrapAdjust(raw, s);
    return {
      x: (lerp(p.x, s.x, t) + 0.5) * cell,
      y: (lerp(p.y, s.y, t) + 0.5) * cell,
    };
  });

  /* ---- яблоко ---- */
  {
    const fx = (w.food.x + 0.5) * cell;
    const fy = (w.food.y + 0.5) * cell;
    const pulse = 1 + 0.07 * Math.sin(now / 260 + w.foodSeed);
    const r = cell * 0.32 * pulse;

    const ring = ((now / 1400 + w.foodSeed) % 1);
    ctx.save();
    ctx.globalAlpha = (1 - ring) * 0.22;
    ctx.strokeStyle = "#ff6a4d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fx, fy, r + ring * cell * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(255,90,64,0.55)";
    ctx.shadowBlur = cell * 0.55;
    const g = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.15, fx, fy, r * 1.15);
    g.addColorStop(0, "#ff8f6e");
    g.addColorStop(0.55, "#f4483a");
    g.addColorStop(1, "#c22320");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(fx - r * 0.32, fy - r * 0.38, r * 0.24, r * 0.15, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#7a4a22";
    ctx.lineWidth = Math.max(1.5, cell * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fx, fy - r * 0.9);
    ctx.quadraticCurveTo(fx + r * 0.15, fy - r * 1.25, fx + r * 0.32, fy - r * 1.32);
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = "#6fd44f";
    ctx.translate(fx + r * 0.5, fy - r * 1.12);
    ctx.rotate(0.5 + 0.12 * Math.sin(now / 300 + w.foodSeed));
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ---- бонусная звезда ---- */
  if (w.bonus) {
    const bx = (w.bonus.pos.x + 0.5) * cell;
    const by = (w.bonus.pos.y + 0.5) * cell;
    const remain = Math.max(0, 1 - (now - w.bonus.born) / w.bonus.ttl);
    const blink = remain < 0.25 ? 0.55 + 0.45 * Math.sin(now / 60) : 1;
    const r = cell * 0.34 * (1 + 0.08 * Math.sin(now / 180));

    ctx.save();
    ctx.globalAlpha = blink;
    ctx.shadowColor = "rgba(255,201,74,0.7)";
    ctx.shadowBlur = cell * 0.6;
    const g = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.35, r * 0.1, bx, by, r * 1.2);
    g.addColorStop(0, "#ffe9a8");
    g.addColorStop(0.55, "#ffc94a");
    g.addColorStop(1, "#e08b1a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.9 * blink;
    ctx.strokeStyle = "#ffc94a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, cell * 0.55, -Math.PI / 2, -Math.PI / 2 + remain * Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      const a = now / 300 + (i * Math.PI) / 2;
      ctx.save();
      ctx.globalAlpha = 0.8 * blink;
      ctx.fillStyle = "#ffe9a8";
      ctx.beginPath();
      ctx.arc(bx + Math.cos(a) * cell * 0.62, by + Math.sin(a) * cell * 0.62, cell * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---- змейка ---- */
  if (pts.length > 0) {
    ctx.save();
    if (w.dying) ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(now / 90));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // мягкое свечение
    if (pts.length > 1) {
      ctx.save();
      ctx.globalAlpha = w.dying ? 0.07 : 0.15;
      ctx.strokeStyle = "#a8e830";
      ctx.lineWidth = cell * 1.45;
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      for (let i = pts.length - 2; i >= 0; i--) {
        const a = pts[i + 1];
        const b = pts[i];
        // не рисуем «прострел» сквозь поле при сквозном проходе края
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > cell * 1.6) ctx.moveTo(b.x, b.y);
        else ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    const n = Math.max(1, pts.length - 1);
    // тёмная подложка-контур
    for (let i = n; i >= 1; i--) {
      const a = pts[i];
      const b = pts[i - 1];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > cell * 1.6) continue;
      const f = i / n;
      ctx.strokeStyle = "#0d3520";
      ctx.lineWidth = lerp(cell * 0.62, cell * 0.94, 1 - f);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // цветное тело с плавным сужением
    for (let i = n; i >= 1; i--) {
      const a = pts[i];
      const b = pts[i - 1];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > cell * 1.6) continue;
      const f = i / n;
      ctx.strokeStyle = w.dying ? mix([255, 106, 77], [120, 90, 60], f) : segColor(f);
      ctx.lineWidth = lerp(cell * 0.5, cell * 0.8, 1 - f);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // чешуйки-блики
    for (let i = n - 1; i >= 2; i -= 2) {
      const p = pts[i];
      const f = i / n;
      ctx.fillStyle = "rgba(240,255,210,0.14)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, lerp(cell * 0.07, cell * 0.13, 1 - f), 0, Math.PI * 2);
      ctx.fill();
    }

    // голова
    const h = pts[0];
    const d = w.dir;
    const hr = cell * 0.47;
    const hg = ctx.createRadialGradient(h.x - d.x * hr * 0.4, h.y - d.y * hr * 0.4, hr * 0.1, h.x, h.y, hr * 1.2);
    if (w.dying) {
      hg.addColorStop(0, "#ffb08a");
      hg.addColorStop(1, "#a34430");
    } else {
      hg.addColorStop(0, "#d8fb7e");
      hg.addColorStop(1, "#7cc93e");
    }
    ctx.save();
    ctx.shadowColor = w.dying ? "rgba(255,106,77,0.6)" : "rgba(168,232,48,0.6)";
    ctx.shadowBlur = cell * 0.5;
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(h.x, h.y, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // язык (сразу после еды)
    if (!w.dying && now < w.tongueUntil) {
      const fl = 1 + 0.35 * Math.sin(now / 35);
      ctx.strokeStyle = "#ff6a4d";
      ctx.lineWidth = Math.max(1.5, cell * 0.07);
      ctx.lineCap = "round";
      const tx = h.x + d.x * hr;
      const ty = h.y + d.y * hr;
      const len = cell * 0.34 * fl;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + d.x * len, ty + d.y * len);
      const px = -d.y;
      const py = d.x;
      ctx.moveTo(tx + d.x * len, ty + d.y * len);
      ctx.lineTo(tx + d.x * len + (d.x + px) * cell * 0.12, ty + d.y * len + (d.y + py) * cell * 0.12);
      ctx.moveTo(tx + d.x * len, ty + d.y * len);
      ctx.lineTo(tx + d.x * len + (d.x - px) * cell * 0.12, ty + d.y * len + (d.y - py) * cell * 0.12);
      ctx.stroke();
    }

    // глаза: зрачки смотрят на еду
    if (!w.dying) {
      const fx = (w.food.x + 0.5) * cell;
      const fy = (w.food.y + 0.5) * cell;
      let lx = fx - h.x;
      let ly = fy - h.y;
      const ld = Math.hypot(lx, ly) || 1;
      lx /= ld;
      ly /= ld;
      const px = -d.y;
      const py = d.x;
      for (const s of [1, -1]) {
        const ex = h.x + d.x * hr * 0.28 + px * s * hr * 0.42;
        const ey = h.y + d.y * hr * 0.28 + py * s * hr * 0.42;
        ctx.fillStyle = "#f4ffe8";
        ctx.beginPath();
        ctx.arc(ex, ey, hr * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0d2412";
        ctx.beginPath();
        ctx.arc(ex + lx * hr * 0.12 + d.x * hr * 0.06, ey + ly * hr * 0.12 + d.y * hr * 0.06, hr * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // крестики вместо глаз
      const px = -d.y;
      const py = d.x;
      ctx.strokeStyle = "#3a140c";
      ctx.lineWidth = Math.max(1.5, cell * 0.06);
      for (const s of [1, -1]) {
        const ex = h.x + d.x * hr * 0.28 + px * s * hr * 0.42;
        const ey = h.y + d.y * hr * 0.28 + py * s * hr * 0.42;
        const r = hr * 0.18;
        ctx.beginPath();
        ctx.moveTo(ex - r, ey - r);
        ctx.lineTo(ex + r, ey + r);
        ctx.moveTo(ex + r, ey - r);
        ctx.lineTo(ex - r, ey + r);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ---- частицы ---- */
  if (w.particles.length) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of w.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, Math.max(0.4, p.size * cell * p.life), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---- всплывающие очки ---- */
  if (w.floaters.length) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(cell * 0.62)}px Unbounded, Manrope, sans-serif`;
    for (const f of w.floaters) {
      const k = 1 - f.life;
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, (f.x + 0.5) * cell, (f.y + 0.5) * cell - k * cell * 1.3);
    }
    ctx.restore();
  }

  /* ---- красная виньетка при гибели ---- */
  if (w.dying) {
    const a = 0.22 * (0.6 + 0.4 * Math.sin(now / 70));
    const g = ctx.createRadialGradient(
      cssSize / 2,
      cssSize / 2,
      cssSize * 0.25,
      cssSize / 2,
      cssSize / 2,
      cssSize * 0.72
    );
    g.addColorStop(0, "rgba(255,60,40,0)");
    g.addColorStop(1, `rgba(255,60,40,${a.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cssSize, cssSize);
  }
}
