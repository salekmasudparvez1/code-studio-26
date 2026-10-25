import { Overlay } from '../../types/overlay';
import { isOverlayVisibleAt, normalizeRect, sortOverlaysByZ } from '../overlays';

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function withOpacity(ctx: CanvasRenderingContext2D, opacity: number, draw: () => void): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  draw();
  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  x2: number,
  y2: number,
  size: number
): void {
  const angle = Math.atan2(y2 - y, x2 - x);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - size * Math.cos(angle - Math.PI / 7),
    y2 - size * Math.sin(angle - Math.PI / 7)
  );
  ctx.lineTo(
    x2 - size * Math.cos(angle + Math.PI / 7),
    y2 - size * Math.sin(angle + Math.PI / 7)
  );
  ctx.closePath();
  ctx.fill();
}

function drawOverlayItem(ctx: CanvasRenderingContext2D, overlay: Overlay): void {
  withOpacity(ctx, overlay.opacity, () => {
    if (overlay.kind === 'text') {
      const pad = overlay.padding ?? 10;
      ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const lines = (overlay.text || '').split('\n');
      let maxWidth = 0;
      for (const line of lines) {
        maxWidth = Math.max(maxWidth, ctx.measureText(line || ' ').width);
      }
      const width = maxWidth + pad * 2;
      const height = lines.length * overlay.fontSize * 1.25 + pad * 2;
      if (overlay.background) {
        fillRoundRect(ctx, overlay.x, overlay.y, width, height, 10, overlay.background);
      }
      ctx.fillStyle = overlay.color;
      lines.forEach((line, index) => {
        ctx.fillText(line, overlay.x + pad, overlay.y + pad + index * overlay.fontSize * 1.25);
      });
      return;
    }

    if (overlay.kind === 'path' || overlay.kind === 'highlight') {
      if (overlay.points.length < 1) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = overlay.stroke;
      ctx.lineWidth = overlay.strokeWidth;
      if (overlay.kind === 'highlight') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = overlay.opacity * 0.45;
      }
      ctx.beginPath();
      ctx.moveTo(overlay.points[0].x, overlay.points[0].y);
      for (let i = 1; i < overlay.points.length; i++) {
        ctx.lineTo(overlay.points[i].x, overlay.points[i].y);
      }
      ctx.stroke();
      return;
    }

    if (overlay.kind === 'arrow') {
      ctx.strokeStyle = overlay.stroke;
      ctx.fillStyle = overlay.stroke;
      ctx.lineWidth = overlay.strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(overlay.x, overlay.y);
      ctx.lineTo(overlay.x2, overlay.y2);
      ctx.stroke();
      drawArrowHead(
        ctx,
        overlay.x,
        overlay.y,
        overlay.x2,
        overlay.y2,
        Math.max(14, overlay.strokeWidth * 3)
      );
      return;
    }

    const box = normalizeRect(overlay.x, overlay.y, overlay.width, overlay.height);
    ctx.lineWidth = overlay.strokeWidth;
    ctx.strokeStyle = overlay.stroke;
    if (overlay.kind === 'rect') {
      if (overlay.fill) {
        fillRoundRect(ctx, box.x, box.y, box.width, box.height, 8, overlay.fill, overlay.stroke);
      } else {
        fillRoundRect(ctx, box.x, box.y, box.width, box.height, 8, undefined, overlay.stroke);
      }
      return;
    }

    ctx.beginPath();
    ctx.ellipse(
      box.x + box.width / 2,
      box.y + box.height / 2,
      Math.max(1, box.width / 2),
      Math.max(1, box.height / 2),
      0,
      0,
      Math.PI * 2
    );
    if (overlay.fill) {
      ctx.fillStyle = overlay.fill;
      ctx.fill();
    }
    ctx.stroke();
  });
}

export function drawOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: Overlay[] | undefined,
  globalTime: number
): void {
  if (!overlays || overlays.length === 0) return;
  for (const overlay of sortOverlaysByZ(overlays)) {
    if (!isOverlayVisibleAt(overlay, globalTime)) continue;
    drawOverlayItem(ctx, overlay);
  }
}
