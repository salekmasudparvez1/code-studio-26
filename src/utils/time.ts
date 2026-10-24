/**
 * Formats time in seconds to mm:ss.s format
 * e.g., 65.4 -> "01:05.4"
 */
export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const m = Math.floor(safeSeconds / 60);
  const s = (safeSeconds % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
}
