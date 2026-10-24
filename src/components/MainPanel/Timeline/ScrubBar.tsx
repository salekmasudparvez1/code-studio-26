import React from "react";

interface ScrubBarProps {
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
}

export const ScrubBar: React.FC<ScrubBarProps> = ({
  currentTime,
  totalDuration,
  onSeek,
}) => {
  const scrubValue =
    totalDuration > 0 ? Math.round((currentTime / totalDuration) * 1000) : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fraction = Number(e.target.value) / 1000;
    onSeek(fraction * totalDuration);
  };

  return (
    <input
      type="range"
      className="scrub"
      min={0}
      max={1000}
      value={scrubValue}
      onChange={handleChange}
      aria-label="Timeline scrubber"
    />
  );
};
