import { Cell } from './cell';

export interface TimelineEntry {
  cell: Cell;
  start: number;
  end: number;
  duration: number;
}

export interface CellAtTimeResult {
  cell: Cell;
  localTime: number;
  index: number;
  entry: TimelineEntry;
}

export type FpsOption = 24 | 30 | 60;

export interface PlaybackOptions {
  fps: FpsOption;
  globalSpeed: number;
}

export interface AnimationStats {
  totalDuration: number;
  currentFrame: number;
  totalFrames: number;
  cellCount: number;
  visibleChars: number;
  totalChars: number;
}

