import React from "react";
import { Sliders } from "lucide-react";
import { FpsOption } from "../../../types/animation";
import { SectionTitle } from "../../common/SectionTitle";
import { Card } from "../../common/Card";
import { Slider } from "../../common/Slider";
import { Select } from "../../common/Select";
import { PlaybackControls } from "./PlaybackControls";
import { ExportNotice } from "./ExportNotice";
import { ExportFormat, ExportResolution } from "../../../hooks/useMediaRecorder";

interface GlobalSettingsProps {
  speed: number;
  fps: FpsOption;
  isPlaying: boolean;
  isRecording: boolean;
  onSpeedChange: (speed: number) => void;
  onFpsChange: (fps: FpsOption) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  isRecordingPaused: boolean;
  onToggleRecordPause: () => void;
  onAutoExport: (settings: { format: ExportFormat; resolution: ExportResolution; fps: number }) => void;
  isAutoExporting: boolean;
  exportProgress: number;
  exportFormat: ExportFormat;
  exportResolution: ExportResolution;
  exportFps: number;
  onExportFormatChange: (format: ExportFormat) => void;
  onExportResolutionChange: (resolution: ExportResolution) => void;
  onExportFpsChange: (fps: number) => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => Promise<void>;
  projectError: string | null;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({
  speed,
  fps,
  isPlaying,
  isRecording,
  onSpeedChange,
  onFpsChange,
  onTogglePlay,
  onReset,
  onStartRecord,
  onStopRecord,
  isRecordingPaused,
  onToggleRecordPause,
  onAutoExport,
  isAutoExporting,
  exportProgress,
  exportFormat,
  exportResolution,
  exportFps,
  onExportFormatChange,
  onExportResolutionChange,
  onExportFpsChange,
  onSaveProject,
  onLoadProject,
  projectError,
}) => {
  return (
    <div className="sidebar-section">
      <SectionTitle icon={<Sliders size={14} />} title="Global Controls" />

      <Card>
        <Slider
          label="Default typing speed (char/sec)"
          min={3}
          max={60}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          valueDisplay={<span>{speed} char/s</span>}
        />

        <Select
          label="Recording frame rate"
          value={fps}
          onChange={(e) => onFpsChange(Number(e.target.value) as FpsOption)}
          options={[
            { value: 24, label: "24 FPS (Cinematic)" },
            { value: 30, label: "30 FPS (Standard)" },
            { value: 60, label: "60 FPS (Smooth)" },
          ]}
        />

        <div className="flex-row">
          <Select
            label="Export format"
            value={exportFormat}
            onChange={(e) => onExportFormatChange(e.target.value as ExportFormat)}
            options={[
              { value: "mp4", label: "MP4 Video (.mp4)" },
              { value: "webm", label: "WebM Video (.webm)" },
            ]}
          />
          <Select
            label="Export resolution"
            value={exportResolution}
            onChange={(e) => onExportResolutionChange(e.target.value as ExportResolution)}
            options={[
              { value: "1080p", label: "1080p (Full HD)" },
              { value: "2k", label: "2K (1440p)" },
              { value: "4k", label: "4K (2160p)" },
            ]}
          />
        </div>

        <Select
          label="Export FPS"
          value={exportFps}
          onChange={(e) => onExportFpsChange(Number(e.target.value))}
          options={[
            { value: 24, label: "24 FPS" },
            { value: 30, label: "30 FPS" },
            { value: 60, label: "60 FPS" },
          ]}
        />

        <PlaybackControls
          isPlaying={isPlaying}
          isRecording={isRecording}
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
          isAutoExporting={isAutoExporting}
          exportProgress={exportProgress}
        />

        <ExportNotice />

        <div className="project-file-actions">
          <button type="button" className="btn btn-sm" onClick={onSaveProject}>
            Save Project
          </button>
          <label className="btn btn-sm project-load-button">
            Load Project
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void onLoadProject(file);
              }}
            />
          </label>
        </div>
        {projectError && (
          <div className="notebook-import-error" role="alert">
            {projectError}
          </div>
        )}
      </Card>
    </div>
  );
};
