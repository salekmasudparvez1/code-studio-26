import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Cell, BoardCell } from "../../../types/cell";
import { getCellAtTime } from "../../../utils/duration";
import {
  Overlay,
  OverlayDrawStyle,
  OverlayPatch,
  OverlayTool,
} from "../../../types/overlay";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../../../constants/defaults";
import { renderCanvasStage } from "../../../utils/canvasRenderer";
import { formatTime } from "../../../utils/time";
import { OverlayToolbar } from "../OverlayEditor/OverlayToolbar";
import { OverlayHitLayer } from "../OverlayEditor/OverlayHitLayer";

interface CanvasStageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cells: Cell[];
  overlays: Overlay[];
  selectedOverlayId: string | null;
  overlayTool: OverlayTool;
  overlayStyle: OverlayDrawStyle;
  canUndoOverlay: boolean;
  canRedoOverlay: boolean;
  overlayError: string | null;
  currentTime: number;
  fps: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSeek: (time: number) => void;
  onStep: (delta: number) => void;
  onOverlayToolChange: (tool: OverlayTool) => void;
  onOverlayStyleChange: (updates: Partial<OverlayDrawStyle>) => void;
  onSelectOverlay: (id: string | null) => void;
  onAddOverlay: (overlay: Overlay) => void;
  onDeleteOverlay: (id: string) => void;
  onLiveOverlayUpdate: (id: string, updates: OverlayPatch) => void;
  onCommitOverlay: () => void;
  onUndoOverlay: () => void;
  onRedoOverlay: () => void;
  onAddBoardCell?: (color?: string) => void;
  onCanvasColorChange?: (color: string) => void;
  onPause?: () => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  canvasRef,
  cells,
  overlays,
  selectedOverlayId,
  overlayTool,
  overlayStyle,
  canUndoOverlay,
  canRedoOverlay,
  overlayError,
  currentTime,
  fps,
  totalDuration,
  isPlaying,
  onTogglePlay,
  onReset,
  onSeek,
  onStep,
  onOverlayToolChange,
  onOverlayStyleChange,
  onSelectOverlay,
  onAddOverlay,
  onDeleteOverlay,
  onLiveOverlayUpdate,
  onCommitOverlay,
  onUndoOverlay,
  onRedoOverlay,
  onAddBoardCell,
  onCanvasColorChange,
  onPause,
}) => {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = canvasRef || internalRef;
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [draftOverlay, setDraftOverlay] = useState<Overlay | null>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentResult = getCellAtTime(cells, currentTime);
  const currentCell = currentResult?.cell ?? null;
  const currentBoard = currentCell?.type === "board" ? (currentCell as BoardCell) : null;

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (isFullscreen && isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2500);
    }
  }, [isFullscreen, isPlaying]);

  useEffect(() => {
    if (!isFullscreen || !isPlaying) {
      setControlsVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    } else {
      resetHideTimer();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isFullscreen, isPlaying, resetHideTimer]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === previewRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else if (isFullscreen) {
        setIsFullscreen(false);
      } else if (previewRef.current?.requestFullscreen) {
        await previewRef.current.requestFullscreen();
      } else {
        setIsFullscreen(true);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingText =
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable ||
        (target?.tagName === "INPUT" &&
          (target as HTMLInputElement).type !== "range");

      if (isEditingText) return;

      if (event.code === "KeyF") {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === "Escape" && isFullscreen) {
        if (!document.fullscreenElement) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const previewOverlays = draftOverlay
      ? [...overlays, draftOverlay]
      : overlays;
    renderCanvasStage(
      canvas,
      cells,
      currentTime,
      fps,
      previewOverlays,
      editingOverlayId ? [editingOverlayId] : null,
    );
  }, [activeCanvasRef, cells, overlays, draftOverlay, currentTime, fps, editingOverlayId]);

  const containerClassName = [
    "preview-container",
    isFullscreen ? "preview-fullscreen preview-fallback-fullscreen" : "",
    isFullscreen && !controlsVisible ? "controls-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={previewRef}
      className={containerClassName}
      onMouseMove={resetHideTimer}
      onMouseEnter={() => setControlsVisible(true)}
    >
      {isFullscreen && (
        <button
          type="button"
          className="preview-fullscreen-close-btn"
          onClick={toggleFullscreen}
          title="Exit fullscreen (Esc / F)"
          aria-label="Exit fullscreen"
        >
          <Minimize2 size={14} />
          <span>Exit Fullscreen</span>
        </button>
      )}

      <OverlayToolbar
        tool={overlayTool}
        drawStyle={overlayStyle}
        canUndo={canUndoOverlay}
        canRedo={canRedoOverlay}
        onToolChange={onOverlayToolChange}
        onStyleChange={onOverlayStyleChange}
        onUndo={onUndoOverlay}
        onRedo={onRedoOverlay}
        canvasColor={currentBoard?.bgColor ?? "#000000"}
        isBoardActive={Boolean(currentBoard)}
        onCanvasColorChange={onCanvasColorChange}
        onAddBoardCell={onAddBoardCell}
      />
      {overlayError && (
        <div className="overlay-error" role="alert">
          {overlayError}
        </div>
      )}

      <div className="preview-stage-wrap">
        <canvas
          ref={activeCanvasRef}
          id="stage"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="Code animation preview"
        />
        <OverlayHitLayer
          canvasRef={activeCanvasRef}
          overlays={overlays}
          selectedId={selectedOverlayId}
          tool={overlayTool}
          drawStyle={overlayStyle}
          currentTime={currentTime}
          totalDuration={totalDuration}
          clipEndTime={currentResult?.entry.end}
          onSelect={onSelectOverlay}
          onAdd={onAddOverlay}
          onDelete={onDeleteOverlay}
          onLiveUpdate={onLiveOverlayUpdate}
          onCommit={onCommitOverlay}
          onDraftChange={setDraftOverlay}
          onToolChange={onOverlayToolChange}
          onEditingChange={setEditingOverlayId}
          onPause={onPause}
        />
      </div>

      <div
        className="preview-player-controls"
        aria-label="Preview video controls"
      >
        <button
          type="button"
          className="preview-ctrl-btn"
          onClick={onTogglePlay}
          title={isPlaying ? "Pause preview (Space)" : "Play preview (Space)"}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          type="button"
          className="preview-ctrl-btn"
          onClick={onReset}
          title="Reset preview (R)"
          aria-label="Reset"
        >
          <RotateCcw size={15} />
        </button>

        <button
          type="button"
          className="preview-ctrl-btn"
          onClick={() => onStep(-1)}
          title="Back 1s (Left Arrow / J, Shift+Left for 5s)"
          aria-label="Step backward 1 second"
        >
          <SkipBack size={15} />
        </button>

        <button
          type="button"
          className="preview-ctrl-btn"
          onClick={() => onStep(1)}
          title="Forward 1s (Right Arrow / L, Shift+Right for 5s)"
          aria-label="Step forward 1 second"
        >
          <SkipForward size={15} />
        </button>

        <input
          type="range"
          className="preview-ctrl-slider"
          min={0}
          max={Math.max(totalDuration, 0.001)}
          step={0.01}
          value={Math.min(currentTime, totalDuration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Preview progress"
        />

        <span className="preview-player-time">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>

        <button
          type="button"
          className="preview-ctrl-btn"
          onClick={toggleFullscreen}
          title={
            isFullscreen
              ? "Exit fullscreen (Esc / F)"
              : "Preview fullscreen (F)"
          }
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
};
