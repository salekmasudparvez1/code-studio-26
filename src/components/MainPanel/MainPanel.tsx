import React from 'react';
import { Cell } from '../../types/cell';
import { Overlay, OverlayDrawStyle, OverlayPatch, OverlayTool } from '../../types/overlay';
import { CanvasStage } from './CanvasStage/CanvasStage';
import { Timeline } from './Timeline/Timeline';

interface MainPanelProps {
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
  totalDuration: number;
  currentFrame: number;
  visibleChars: number;
  totalChars: number;
  fps: number;
  onSeek: (time: number) => void;
  onStep: (delta: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onOverlayToolChange: (tool: OverlayTool) => void;
  onOverlayStyleChange: (updates: Partial<OverlayDrawStyle>) => void;
  onSelectOverlay: (id: string | null) => void;
  onAddOverlay: (overlay: Overlay) => void;
  onDeleteOverlay: (id: string) => void;
  onLiveOverlayUpdate: (id: string, updates: OverlayPatch) => void;
  onCommitOverlay: () => void;
  onUndoOverlay: () => void;
  onRedoOverlay: () => void;
  onOverlayTimingChange: (id: string, startTime: number, endTime: number, commit?: boolean) => void;
}

export const MainPanel: React.FC<MainPanelProps> = ({
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
  totalDuration,
  currentFrame,
  visibleChars,
  totalChars,
  fps,
  onSeek,
  onStep,
  isPlaying,
  onTogglePlay,
  onReset,
  onOverlayToolChange,
  onOverlayStyleChange,
  onSelectOverlay,
  onAddOverlay,
  onDeleteOverlay,
  onLiveOverlayUpdate,
  onCommitOverlay,
  onUndoOverlay,
  onRedoOverlay,
  onOverlayTimingChange,
}) => {
  return (
    <main className="main-panel">
      <CanvasStage
        canvasRef={canvasRef}
        cells={cells}
        overlays={overlays}
        selectedOverlayId={selectedOverlayId}
        overlayTool={overlayTool}
        overlayStyle={overlayStyle}
        canUndoOverlay={canUndoOverlay}
        canRedoOverlay={canRedoOverlay}
        overlayError={overlayError}
        currentTime={currentTime}
        fps={fps}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onReset={onReset}
        onSeek={onSeek}
        onStep={onStep}
        onOverlayToolChange={onOverlayToolChange}
        onOverlayStyleChange={onOverlayStyleChange}
        onSelectOverlay={onSelectOverlay}
        onAddOverlay={onAddOverlay}
        onDeleteOverlay={onDeleteOverlay}
        onLiveOverlayUpdate={onLiveOverlayUpdate}
        onCommitOverlay={onCommitOverlay}
        onUndoOverlay={onUndoOverlay}
        onRedoOverlay={onRedoOverlay}
      />

      <Timeline
        currentTime={currentTime}
        totalDuration={totalDuration}
        currentFrame={currentFrame}
        visibleChars={visibleChars}
        totalChars={totalChars}
        overlays={overlays}
        selectedOverlayId={selectedOverlayId}
        onSeek={onSeek}
        onSelectOverlay={onSelectOverlay}
        onOverlayTimingChange={onOverlayTimingChange}
      />
    </main>
  );
};
