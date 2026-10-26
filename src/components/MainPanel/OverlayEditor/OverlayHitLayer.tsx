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
  onSelect: (id: string | null) => void;
  onAdd: (overlay: Overlay) => void;
  onDelete: (id: string) => void;
  onLiveUpdate: (id: string, updates: OverlayPatch) => void;
  onCommit: () => void;
  onDraftChange: (overlay: Overlay | null) => void;
  onToolChange: (tool: OverlayTool) => void;
}

const toolToKind = (tool: OverlayTool): Exclude<OverlayKind, "text"> | null => {
  if (tool === "pen") return "path";
  if (tool === "arrow") return "arrow";
  if (tool === "ellipse") return "ellipse";
  if (tool === "rect") return "rect";
  if (tool === "highlight") return "highlight";
  return null;
};

/** Extract the current text from any overlay shape. */
const readText = (overlay: Overlay | null | undefined): string => {
  if (!overlay) return "";
  // Overlay text can live in a few shapes depending on your model; try all.
  const anyOverlay = overlay as unknown as {
    text?: string;
    content?: string;
    label?: string;
  };
  return anyOverlay.text ?? anyOverlay.content ?? anyOverlay.label ?? "";
};

interface EditingState {
  id: string;
  isNew: boolean;
  value: string;
}

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
  const [editing, setEditing] = useState<EditingState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dragRef = useRef<{
    id: string;
    origin: Point;
    start: Overlay;
    moved: boolean;
  } | null>(null);

  const selected = overlays.find((item) => item.id === selectedId) || null;
  const editingOverlay = editing
    ? overlays.find((item) => item.id === editing.id) || null
    : null;

  // Measure context for hit-testing / bounds. Memoized so it doesn't
  // churn every render, and guarded for null canvas.
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

  const editingBounds = useMemo(() => {
    if (!editingOverlay) return null;
    try {
      return getOverlayBounds(editingOverlay, ctx);
    } catch {
      return null;
    }
  }, [editingOverlay, ctx]);

  const pointFromEvent = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): Point | null => {
      const stage = canvasRef.current;
      if (!stage) return null;
      return clientToCanvas(stage, event.clientX, event.clientY);
    },
    [canvasRef],
  );

  /* ------------------------------- editing -------------------------------- */

  const beginEditing = useCallback(
    (id: string, initialValue: string, isNew: boolean) => {
      setEditing({ id, isNew, value: initialValue });
      // Clear any transient draft so we don't paint a ghost behind the textarea.
      setDraft(null);
      onDraftChange(null);
      onSelect(id);
    },
    [onDraftChange, onSelect],
  );

  const commitEditing = useCallback(
    (value: string) => {
      if (!editing) return;
      const trimmed = value; // keep whitespace; user may want it
      if (trimmed.trim().length === 0 && editing.isNew) {
        // Empty new node → discard entirely instead of leaving a blank box.
        onDelete(editing.id);
      } else {
        // Feed the current node so we preserve its style fields.
        const currentNode = overlays.find((o) => o.id === editing.id) ?? null;
        if (currentNode) {
          onLiveUpdate(editing.id, {
            text: trimmed,
          } as unknown as OverlayPatch);
        } else {
          // If the overlay hasn't propagated to `overlays` yet (parent state
          // is async), update via the text field that the renderer will pick
          // up on the next tick.
          onLiveUpdate(editing.id, {
            text: trimmed,
          } as unknown as OverlayPatch);
        }
        onCommit();
      }
      setEditing(null);
    },
    [editing, overlays, onDelete, onLiveUpdate, onCommit],
  );

  const cancelEditing = useCallback(() => {
    if (!editing) return;
    if (editing.isNew) {
      onDelete(editing.id);
    } else {
      // Restore the pre-edit text.
      onLiveUpdate(editing.id, {
        text: editing.value,
      } as unknown as OverlayPatch);
      onCommit();
    }
    setEditing(null);
  }, [editing, onDelete, onLiveUpdate, onCommit]);

  // Auto-focus the textarea whenever an edit starts. Select all text on new
  // nodes so the user can type over the placeholder immediately.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    if (editing?.isNew) {
      el.select();
    } else {
      // Put caret at end for existing text.
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [editing?.id, editing?.isNew]);

  // Re-measure after fonts load so the textarea lines up with the canvas.
  const [, forceMeasure] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(() => {
      if (!cancelled) forceMeasure((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [drawStyle.fontFamily, drawStyle.fontSize]);

  // Escape cancels the edit, Cmd/Ctrl+Enter commits. Let Enter insert a
  // newline so multi-line text works like every other editor.
  useEffect(() => {
    if (!editing) return;
    const handler = (event: KeyboardEvent) => {
      const el = textareaRef.current;
      if (!el || document.activeElement !== el) return;
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
      } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        commitEditing(el.value);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [editing, cancelEditing, commitEditing]);

  // If the tool changes away from text while editing, commit.
  useEffect(() => {
    if (!editing) return;
    if (tool !== "select" && tool !== "text") {
      const el = textareaRef.current;
      commitEditing(el?.value ?? editing.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  /* ------------------------------ pointer input ---------------------------- */

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (editing) return; // Ignore clicks behind the editor.

    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    // Text tool: create + immediately open the editor.
    if (tool === "text") {
      const created = createTextOverlay(
        point,
        drawStyle,
        overlays,
        currentTime,
        totalDuration,
      );
      onAdd(created);
      onToolChange("select");
      // Don't set `draft` — the DOM editor is now the source of truth.
      beginEditing(created.id, readText(created), true);
      return;
    }

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
        totalDuration,
      );
      setDraft(nextDraft);
      onDraftChange(nextDraft);
      return;
    }

    // Select tool: hit-test, then either open text editing or start a drag.
    const hit = hitTestOverlay(overlays, point, currentTime, ctx);
    onSelect(hit?.id ?? null);

    if (hit && hit.kind === "text" && !hit.locked) {
      beginEditing(hit.id, readText(hit), false);
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
        if (finished.kind === "text") {
          beginEditing(finished.id, readText(finished), true);
        }
      }
    }
    if (dragRef.current?.moved) onCommit();
    dragRef.current = null;
  };

  /* ------------------------------- rendering ------------------------------- */

  // Compute textarea geometry from the overlay bounds (% of canvas).
  const editorStyle = useMemo<React.CSSProperties | null>(() => {
    if (!editing || !editingBounds) return null;
    const { x, y, width, height } = editingBounds;
    return {
      position: "absolute",
      left: `${(x / CANVAS_WIDTH) * 100}%`,
      top: `${(y / CANVAS_HEIGHT) * 100}%`,
      // Slight min so an empty node is still clickable / typeable.
      width: `${Math.max((width / CANVAS_WIDTH) * 100, 1)}%`,
      minHeight: `${Math.max((height / CANVAS_HEIGHT) * 100, 2)}%`,
      height: "auto",
      fontFamily: drawStyle.fontFamily,
      fontSize: `${(drawStyle.fontSize / CANVAS_HEIGHT) * 100 * 10}px`, // see note below
      lineHeight: 1.2,
      color: drawStyle.color,
      background: "transparent",
      border: "1px dashed #2f6fb5",
      outline: "none",
      padding: 0,
      margin: 0,
      resize: "none",
      overflow: "hidden",
      whiteSpace: "pre-wrap",
      caretColor: drawStyle.color,
      zIndex: 30,
      pointerEvents: "auto",
    };
  }, [editing, editingBounds, drawStyle]);

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
          aria-label="Edit overlay text"
          spellCheck={false}
          onChange={(event) =>
            setEditing((prev) =>
              prev ? { ...prev, value: event.target.value } : prev,
            )
          }
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onBlur={(event) => {
            // Read from the element, not `editing.value`, to avoid stale state.
            commitEditing(event.target.value);
          }}
          onKeyDown={(event) => {
            // Enter = newline; Cmd/Ctrl+Enter or Escape are handled globally.
            // Tab is intentionally allowed to move focus.
            if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
              // default behavior inserts newline — good.
            }
          }}
        />
      )}
    </div>
  );
};
