import React from "react";
import { Film } from "lucide-react";
import { TimeDisplay } from "./TimeDisplay";
import { ScrubBar } from "./ScrubBar";
import { TimelineStats } from "./TimelineStats";

interface TimelineProps {
  currentTime: number;
  totalDuration: number;
  currentFrame: number;
  visibleChars: number;
  totalChars: number;
  onSeek: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  totalDuration,
  currentFrame,
  visibleChars,
  totalChars,
  onSeek,
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

      <TimelineStats
        currentFrame={currentFrame}
        visibleChars={visibleChars}
        totalChars={totalChars}
        totalDuration={totalDuration}
      />
    </div>
  );
};
