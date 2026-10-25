import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/defaults';
import {
  Overlay,
  OverlayBounds,
  OverlayDrawStyle,
  OverlayKind,
  Point,
  TextOverlay,
} from '../types/overlay';
import { clamp } from './math';

export const overlayUid = (): string =>
  'overlay_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

export function isOverlayVisibleAt(overlay: Overlay, time: number): boolean {
  if (!overlay.visible) return false;
  return time + 1e-6 >= overlay.startTime && time <= overlay.endTime + 1e-6;
}

export function sortOverlaysByZ(overlays: Overlay[]): Overlay[] {
  return [...overlays].sort((a, b) => a.zIndex - b.zIndex);
}

export function nextZIndex(overlays: Overlay[]): number {
  if (overlays.length === 0) return 1;
  return Math.max(...overlays.map((item) => item.zIndex)) + 1;
}

export function defaultOverlayWindow(
  currentTime: number,
  totalDuration: number,
  span = 4
): { startTime: number; endTime: number } {
  const duration = Math.max(0.2, totalDuration);
  const startTime = clamp(currentTime, 0, Math.max(0, duration - 0.2));
  const endTime = Math.min(duration, Math.max(startTime + 0.2, startTime + span));
  return { startTime, endTime };
}

export function normalizeRect(
  x: number,
  y: number,
  width: number,
  height: number
): OverlayBounds {
  const next = { x, y, width, height };
  if (next.width < 0) {
    next.x += next.width;
    next.width = -next.width;
  }
  if (next.height < 0) {
    next.y += next.height;
    next.height = -next.height;
  }
  return next;
}

export function clientToCanvas(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): Point {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 1;
  const height = rect.height || 1;
  return {
    x: ((clientX - rect.left) / width) * CANVAS_WIDTH,
    y: ((clientY - rect.top) / height) * CANVAS_HEIGHT,
  };
}

function measureText(overlay: TextOverlay, ctx?: CanvasRenderingContext2D): {
  width: number;
  height: number;
} {
  const pad = overlay.padding ?? 10;
  const lines = (overlay.text || '').split('\n');
  if (ctx) {
    ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
    let maxWidth = 0;
    for (const line of lines) {
      maxWidth = Math.max(maxWidth, ctx.measureText(line || ' ').width);
    }
    return {
      width: maxWidth + pad * 2,
      height: lines.length * overlay.fontSize * 1.25 + pad * 2,
    };
  }
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
  return {
    width: longest * overlay.fontSize * 0.62 + pad * 2,
    height: lines.length * overlay.fontSize * 1.25 + pad * 2,
  };
}

export function getOverlayBounds(
  overlay: Overlay,
  ctx?: CanvasRenderingContext2D
): OverlayBounds {
  if (overlay.kind === 'text') {
    const size = measureText(overlay, ctx);
    return { x: overlay.x, y: overlay.y, width: size.width, height: size.height };
  }
  if (overlay.kind === 'path' || overlay.kind === 'highlight') {
    const pad = overlay.strokeWidth / 2 + 4;
    if (!overlay.points.length) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    let minX = overlay.points[0].x;
    let minY = overlay.points[0].y;
    let maxX = overlay.points[0].x;
    let maxY = overlay.points[0].y;
    for (const point of overlay.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(1, maxX - minX + pad * 2),
      height: Math.max(1, maxY - minY + pad * 2),
    };
  }
  if (overlay.kind === 'arrow') {
    const pad = overlay.strokeWidth + 8;
    const bounds = normalizeRect(
      overlay.x,
      overlay.y,
      overlay.x2 - overlay.x,
      overlay.y2 - overlay.y
    );
    return {
      x: bounds.x - pad,
      y: bounds.y - pad,
      width: bounds.width + pad * 2,
      height: bounds.height + pad * 2,
    };
  }
  const box = normalizeRect(overlay.x, overlay.y, overlay.width, overlay.height);
  const pad = overlay.strokeWidth / 2 + 2;
  return {
    x: box.x - pad,
    y: box.y - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };
}

function distToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / len2, 0, 1);
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function pointInEllipse(point: Point, overlay: Extract<Overlay, { kind: 'ellipse' }>): boolean {
  const box = normalizeRect(overlay.x, overlay.y, overlay.width, overlay.height);
  const rx = box.width / 2;
  const ry = box.height / 2;
  if (rx <= 0 || ry <= 0) return false;
  const cx = box.x + rx;
  const cy = box.y + ry;
  const nx = (point.x - cx) / (rx + overlay.strokeWidth);
  const ny = (point.y - cy) / (ry + overlay.strokeWidth);
  return nx * nx + ny * ny <= 1;
}

