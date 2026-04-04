import { useRef, useEffect, useCallback } from 'react';

/* ─── Characters used for the rain ─── */
const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
  'ウアイエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ' +
  'ヤユヨラリルレロワヲン☁☂☔⛅🌧🌪💧❄';

/* ─── Umbrella shape constants ─── */
const UMBRELLA = {
  canopyRx: 110,
  canopyRy: 48,
  handleW: 4,
  handleH: 80,
  hookR: 14,
  // Shield zone extends below canopy — constant area
  shieldPadding: 18, // extra px around canopy for shield
};

/* ─── Rain configuration ─── */
const RAIN = {
  columnWidth: 18,     // px between rain columns
  fontSize: 15,
  speed: 2.8,          // base fall speed px/frame
  speedVariance: 1.5,  // random variance
  trailLength: 20,     // how many chars in each trail
  newDropChance: 0.04, // chance per column per frame to spawn
};

/* ─── Mist particle ─── */
function createMistParticle(x, canvasH) {
  return {
    x: x + (Math.random() - 0.5) * 12,
    y: canvasH - Math.random() * 8,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(Math.random() * 1.2 + 0.3),
    life: 1.0,
    decay: 0.008 + Math.random() * 0.012,
    size: 1 + Math.random() * 2.5,
  };
}

/* ─── Check if a point is shielded by the umbrella ─── */
function isShielded(px, py, ux, uy) {
  const { canopyRx, canopyRy, shieldPadding, handleW, handleH, hookR } = UMBRELLA;
  const rx = canopyRx + shieldPadding;
  const ry = canopyRy + shieldPadding;

  // Above the canopy top — not shielded
  if (py < uy - ry) return false;

  // In canopy zone: check if inside the ellipse horizontally
  if (py <= uy + 4) {
    const dx = (px - ux) / rx;
    const dy = (py - uy) / ry;
    return dx * dx + dy * dy <= 1.0;
  }

  // Below canopy — "dry zone" is a trapezoid widening slightly downward
  // but bounded by the canopy width
  const belowDist = py - uy;
  const maxBelow = handleH + hookR + 30;
  if (belowDist > maxBelow) return false;

  // Width of dry zone narrows very slightly or stays constant
  const dryHalfW = rx * 0.95;
  return Math.abs(px - ux) < dryHalfW;
}

/* ─── Get the Y where rain should stop for a given column X ─── */
function getCanopyStopY(px, ux, uy) {
  const { canopyRx, canopyRy, shieldPadding } = UMBRELLA;
  const rx = canopyRx + shieldPadding;
  const ry = canopyRy + shieldPadding;
  const dx = (px - ux) / rx;
  if (Math.abs(dx) > 1) return null; // not under canopy
  // Solve ellipse: y = uy - ry * sqrt(1 - dx²)  (top of ellipse)
  const stopY = uy - ry * Math.sqrt(1 - dx * dx);
  return stopY;
}

/* ─── Draw the umbrella ─── */
function drawUmbrella(ctx, cx, cy) {
  const { canopyRx, canopyRy, handleW, handleH, hookR } = UMBRELLA;

  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.15)';
  ctx.shadowBlur = 25;

  // Canopy — top half ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy, canopyRx, canopyRy, 0, Math.PI, 0, false);
  ctx.closePath();
  ctx.fillStyle = '#f0f0f0';
  ctx.fill();

  // Scalloped bottom edge
  const scallops = 5;
  const scW = (canopyRx * 2) / scallops;
  ctx.beginPath();
  for (let i = 0; i < scallops; i++) {
    const sx = cx - canopyRx + i * scW;
    ctx.moveTo(sx, cy);
    ctx.quadraticCurveTo(sx + scW / 2, cy + 16, sx + scW, cy);
  }
  ctx.strokeStyle = '#0a0a12';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Canopy segment lines
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  for (let i = 1; i < scallops; i++) {
    const lx = cx - canopyRx + i * scW;
    ctx.moveTo(lx, cy);
    ctx.lineTo(cx, cy - canopyRy);
  }
  ctx.stroke();

  // Handle stem
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy + handleH);
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = handleW;
  ctx.lineCap = 'round';
  ctx.stroke();

  // J-hook
  ctx.beginPath();
  ctx.arc(cx - hookR, cy + handleH, hookR, 0, Math.PI * 0.8, false);
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = handleW;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

