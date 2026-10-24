import React from "react";

interface QuickStatsProps {
  totalDuration: number;
  currentFrame: number;
  cellCount: number;
  charCount: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  totalDuration,
  currentFrame,
  cellCount,
  charCount,
}) => {
  return (
    <div className="stat-grid">
      <div className="stat-label">Total duration</div>
      <span className="stat-value">{totalDuration.toFixed(1)}s</span>

      <div className="stat-label">Current frame</div>
      <span className="stat-value">{currentFrame}</span>

      <div className="stat-label">Cells</div>
      <span className="stat-value">{cellCount}</span>

      <div className="stat-label">Characters</div>
      <span className="stat-value">{charCount}</span>
    </div>
  );
};