export function overlayContainsPoint(
  overlay: Overlay,
  point: Point,
  ctx?: CanvasRenderingContext2D
): boolean {
  if (overlay.kind === 'path' || overlay.kind === 'highlight') {
    const threshold = Math.max(8, overlay.strokeWidth);
    if (overlay.points.length === 1) {
      return Math.hypot(point.x - overlay.points[0].x, point.y - overlay.points[0].y) <= threshold;
    }
    for (let i = 1; i < overlay.points.length; i++) {
      if (distToSegment(point, overlay.points[i - 1], overlay.points[i]) <= threshold) {
        return true;
      }
    }
    return false;
  }
  if (overlay.kind === 'arrow') {
    return distToSegment(point, { x: overlay.x, y: overlay.y }, { x: overlay.x2, y: overlay.y2 }) <=
      Math.max(10, overlay.strokeWidth + 4);
  }
  if (overlay.kind === 'ellipse') {
    return pointInEllipse(point, overlay);
  }
  const bounds = getOverlayBounds(overlay, ctx);
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function hitTestOverlay(
  overlays: Overlay[],
  point: Point,
  time: number,
  ctx?: CanvasRenderingContext2D
): Overlay | null {
  const ordered = sortOverlaysByZ(overlays).reverse();
  for (const overlay of ordered) {
    if (!isOverlayVisibleAt(overlay, time)) continue;
    if (overlayContainsPoint(overlay, point, ctx)) return overlay;
  }
  return null;
}

export function translateOverlay(overlay: Overlay, dx: number, dy: number): Overlay {
  if (overlay.kind === 'text') {
    return { ...overlay, x: overlay.x + dx, y: overlay.y + dy };
  }
  if (overlay.kind === 'path' || overlay.kind === 'highlight') {
    return {
      ...overlay,
      points: overlay.points.map((point) => ({ x: point.x + dx, y: point.y + dy })),
    };
  }
  if (overlay.kind === 'arrow') {
    return {
      ...overlay,
      x: overlay.x + dx,
      y: overlay.y + dy,
      x2: overlay.x2 + dx,
      y2: overlay.y2 + dy,
    };
  }
  return { ...overlay, x: overlay.x + dx, y: overlay.y + dy };
}

export function labelForKind(kind: OverlayKind): string {
  if (kind === 'text') return 'Text';
  if (kind === 'path') return 'Drawing';
  if (kind === 'arrow') return 'Arrow';
  if (kind === 'ellipse') return 'Circle';
  if (kind === 'rect') return 'Rectangle';
  return 'Highlight';
}

export function createTextOverlay(
  point: Point,
  style: OverlayDrawStyle,
  overlays: Overlay[],
  currentTime: number,
  totalDuration: number
): TextOverlay {
  const window = defaultOverlayWindow(currentTime, totalDuration);
  return {
    id: overlayUid(),
    name: `${labelForKind('text')} ${overlays.filter((item) => item.kind === 'text').length + 1}`,
    kind: 'text',
    ...window,
    zIndex: nextZIndex(overlays),
    visible: true,
    locked: false,
    opacity: 1,
    text: 'Note',
    x: point.x,
    y: point.y,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.color,
    background: style.background,
    padding: 12,
  };
}

export function createDraftShape(
  kind: Exclude<OverlayKind, 'text'>,
  start: Point,
  style: OverlayDrawStyle,
  overlays: Overlay[],
  currentTime: number,
  totalDuration: number
): Overlay {
  const window = defaultOverlayWindow(currentTime, totalDuration);
  const base = {
    id: overlayUid(),
    name: `${labelForKind(kind)} ${overlays.filter((item) => item.kind === kind).length + 1}`,
    ...window,
    zIndex: nextZIndex(overlays),
    visible: true,
    locked: false,
    opacity: 1,
  };

  if (kind === 'path' || kind === 'highlight') {
    return {
      ...base,
      kind,
      points: [start],
      stroke: style.stroke,
      strokeWidth: kind === 'highlight' ? Math.max(18, style.strokeWidth * 3) : style.strokeWidth,
    };
  }
  if (kind === 'arrow') {
    return {
      ...base,
      kind: 'arrow',
      x: start.x,
      y: start.y,
      x2: start.x,
      y2: start.y,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
    };
  }
  return {
    ...base,
    kind,
    x: start.x,
    y: start.y,
    width: 1,
    height: 1,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    fill: style.fill,
  };
}

export function updateDraftShape(overlay: Overlay, point: Point): Overlay {
  if (overlay.kind === 'path' || overlay.kind === 'highlight') {
    const last = overlay.points[overlay.points.length - 1];
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < 2) return overlay;
    return { ...overlay, points: [...overlay.points, point] };
  }
  if (overlay.kind === 'arrow') {
    return { ...overlay, x2: point.x, y2: point.y };
  }
  if (overlay.kind === 'ellipse' || overlay.kind === 'rect') {
    return { ...overlay, width: point.x - overlay.x, height: point.y - overlay.y };
  }
  return overlay;
}

export function finalizeDraft(overlay: Overlay): Overlay | null {
  if (overlay.kind === 'path' || overlay.kind === 'highlight') {
    if (overlay.points.length < 2) return null;
    return overlay;
  }
  if (overlay.kind === 'arrow') {
    if (Math.hypot(overlay.x2 - overlay.x, overlay.y2 - overlay.y) < 8) return null;
    return overlay;
  }
  if (overlay.kind === 'ellipse' || overlay.kind === 'rect') {
    const box = normalizeRect(overlay.x, overlay.y, overlay.width, overlay.height);
    if (box.width < 6 || box.height < 6) return null;
    return { ...overlay, ...box };
  }
  return overlay;
}

export function moveOverlayOrder(overlays: Overlay[], id: string, direction: 'up' | 'down'): Overlay[] {
  const ordered = sortOverlaysByZ(overlays);
  const index = ordered.findIndex((item) => item.id === id);
  if (index === -1) return overlays;
  const swapWith = direction === 'up' ? index + 1 : index - 1;
  if (swapWith < 0 || swapWith >= ordered.length) return overlays;
  const copy = [...ordered];
  const currentZ = copy[index].zIndex;
  copy[index] = { ...copy[index], zIndex: copy[swapWith].zIndex };
  copy[swapWith] = { ...copy[swapWith], zIndex: currentZ };
  return copy;
}

export function reorderOverlays(overlays: Overlay[], fromId: string, toId: string): Overlay[] {
  const ordered = sortOverlaysByZ(overlays);
  const fromIndex = ordered.findIndex((item) => item.id === fromId);
  const toIndex = ordered.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return overlays;
  const copy = [...ordered];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy.map((item, index) => ({ ...item, zIndex: index + 1 }));
}
