import React from "react";
import { Play, Pause, RotateCcw, Video, Square } from "lucide-react";
import { Button } from "../../common/Button";
import { ExportFormat, ExportResolution } from "../../../hooks/useMediaRecorder";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
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
  isAutoExporting: boolean;
  exportProgress: number;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isRecording,
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
  isAutoExporting,
  exportProgress,
}) => {
  return (
    <div className="controls-row">
      <Button
        variant="primary"
        onClick={isRecording ? onToggleRecordPause : onTogglePlay}
        icon={isPlaying ? <Pause size={15} /> : <Play size={15} />}
      >
        {isRecording ? (isRecordingPaused ? "Resume" : "Pause") : isPlaying ? "Pause" : "Play"}
      </Button>

      <Button
        variant="secondary"
        disabled={isRecording}
        onClick={onReset}
        icon={<RotateCcw size={15} />}
      >
        Reset
      </Button>

      <Button
        variant={isRecording ? "danger" : "secondary"}
        onClick={isRecording ? onStopRecord : onStartRecord}
        icon={isRecording ? <Square size={14} /> : <Video size={15} />}
        title={
          isRecording
            ? "Stop and save the recording"
            : "Save the complete animation as one video"
        }
      >
        {isRecording ? "Stop & Save" : "Save All"}
      </Button>
      {!isRecording && !isAutoExporting && (
        <Button
          variant="secondary"
          onClick={() => onAutoExport({ format: exportFormat, resolution: exportResolution, fps: exportFps })}
          title="Render and save all frames without animating the visible preview"
        >
          Auto Export
        </Button>
      )}
      {isAutoExporting && (
        <div className="export-progress" role="status" aria-live="polite">
          <div className="export-progress-label">
            <span>Exporting…</span>
            <span>{exportProgress}%</span>
          </div>
          <div className="export-progress-track">
            <div className="export-progress-fill" style={{ width: `${exportProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};
