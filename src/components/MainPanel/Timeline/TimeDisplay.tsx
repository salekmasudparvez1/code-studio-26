import React from "react";
import { formatTime } from "../../../utils/time";

interface TimeDisplayProps {
  currentTime: number;
  totalDuration: number;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  totalDuration,
}) => {
  return (
    <div className="time-display">
      {formatTime(currentTime)} / {formatTime(totalDuration)}
    </div>
  );
};
