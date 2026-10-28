import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../constants/defaults";
import {
  Overlay,
  OverlayDrawStyle,
  OverlayKind,
  OverlayPatch,
  OverlayTool,
  Point,
  TextOverlay,
} from "../../../types/overlay";
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
} from "../../../utils/overlays";

interface OverlayHitLayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlays: Overlay[];
  selectedId: string | null;
  tool: OverlayTool;
  drawStyle: OverlayDrawStyle;
  currentTime: number;
  totalDuration: number;
  clipEndTime?: number;
  onSelect: (id: string | null) => void;
  onAdd: (overlay: Overlay) => void;
  onDelete: (id: string) => void;
  onLiveUpdate: (id: string, updates: OverlayPatch) => void;
  onCommit: () => void;
  onDraftChange: (overlay: Overlay | null) => void;
  onToolChange: (tool: OverlayTool) => void;
  onEditingChange?: (id: string | null) => void;
  onPause?: () => void;
}

const toolToKind = (tool: OverlayTool): Exclude<OverlayKind, "text"> | null => {
  if (tool === "pen") return "path";
  if (tool === "arrow") return "arrow";
  if (tool === "ellipse") return "ellipse";
  if (tool === "rect") return "rect";
  if (tool === "highlight") return "highlight";
  return null;
};

// const readText = (overlay: Overlay | null | undefined): string => {
//   if (!overlay || overlay.kind !== "text") return "";
//   return overlay.text ?? "";
// };

interface EditingState {
  id: string;
  isNew: boolean;
  value: string;
  origin: Point;
  overlay: TextOverlay;
}