/* ═══════════════ React Component ═══════════════ */
export default function UmbrellaReflow() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    columns: [],
    mist: [],
    ux: 0,
    uy: 0,
    dragging: false,
    dragOff: { x: 0, y: 0 },
    W: 0,
    H: 0,
    initialized: false,
  });
  const rafId = useRef(null);

  /* ── Initialize rain columns ── */
  const initColumns = useCallback((W, H) => {
    const s = stateRef.current;
    const count = Math.ceil(W / RAIN.columnWidth);
    s.columns = [];
    for (let i = 0; i < count; i++) {
      s.columns.push({
        x: i * RAIN.columnWidth + RAIN.columnWidth / 2,
        drops: [],
      });
    }
    s.mist = [];
    if (!s.initialized) {
      s.ux = W / 2;
      s.uy = H * 0.42;
      s.initialized = true;
    }
    s.W = W;
    s.H = H;

    // Pre-seed some drops so canvas isn't empty on first frame
    for (let f = 0; f < 120; f++) {
      updateRain(s);
    }
  }, []);

  /* ── Spawn & update rain drops ── */
  function updateRain(s) {
    const { columns, W, H } = s;

    for (const col of columns) {
      // Possibly spawn a new drop
      if (Math.random() < RAIN.newDropChance) {
        col.drops.push({
          y: -RAIN.fontSize * 2 - Math.random() * 60,
          speed: RAIN.speed + (Math.random() - 0.5) * RAIN.speedVariance,
          chars: [],
          age: 0,
        });

        // Build character trail
        const drop = col.drops[col.drops.length - 1];
        for (let t = 0; t < RAIN.trailLength; t++) {
          drop.chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
      }

      // Update each drop
      for (let d = col.drops.length - 1; d >= 0; d--) {
        const drop = col.drops[d];
        drop.age++;

        // Check if this column hits the umbrella canopy
        const stopY = getCanopyStopY(col.x, s.ux, s.uy);

        if (stopY !== null && drop.y >= stopY - RAIN.fontSize) {
          // Rain hits the canopy — create splash and remove
          if (Math.random() < 0.3) {
            s.mist.push(createMistParticle(col.x, stopY));
          }
          col.drops.splice(d, 1);
          continue;
        }

        drop.y += drop.speed;

        // Occasionally mutate a character
        if (Math.random() < 0.03) {
          const idx = Math.floor(Math.random() * drop.chars.length);
          drop.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        // Hit bottom — create mist and remove
        if (drop.y > H + RAIN.fontSize) {
          for (let p = 0; p < 2; p++) {
            s.mist.push(createMistParticle(col.x, H));
          }
          col.drops.splice(d, 1);
        }
      }
    }

    // Update mist
    for (let m = s.mist.length - 1; m >= 0; m--) {
      const p = s.mist[m];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) s.mist.splice(m, 1);
    }
  }

  /* ── Render frame ── */
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    const { W, H } = s;

    // Fade trail effect
    ctx.fillStyle = 'rgba(5, 8, 18, 0.12)';
    ctx.fillRect(0, 0, W, H);

    updateRain(s);

    ctx.font = `${RAIN.fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';

    // Draw rain drops
    for (const col of s.columns) {
      for (const drop of col.drops) {
        for (let t = 0; t < drop.chars.length; t++) {
          const charY = drop.y - t * RAIN.fontSize;
          if (charY < -RAIN.fontSize || charY > H + RAIN.fontSize) continue;

          // Skip if in the shielded zone
          if (isShielded(col.x, charY, s.ux, s.uy)) continue;

          // Brightness: head is brightest, tail fades
          const brightness = t === 0 ? 1.0 : Math.max(0.08, 1 - t / drop.chars.length);
          if (t === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 8;
          } else {
            const g = Math.floor(100 + 155 * brightness);
            ctx.fillStyle = `rgba(0, ${g}, 65, ${0.3 + 0.7 * brightness})`;
            ctx.shadowBlur = 0;
          }
          ctx.fillText(drop.chars[t], col.x, charY);
        }
        ctx.shadowBlur = 0;
      }
    }

    // Draw mist at bottom and around canopy
    for (const p of s.mist) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 65, ${p.life * 0.3})`;
      ctx.fill();
    }

    // Bottom mist glow
    const grad = ctx.createLinearGradient(0, H - 40, 0, H);
    grad.addColorStop(0, 'rgba(0, 255, 65, 0)');
    grad.addColorStop(1, 'rgba(0, 255, 65, 0.06)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - 40, W, 40);

    // Draw umbrella on top
    drawUmbrella(ctx, s.ux, s.uy);

    // Instruction
    ctx.font = '12px "Inter", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(142,153,184,0.5)';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText('☂ Drag the umbrella to shield from the rain', W / 2, H - 8);
    ctx.textAlign = 'start';

    rafId.current = requestAnimationFrame(renderFrame);
  }, []);

  /* ── Resize ── */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Clear fully for re-init
    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 0, W, H);

    initColumns(W, H);
  }, [initColumns]);

  /* ── Mouse/touch ── */
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const isOnUmbrella = useCallback((px, py) => {
    const s = stateRef.current;
    const { canopyRx, canopyRy, handleH, hookR } = UMBRELLA;
    const dx = (px - s.ux) / (canopyRx + 15);
    const dy = (py - s.uy) / (canopyRy + 15);
    if (dx * dx + dy * dy <= 1.2 && py <= s.uy + 10) return true;
    if (Math.abs(px - s.ux) < 25 && py >= s.uy && py <= s.uy + handleH + hookR + 10) return true;
    return false;
  }, []);

  const onDown = useCallback((e) => {
    const pos = getPos(e);
    if (isOnUmbrella(pos.x, pos.y)) {
      const s = stateRef.current;
      s.dragging = true;
      s.dragOff = { x: pos.x - s.ux, y: pos.y - s.uy };
      e.preventDefault();
    }
  }, [getPos, isOnUmbrella]);

  const onMove = useCallback((e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const pos = getPos(e);
    s.ux = pos.x - s.dragOff.x;
    s.uy = pos.y - s.dragOff.y;
    e.preventDefault();
  }, [getPos]);

  const onUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  /* ── Lifecycle ── */
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    // Start animation loop
    rafId.current = requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleResize, onDown, onMove, onUp, renderFrame]);

  return (
    <div className="umbrella-reflow-wrapper" id="umbrella-reflow">
      <canvas
        ref={canvasRef}
        className="umbrella-reflow-canvas"
      />
    </div>
  );
}
