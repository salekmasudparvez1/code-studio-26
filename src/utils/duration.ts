import { Cell, CodeCell, GraphCell } from '../types/cell';
import { TimelineEntry, CellAtTimeResult } from '../types/animation';
import { clamp } from './math';

export function getCodeDuration(cell: CodeCell): number {
  const charCount = (cell.source || '').length;
  return charCount / Math.max(1, cell.speed || 18);
}

export function getGraphDuration(cell: GraphCell): number {
  let baseDuration = 4.0;

  if (cell.graphType === 'bar') {
    const barCount = (cell.data || []).length || 7;
    baseDuration = barCount * 0.6;
  } else if (cell.graphType === 'decision-boundary') {
    baseDuration = 4.5;
  } else if (cell.graphType === 'ann' || cell.graphType === 'neural-network') {
    baseDuration = 5.0;
  } else if (cell.graphType === 'cnn') {
    baseDuration = 5.2;
  } else if (cell.graphType === 'rnn') {
    baseDuration = 4.8;
  } else if (cell.graphType === 'lstm') {
    baseDuration = 5.4;
  } else if (cell.graphType === 'yolo') {
    baseDuration = 5.0;
  } else if (cell.graphType === 'matplotlib') {
    baseDuration = 4.6;
  } else if (cell.graphType === 'clustering') {
    baseDuration = 4.8;
  } else if (cell.graphType === 'gradient-descent') {
    baseDuration = 5.2;
  }

  return baseDuration / Math.max(0.2, cell.speed || 1.2);
}

export function getCellDuration(cell: Cell): number {
  if (cell.type === 'code') {
    return getCodeDuration(cell) + (cell.pause || 0);
  }
  if (cell.type === 'graph') {
    return getGraphDuration(cell) + (cell.pause || 0);
  }
  if (cell.type === 'delay') {
    return cell.seconds || 0;
  }
  return 0;
}

export function getTotalDuration(cells: Cell[]): number {
  return cells.reduce((sum, cell) => sum + getCellDuration(cell), 0);
}

export function getTimelineMap(cells: Cell[]): TimelineEntry[] {
  let currentTime = 0;
  return cells.map((cell) => {
    const duration = getCellDuration(cell);
    const entry: TimelineEntry = {
      cell,
      start: currentTime,
      end: currentTime + duration,
      duration,
    };
    currentTime += duration;
    return entry;
  });
}

export function getCellAtTime(cells: Cell[], globalTime: number): CellAtTimeResult | null {
  if (cells.length === 0) return null;
  const timeline = getTimelineMap(cells);
  const total = getTotalDuration(cells);
  const clampedTime = clamp(globalTime, 0, Math.max(0.001, total));

  for (let i = 0; i < timeline.length; i++) {
    const entry = timeline[i];
    if (clampedTime < entry.end || i === timeline.length - 1) {
      const localTime = clamp(clampedTime - entry.start, 0, entry.duration);
      return { cell: entry.cell, localTime, index: i, entry };
    }
  }

  return {
    cell: cells[0],
    localTime: 0,
    index: 0,
    entry: timeline[0],
  };
}

export function getVisibleCharCount(cells: Cell[], globalTime: number): number {
  let count = 0;
  const timeline = getTimelineMap(cells);
  for (const entry of timeline) {
    if (entry.cell.type === 'code') {
      const codeCell = entry.cell;
      const localTime = clamp(globalTime - entry.start, 0, entry.duration);
      const speed = codeCell.speed || 18;
      const typeDur = (codeCell.source || '').length / Math.max(1, speed);
      if (localTime <= typeDur) {
        count += Math.floor(localTime * speed);
      } else {
        count += (codeCell.source || '').length;
      }
    }
  }
  return count;
}

export function getTotalCharCount(cells: Cell[]): number {
  return cells.reduce((sum, c) => (c.type === 'code' ? sum + (c.source || '').length : sum), 0);
}
