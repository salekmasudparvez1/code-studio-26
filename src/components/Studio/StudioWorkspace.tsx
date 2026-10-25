import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { FpsOption } from "../../types/animation";
import { CellType, GraphType } from "../../types/cell";
import { OverlayPatch } from "../../types/overlay";
import { useProjectCells } from "../../hooks/useProjectCells";
import { useAnimationPlayback } from "../../hooks/useAnimationPlayback";
import { useMediaRecorder } from "../../hooks/useMediaRecorder";
import { useOverlays } from "../../hooks/useOverlays";
import {
  getTotalDuration,
  getTotalCharCount,
  getVisibleCharCount,
  getTimelineMap,
  getCellAtTime,
} from "../../utils/duration";
import { clamp } from "../../utils/math";
import { reorderOverlays } from "../../utils/overlays";
import {
  parseProject,
  readStoredProject,
  serializeProject,
  writeStoredProject,
} from "../../utils/projectFile";

import { Sidebar } from "../Sidebar/Sidebar";
import { MainPanel } from "../MainPanel/MainPanel";
import {
  ExportFormat,
  ExportResolution,
  ExportSettings,
} from "../../hooks/useMediaRecorder";

const storedProject =
  typeof window !== "undefined" ? readStoredProject() : null;

export const StudioWorkspace: React.FC = () => {
  const [speed, setSpeed] = useState<number>(
    storedProject?.settings.speed ?? 18,
  );
  const [fps, setFps] = useState<FpsOption>(storedProject?.settings.fps ?? 30);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(
    storedProject?.settings.exportFormat ?? "mp4",
  );
  const [exportResolution, setExportResolution] = useState<ExportResolution>(
    storedProject?.settings.exportResolution ?? "1080p",
  );
  const [exportFps, setExportFps] = useState(
    storedProject?.settings.exportFps ?? 30,
  );
  const [projectError, setProjectError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    cells,
    setCells,
    activeCellId,
    activeCell,
    setActiveCellId,
    addCell,
    updateCell,
    moveCell,
    deleteCell,
    importCells,
  } = useProjectCells(storedProject?.cells);

  const {
    overlays,
    selectedId,
    selectedOverlay,
    tool,
    drawStyle,
    error: overlayError,
    canUndo,
    canRedo,
    setTool,
    setDrawStyle,
    setSelectedId,
    addOverlay,
    updateOverlay,
    updateOverlayLive,
    commitCurrent,
    deleteOverlay,
    replaceAll,
    undo,
    redo,
  } = useOverlays(storedProject?.overlays ?? []);

  const totalDuration = getTotalDuration(cells);
  const totalChars = getTotalCharCount(cells);

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
    overlays,
    totalDuration,
    fps,
    onTimeUpdate: setCurrentTime,
    onRecordingStateChange: (recording) => {
      if (recording) {
        pause();
      }
    },
  });

  const projectSnapshot = useMemo(
    () => ({
      cells,
      overlays,
      settings: {
        speed,
        fps,
        exportFormat,
        exportResolution,
        exportFps,
      },
    }),
    [cells, overlays, speed, fps, exportFormat, exportResolution, exportFps],
  );

  useEffect(() => {
    writeStoredProject(projectSnapshot);
  }, [projectSnapshot]);

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

  useEffect(() => {
    const currentResult = getCellAtTime(cells, currentTime);
    if (currentResult && currentResult.cell.id !== activeCellId) {
      setActiveCellId(currentResult.cell.id);
    }
  }, [currentTime, cells, activeCellId, setActiveCellId]);

  const handleOverlayTiming = useCallback(
    (id: string, startTime: number, endTime: number, commit = true) => {
      const patch: OverlayPatch = { startTime, endTime };
      if (commit) updateOverlay(id, patch);
      else updateOverlayLive(id, patch);
    },
    [updateOverlay, updateOverlayLive],
  );

  const handleReorderOverlays = useCallback(
    (fromId: string, toId: string) => {
      replaceAll(reorderOverlays(overlays, fromId, toId));
    },
    [overlays, replaceAll],
  );

  const handleSaveProject = useCallback(() => {
    try {
      const blob = new Blob([serializeProject(projectSnapshot)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "code-studio-project.json";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setProjectError(null);
    } catch (error) {
      setProjectError(
        error instanceof Error
          ? error.message
          : "Unable to save the project file.",
      );
    }
  }, [projectSnapshot]);

  const handleLoadProject = useCallback(
    async (file: File) => {
      try {
        const project = parseProject(await file.text());
        setCells(project.cells);
        setActiveCellId(project.cells[0]?.id ?? null);
        replaceAll(project.overlays, false);
        setSpeed(project.settings.speed);
        setFps(project.settings.fps);
        setExportFormat(project.settings.exportFormat);
        setExportResolution(project.settings.exportResolution);
        setExportFps(project.settings.exportFps);
        setProjectError(null);
        reset();
      } catch (error) {
        setProjectError(
          error instanceof Error
            ? error.message
            : "Unable to load the project file.",
        );
      }
    },
    [replaceAll, reset, setActiveCellId, setCells],
  );

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

      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteOverlay(selectedId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteOverlay, redo, selectedId, undo]);

  const currentFrame = Math.floor(currentTime * fps);
  const visibleChars = getVisibleCharCount(cells, currentTime);

  return (
    <div className="app-container">
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
          overlays={overlays}
          selectedOverlayId={selectedId}
          selectedOverlay={selectedOverlay}
          onSelectOverlay={setSelectedId}
          onUpdateOverlay={updateOverlay}
          onDeleteOverlay={deleteOverlay}
          onReorderOverlays={handleReorderOverlays}
          onSaveProject={handleSaveProject}
          onLoadProject={handleLoadProject}
          projectError={projectError}
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
          overlays={overlays}
          selectedOverlayId={selectedId}
          overlayTool={tool}
          overlayStyle={drawStyle}
          canUndoOverlay={canUndo}
          canRedoOverlay={canRedo}
          overlayError={overlayError}
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
          onOverlayToolChange={setTool}
          onOverlayStyleChange={(updates) =>
            setDrawStyle((current) => ({ ...current, ...updates }))
          }
          onSelectOverlay={setSelectedId}
          onAddOverlay={addOverlay}
          onDeleteOverlay={deleteOverlay}
          onLiveOverlayUpdate={updateOverlayLive}
          onCommitOverlay={commitCurrent}
          onUndoOverlay={undo}
          onRedoOverlay={redo}
          onOverlayTimingChange={handleOverlayTiming}
        />
      </div>
    </div>
  );
};
