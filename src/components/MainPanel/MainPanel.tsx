import React from 'react';
import { Cell } from '../../types/cell';
import { CanvasStage } from './CanvasStage/CanvasStage';
import { Timeline } from './Timeline/Timeline';

interface MainPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cells: Cell[];
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
}

export const MainPanel: React.FC<MainPanelProps> = ({
  canvasRef,
  cells,
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
}) => {
  return (
    <main className="main-panel">
      <CanvasStage
        canvasRef={canvasRef}
        cells={cells}
        currentTime={currentTime}
        fps={fps}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onReset={onReset}
        onSeek={onSeek}
        onStep={onStep}
      />

      <Timeline
        currentTime={currentTime}
        totalDuration={totalDuration}
        currentFrame={currentFrame}
        visibleChars={visibleChars}
        totalChars={totalChars}
        onSeek={onSeek}
      />
    </main>
  );
};
