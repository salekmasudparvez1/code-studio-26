import React from "react";
import { Film } from "lucide-react";
import { Overlay } from "../../../types/overlay";
import { TimeDisplay } from "./TimeDisplay";
import { ScrubBar } from "./ScrubBar";
import { TimelineStats } from "./TimelineStats";
import { OverlayTracks } from "./OverlayTracks";

interface TimelineProps {
  currentTime: number;
  totalDuration: number;
  currentFrame: number;
  visibleChars: number;
  totalChars: number;
  overlays: Overlay[];
  selectedOverlayId: string | null;
  onSeek: (time: number) => void;
  onSelectOverlay: (id: string | null) => void;
  onOverlayTimingChange: (id: string, startTime: number, endTime: number, commit?: boolean) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  totalDuration,
  currentFrame,
  visibleChars,
  totalChars,
  overlays,
  selectedOverlayId,
  onSeek,
  onSelectOverlay,
  onOverlayTimingChange,
}) => {
  return (
    <div className="timeline-wrap">
      <div className="timeline-header">
        <div className="timeline-title-row">
          <Film size={14} className="timeline-icon" />
          <h3>Timeline</h3>
        </div>
        <TimeDisplay currentTime={currentTime} totalDuration={totalDuration} />
      </div>

      <ScrubBar
        currentTime={currentTime}
        totalDuration={totalDuration}
        onSeek={onSeek}
      />

      <OverlayTracks
        overlays={overlays}
        selectedId={selectedOverlayId}
        currentTime={currentTime}
        totalDuration={totalDuration}
        onSelect={onSelectOverlay}
        onChangeTiming={onOverlayTimingChange}
      />

      <TimelineStats
        currentFrame={currentFrame}
        visibleChars={visibleChars}
        totalChars={totalChars}
        totalDuration={totalDuration}
      />
    </div>
  );
};
