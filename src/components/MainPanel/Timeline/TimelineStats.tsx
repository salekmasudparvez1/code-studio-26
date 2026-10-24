import React from "react";

interface TimelineStatsProps {
  currentFrame: number;
  visibleChars: number;
  totalChars: number;
  totalDuration: number;
}

export const TimelineStats: React.FC<TimelineStatsProps> = ({
  currentFrame,
  visibleChars,
  totalChars,
  totalDuration,
}) => {
  return (
    <div className="stats-bar">
      <div>
        Frame: <span className="stat-highlight">{currentFrame}</span>
      </div>
      <div>
        Characters:{" "}
        <span className="stat-highlight">
          {visibleChars} / {totalChars}
        </span>
      </div>
      <div>
        Duration:{" "}
        <span className="stat-highlight">{totalDuration.toFixed(1)}s</span>
      </div>
    </div>
  );
};
