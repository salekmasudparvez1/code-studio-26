import React, { useState, useRef, useCallback, useEffect } from "react";
import { FpsOption } from "../../types/animation";
import { CellType, GraphType } from "../../types/cell";
import { useProjectCells } from "../../hooks/useProjectCells";
import { useAnimationPlayback } from "../../hooks/useAnimationPlayback";
import { useMediaRecorder } from "../../hooks/useMediaRecorder";
import {
  getTotalDuration,
  getTotalCharCount,
  getVisibleCharCount,
  getTimelineMap,
  getCellAtTime,
} from "../../utils/duration";
import { clamp } from "../../utils/math";

import { Sidebar } from "../Sidebar/Sidebar";
import { MainPanel } from "../MainPanel/MainPanel";
import {
  ExportFormat,
  ExportResolution,
  ExportSettings,
} from "../../hooks/useMediaRecorder";

export const StudioWorkspace: React.FC = () => {
  const [speed, setSpeed] = useState<number>(18);
  const [fps, setFps] = useState<FpsOption>(30);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("mp4");
  const [exportResolution, setExportResolution] =
    useState<ExportResolution>("1080p");
  const [exportFps, setExportFps] = useState(30);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Project cells state
  const {
    cells,
    activeCellId,
    activeCell,
    setActiveCellId,
    addCell,
    updateCell,
    moveCell,
    deleteCell,
    importCells,
  } = useProjectCells();

  // Calculated animation metrics
  const totalDuration = getTotalDuration(cells);
  const totalChars = getTotalCharCount(cells);

  // Playback hook
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    reset,
    seek,
    step,
    pause,
  } = useAnimationPlayback({ totalDuration });

  // Media recorder hook
  const {
    isRecording,
    isPaused: isRecordingPaused,
    startRecording,
    stopRecording,
    togglePause: toggleRecordPause,
    autoExport,
    isAutoExporting,
    exportProgress,
  } = useMediaRecorder({
    canvasRef,
    cells,
    totalDuration,
    fps,
    onTimeUpdate: setCurrentTime,
    onRecordingStateChange: (recording) => {
      if (recording) {
        pause();
      }
    },
  });

  // Handler for selecting a cell from the layers sidebar and instantly previewing it on the canvas
  const handleSelectCell = useCallback(
    (cellId: string, jumpToStart = false) => {
      setActiveCellId(cellId);
      const timeline = getTimelineMap(cells);
      const entry = timeline.find((e) => e.cell.id === cellId);
      if (entry) {
        pause();
        let offset = 0;
        if (!jumpToStart) {
          if (entry.cell.type === "code") {
            offset = Math.min(
              entry.duration * 0.7,
              Math.max(0.1, entry.duration - 0.05),
            );
          } else if (entry.cell.type === "graph") {
            offset = Math.min(
              entry.duration * 0.5,
              Math.max(0.1, entry.duration - 0.05),
            );
          } else {
            offset = Math.min(entry.duration * 0.5, 0.5);
          }
        }
        const targetTime = clamp(
          entry.start + offset,
          0,
          Math.max(0.001, totalDuration),
        );
        seek(targetTime);
      }
    },
    [cells, totalDuration, pause, seek, setActiveCellId],
  );

  // Handler for adding a cell and immediately navigating the preview to it
  const handleAddCell = useCallback(
    (type: CellType, graphType?: GraphType) => {
      const newCell = addCell(type, graphType);
      if (newCell) {
        const updatedCells = [...cells, newCell];
        const timeline = getTimelineMap(updatedCells);
        const entry = timeline.find((e) => e.cell.id === newCell.id);
        if (entry) {
          pause();
          const offset =
            entry.cell.type === "code"
              ? Math.min(
                  entry.duration * 0.7,
                  Math.max(0.1, entry.duration - 0.05),
                )
              : Math.min(
                  entry.duration * 0.5,
                  Math.max(0.1, entry.duration - 0.05),
                );
          seek(entry.start + offset);
        }
      }
    },
    [addCell, cells, pause, seek],
  );

  // Keep activeCellId synchronized with timeline scrubbing and playback
  useEffect(() => {
    const currentResult = getCellAtTime(cells, currentTime);
    if (currentResult && currentResult.cell.id !== activeCellId) {
      setActiveCellId(currentResult.cell.id);
    }
  }, [currentTime, cells, activeCellId, setActiveCellId]);

  const currentFrame = Math.floor(currentTime * fps);
  const visibleChars = getVisibleCharCount(cells, currentTime);

  return (
    <div className="app-container">
      {/* <Header /> */}
      <div className="app-workspace">
        <Sidebar
          cells={cells}
          activeCellId={activeCellId}
          activeCell={activeCell}
          speed={speed}
          fps={fps}
          isPlaying={isPlaying}
          isRecording={isRecording}
          totalDuration={totalDuration}
          currentFrame={currentFrame}
          totalChars={totalChars}
          onSelectCell={handleSelectCell}
          onAddCell={handleAddCell}
          onUpdateCell={updateCell}
          onMoveCell={moveCell}
          onDeleteCell={deleteCell}
          onImportCells={(importedCells) => {
            importCells(importedCells);
            reset();
          }}
          onSpeedChange={setSpeed}
          onFpsChange={setFps}
          onTogglePlay={togglePlay}
          onReset={reset}
          onStartRecord={() =>
            startRecording(true, {
              format: exportFormat,
              resolution: exportResolution,
              fps: exportFps,
            })
          }
          onStopRecord={stopRecording}
          isRecordingPaused={isRecordingPaused}
          onToggleRecordPause={toggleRecordPause}
          onAutoExport={(settings: ExportSettings) => autoExport(settings)}
          exportFormat={exportFormat}
          exportResolution={exportResolution}
          exportFps={exportFps}
          onExportFormatChange={setExportFormat}
          onExportResolutionChange={setExportResolution}
          onExportFpsChange={setExportFps}
          isAutoExporting={isAutoExporting}
          exportProgress={exportProgress}
        />

        <MainPanel
          canvasRef={canvasRef}
          cells={cells}
          currentTime={currentTime}
          totalDuration={totalDuration}
          currentFrame={currentFrame}
          visibleChars={visibleChars}
          totalChars={totalChars}
          fps={fps}
          onSeek={seek}
          onStep={step}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onReset={reset}
        />
      </div>
    </div>
  );
};