export const OverlayHitLayer: React.FC<OverlayHitLayerProps> = ({
  canvasRef,
  overlays,
  selectedId,
  tool,
  drawStyle,
  currentTime,
  totalDuration,
  clipEndTime,
  onSelect,
  onAdd,
  onDelete,
  onLiveUpdate,
  onCommit,
  onDraftChange,
  onToolChange,
  onEditingChange,
  onPause,
}) => {
  const [draft, setDraft] = useState<Overlay | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const suppressBlurRef = useRef(false);
  const editingRef = useRef<EditingState | null>(null);
  editingRef.current = editing;
  const dragRef = useRef<{
    id: string;
    origin: Point;
    start: Overlay;
    moved: boolean;
  } | null>(null);

  const selected = overlays.find((item) => item.id === selectedId) || null;

  const ctx = useMemo(() => {
    const canvas = canvasRef.current;
    return canvas ? (canvas.getContext("2d") ?? undefined) : undefined;
  }, [canvasRef, overlays, selectedId]);

  const bounds = useMemo(() => {
    if (!selected) return null;
    if (!isOverlayVisibleAt(selected, currentTime)) return null;
    try {
      return getOverlayBounds(selected, ctx);
    } catch {
      return null;
    }
  }, [selected, currentTime, ctx]);

  const editingOverlay = useMemo<TextOverlay | null>(() => {
    if (!editing) return null;
    const live = overlays.find((item) => item.id === editing.id);
    if (live?.kind === "text") {
      return { ...live, text: editing.value };
    }
    return { ...editing.overlay, text: editing.value };
  }, [editing, overlays]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") {
      return;
    }
    const update = () => {
      const width = canvas.getBoundingClientRect().width || CANVAS_WIDTH;
      setDisplayScale(width / CANVAS_WIDTH);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);

  const pointFromEvent = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): Point | null => {
      const stage = canvasRef.current;
      if (!stage) return null;
      return clientToCanvas(stage, event.clientX, event.clientY);
    },
    [canvasRef],
  );

  const beginEditing = useCallback(
    (overlay: TextOverlay, isNew: boolean, origin: Point) => {
      suppressBlurRef.current = true;
      onPause?.();
      onDraftChange(null);
      setDraft(null);
      onSelect(overlay.id);
      onEditingChange?.(overlay.id);
      setEditing({
        id: overlay.id,
        isNew,
        value: overlay.text,
        origin,
        overlay,
      });
      window.setTimeout(() => {
        suppressBlurRef.current = false;
      }, 250);
    },
    [onDraftChange, onSelect, onEditingChange, onPause],
  );

  const commitEditing = useCallback(
    (value: string) => {
      const current = editingRef.current;
      if (!current) return;
      const trimmed = value;
      if (trimmed.trim().length === 0 && current.isNew) {
        onDelete(current.id);
      } else {
        onLiveUpdate(current.id, { text: trimmed });
        onCommit();
      }
      setEditing(null);
      onEditingChange?.(null);
    },
    [onDelete, onLiveUpdate, onCommit, onEditingChange],
  );

  const cancelEditing = useCallback(() => {
    const current = editingRef.current;
    if (!current) return;
    if (current.isNew) {
      onDelete(current.id);
    } else {
      onLiveUpdate(current.id, { text: current.overlay.text });
      onCommit();
    }
    setEditing(null);
    onEditingChange?.(null);
  }, [onDelete, onLiveUpdate, onCommit, onEditingChange]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    if (editing?.isNew) {
      el.select();
    } else {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, el.offsetHeight)}px`;
  }, [editing?.id, editing?.isNew]);

  useEffect(() => {
    if (!editing) return;
    const handler = (event: KeyboardEvent) => {
      const el = textareaRef.current;
      if (!el || document.activeElement !== el) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancelEditing();
      } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        commitEditing(el.value);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [editing, cancelEditing, commitEditing]);

  useEffect(() => {
    if (!editing) return;
    if (tool !== "select" && tool !== "text") {
      const el = textareaRef.current;
      commitEditing(el?.value ?? editing.value);
    }
  }, [tool, editing, commitEditing]);

  const createTextAt = (point: Point) => {
    const created = createTextOverlay(
      point,
      drawStyle,
      overlays,
      currentTime,
      clipEndTime ?? totalDuration,
    );
    if (clipEndTime != null) {
      created.endTime = Math.max(created.startTime + 0.2, clipEndTime);
    }
    onAdd(created);
    onToolChange("select");
    beginEditing(created, true, point);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    if (editing) {
      if ((event.target as HTMLElement).closest(".overlay-text-input")) return;
      commitEditing(textareaRef.current?.value ?? editing.value);
      return;
    }

    const point = pointFromEvent(event);
    if (!point) return;

    if (tool === "text") {
      event.preventDefault();
      createTextAt(point);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "eraser") {
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
        clipEndTime ?? totalDuration,
      );
      if (clipEndTime != null) {
        nextDraft.endTime = Math.max(nextDraft.startTime + 0.2, clipEndTime);
      }
      setDraft(nextDraft);
      onDraftChange(nextDraft);
      return;
    }

    const hit = hitTestOverlay(overlays, point, currentTime, ctx);
    onSelect(hit?.id ?? null);

    if (hit?.kind === "text" && !hit.locked && event.detail >= 2) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      beginEditing(hit, false, point);
      return;
    }

    if (hit && !hit.locked) {
      dragRef.current = {
        id: hit.id,
        origin: point,
        start: hit,
        moved: false,
      };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (editing) return;
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
      if (finished) {
        onAdd(finished);
      }
    }
    if (dragRef.current?.moved) onCommit();
    dragRef.current = null;
  };

  const editorStyle = useMemo<React.CSSProperties | null>(() => {
    if (!editing) return null;
    const overlay = editingOverlay;
    const pad = overlay?.padding ?? 12;
    const fontSize = overlay?.fontSize ?? drawStyle.fontSize;
    const x = overlay?.x ?? editing.origin.x;
    const y = overlay?.y ?? editing.origin.y;
    let width = fontSize * 8;
    let height = fontSize * 1.6 + pad * 2;
    if (overlay) {
      try {
        const box = getOverlayBounds(overlay, ctx);
        width = Math.max(box.width, fontSize * 8);
        height = Math.max(box.height, fontSize * 1.6 + pad * 2);
      } catch {
        /* keep fallback size */
      }
    }
    return {
      position: "absolute",
      left: `${(x / CANVAS_WIDTH) * 100}%`,
      top: `${(y / CANVAS_HEIGHT) * 100}%`,
      width: `${(width / CANVAS_WIDTH) * 100}%`,
      minHeight: `${(height / CANVAS_HEIGHT) * 100}%`,
      height: "auto",
      boxSizing: "border-box",
      fontFamily: overlay?.fontFamily ?? drawStyle.fontFamily,
      fontSize: `${fontSize * displayScale}px`,
      lineHeight: 1.25,
      color: overlay?.color ?? drawStyle.color,
      background: overlay?.background ?? "rgba(15, 23, 42, 0.72)",
      border: "1px dashed #4a9eff",
      outline: "none",
      padding: `${pad * displayScale}px`,
      margin: 0,
      resize: "none",
      overflow: "hidden",
      whiteSpace: "pre-wrap",
      caretColor: overlay?.color ?? drawStyle.color,
      zIndex: 30,
      pointerEvents: "auto",
      borderRadius: 8,
    };
  }, [editing, editingOverlay, drawStyle, ctx, displayScale]);

  return (
    <div
      className={`overlay-hit-layer overlay-hit-layer-${tool}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="presentation"
    >
      {selected && bounds && !editing && (
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

      {editing && editorStyle && (
        <textarea
          ref={textareaRef}
          className="overlay-text-input"
          style={editorStyle}
          value={editing.value}
          placeholder="Type here"
          aria-label="Edit overlay text"
          spellCheck={false}
          onChange={(event) => {
            const value = event.target.value;
            setEditing((prev) => (prev ? { ...prev, value } : prev));
            onLiveUpdate(editing.id, { text: value });
            const el = event.target;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onBlur={(event) => {
            if (suppressBlurRef.current) {
              event.target.focus();
              return;
            }
            commitEditing(event.target.value);
          }}
        />
      )}
    </div>
  );
};
