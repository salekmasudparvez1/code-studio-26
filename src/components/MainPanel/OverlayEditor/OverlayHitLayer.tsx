import React, { useCallback, useRef, useState } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../../constants/defaults';
import {
  Overlay,
  OverlayDrawStyle,
  OverlayKind,
  OverlayPatch,
  OverlayTool,
  Point,
} from '../../../types/overlay';
import {
  clientToCanvas,
  createDraftShape,
  createTextOverlay,
  finalizeDraft,
  getOverlayBounds,
  hitTestOverlay,
  isOverlayVisibleAt,
  translateOverlay,
  updateDraftShape,
} from '../../../utils/overlays';

interface OverlayHitLayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlays: Overlay[];
  selectedId: string | null;
  tool: OverlayTool;
  drawStyle: OverlayDrawStyle;
  currentTime: number;
  totalDuration: number;
  onSelect: (id: string | null) => void;
  onAdd: (overlay: Overlay) => void;
  onDelete: (id: string) => void;
  onLiveUpdate: (id: string, updates: OverlayPatch) => void;
  onCommit: () => void;
  onDraftChange: (overlay: Overlay | null) => void;
  onToolChange: (tool: OverlayTool) => void;
}

const toolToKind = (tool: OverlayTool): Exclude<OverlayKind, 'text'> | null => {
  if (tool === 'pen') return 'path';
  if (tool === 'arrow') return 'arrow';
  if (tool === 'ellipse') return 'ellipse';
  if (tool === 'rect') return 'rect';
  if (tool === 'highlight') return 'highlight';
  return null;
};

export const OverlayHitLayer: React.FC<OverlayHitLayerProps> = ({
  canvasRef,
  overlays,
  selectedId,
  tool,
  drawStyle,
  currentTime,
  totalDuration,
  onSelect,
  onAdd,
  onDelete,
  onLiveUpdate,
  onCommit,
  onDraftChange,
  onToolChange,
}) => {
  const [draft, setDraft] = useState<Overlay | null>(null);
  const dragRef = useRef<{
    id: string;
    origin: Point;
    start: Overlay;
    moved: boolean;
  } | null>(null);
  const selected = overlays.find((item) => item.id === selectedId) || null;
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d') ?? undefined;
  const bounds =
    selected && isOverlayVisibleAt(selected, currentTime)
      ? getOverlayBounds(selected, ctx)
      : null;

  const pointFromEvent = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): Point | null => {
      const stage = canvasRef.current;
      if (!stage) return null;
      return clientToCanvas(stage, event.clientX, event.clientY);
    },
    [canvasRef]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === 'text') {
      onAdd(createTextOverlay(point, drawStyle, overlays, currentTime, totalDuration));
      onToolChange('select');
      return;
    }

    if (tool === 'eraser') {
      const hit = hitTestOverlay(overlays, point, currentTime, ctx);
      if (hit && !hit.locked) onDelete(hit.id);
      return;
    }

    const kind = toolToKind(tool);
    if (kind) {
      const nextDraft = createDraftShape(
        kind,
        point,
        drawStyle,
        overlays,
        currentTime,
        totalDuration
      );
      setDraft(nextDraft);
      onDraftChange(nextDraft);
      return;
    }

    const hit = hitTestOverlay(overlays, point, currentTime, ctx);
    onSelect(hit?.id ?? null);
    if (hit && !hit.locked) {
      dragRef.current = { id: hit.id, origin: point, start: hit, moved: false };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointFromEvent(event);
    if (!point) return;

    if (draft) {
      const next = updateDraftShape(draft, point);
      setDraft(next);
      onDraftChange(next);
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const dx = point.x - drag.origin.x;
    const dy = point.y - drag.origin.y;
    if (Math.hypot(dx, dy) > 1) drag.moved = true;
    onLiveUpdate(drag.id, translateOverlay(drag.start, dx, dy) as OverlayPatch);
  };

  const handlePointerUp = () => {
    if (draft) {
      const finished = finalizeDraft(draft);
      setDraft(null);
      onDraftChange(null);
      if (finished) onAdd(finished);
    }
    if (dragRef.current?.moved) {
      onCommit();
    }
    dragRef.current = null;
  };

  return (
    <div
      className={`overlay-hit-layer overlay-hit-layer-${tool}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="presentation"
      aria-hidden="true"
    >
      {selected && bounds && (
        <div
          className="overlay-selection-box"
          style={{
            left: `${(bounds.x / CANVAS_WIDTH) * 100}%`,
            top: `${(bounds.y / CANVAS_HEIGHT) * 100}%`,
            width: `${(bounds.width / CANVAS_WIDTH) * 100}%`,
            height: `${(bounds.height / CANVAS_HEIGHT) * 100}%`,
          }}
        />
      )}
    </div>
  );
};
