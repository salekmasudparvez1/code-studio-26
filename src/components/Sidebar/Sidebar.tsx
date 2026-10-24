import React from 'react';
import { Cell, CellType, GraphType } from '../../types/cell';
import { FpsOption } from '../../types/animation';
import { CellList } from './ProjectCells/CellList';
import { CellInspector } from './Inspector/CellInspector';
import { GlobalSettings } from './GlobalSettings/GlobalSettings';
import { QuickStats } from './QuickStats/QuickStats';
import { ExportFormat, ExportResolution } from '../../hooks/useMediaRecorder';

interface SidebarProps {
  cells: Cell[];
  activeCellId: string | null;
  activeCell: Cell | null;
  speed: number;
  fps: FpsOption;
  isPlaying: boolean;
  isRecording: boolean;
  totalDuration: number;
  currentFrame: number;
  totalChars: number;
  onSelectCell: (id: string, jumpToStart?: boolean) => void;
  onAddCell: (type: CellType, graphType?: GraphType) => void;
  onUpdateCell: (id: string, updates: Partial<Cell>) => void;
  onMoveCell: (id: string, direction: "up" | "down") => void;
  onDeleteCell: (id: string) => void;
  onImportCells: (cells: Cell[]) => void;
  onSpeedChange: (speed: number) => void;
  onFpsChange: (fps: FpsOption) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  isRecordingPaused: boolean;
  onToggleRecordPause: () => void;
  onAutoExport: (settings: { format: ExportFormat; resolution: ExportResolution; fps: number }) => void;
  exportFormat: ExportFormat;
  exportResolution: ExportResolution;
  exportFps: number;
  onExportFormatChange: (format: ExportFormat) => void;
  onExportResolutionChange: (resolution: ExportResolution) => void;
  onExportFpsChange: (fps: number) => void;
  isAutoExporting: boolean;
  exportProgress: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  cells,
  activeCellId,
  activeCell,
  speed,
  fps,
  isPlaying,
  isRecording,
  totalDuration,
  currentFrame,
  totalChars,
  onSelectCell,
  onAddCell,
  onUpdateCell,
  onMoveCell,
  onDeleteCell,
  onImportCells,
  onSpeedChange,
  onFpsChange,
  onTogglePlay,
  onReset,
  onStartRecord,
  onStopRecord,
  isRecordingPaused,
  onToggleRecordPause,
  onAutoExport,
  exportFormat,
  exportResolution,
  exportFps,
  onExportFormatChange,
  onExportResolutionChange,
  onExportFpsChange,
  isAutoExporting,
  exportProgress,
}) => {
  return (
    <aside className="sidebar">
      <CellList
        cells={cells}
        activeCellId={activeCellId}
        onSelectCell={onSelectCell}
        onAddCell={onAddCell}
        onMoveCell={onMoveCell}
        onDeleteCell={onDeleteCell}
        onImportCells={onImportCells}
      />

      <CellInspector activeCell={activeCell} onUpdateCell={onUpdateCell} />

      <GlobalSettings
        speed={speed}
        fps={fps}
        isPlaying={isPlaying}
        isRecording={isRecording}
        onSpeedChange={onSpeedChange}
        onFpsChange={onFpsChange}
        onTogglePlay={onTogglePlay}
        onReset={onReset}
        onStartRecord={onStartRecord}
        onStopRecord={onStopRecord}
        isRecordingPaused={isRecordingPaused}
        onToggleRecordPause={onToggleRecordPause}
        onAutoExport={onAutoExport}
        exportFormat={exportFormat}
        exportResolution={exportResolution}
        exportFps={exportFps}
        onExportFormatChange={onExportFormatChange}
        onExportResolutionChange={onExportResolutionChange}
        onExportFpsChange={onExportFpsChange}
        isAutoExporting={isAutoExporting}
        exportProgress={exportProgress}
      />

      <QuickStats
        totalDuration={totalDuration}
        currentFrame={currentFrame}
        cellCount={cells.length}
        charCount={totalChars}
      />
    </aside>
  );
};
