import { useCallback, useRef, useState } from 'react';
import {
  DEFAULT_OVERLAY_STYLE,
  Overlay,
  OverlayDrawStyle,
  OverlayPatch,
  OverlayTool,
} from '../types/overlay';

const HISTORY_LIMIT = 80;

export function useOverlays(initialOverlays: Overlay[] = []) {
  const [overlays, setOverlays] = useState<Overlay[]>(initialOverlays);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<OverlayTool>('select');
  const [drawStyle, setDrawStyle] = useState<OverlayDrawStyle>(DEFAULT_OVERLAY_STYLE);
  const [error, setError] = useState<string | null>(null);

  const historyRef = useRef<Overlay[][]>([initialOverlays]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const historyIndexRef = useRef(0);
  historyIndexRef.current = historyIndex;

  const commit = useCallback((next: Overlay[]) => {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(next);
    if (trimmed.length > HISTORY_LIMIT) trimmed.shift();
    historyRef.current = trimmed;
    const nextIndex = trimmed.length - 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setOverlays(next);
    setError(null);
  }, []);

  const replaceAll = useCallback((next: Overlay[], recordHistory = true) => {
    if (recordHistory) {
      commit(next);
    } else {
      historyRef.current = [next];
      historyIndexRef.current = 0;
      setHistoryIndex(0);
      setOverlays(next);
    }
    if (!next.some((item) => item.id === selectedId)) {
      setSelectedId(next[0]?.id ?? null);
    }
  }, [commit, selectedId]);

  const addOverlay = useCallback((overlay: Overlay) => {
    commit([...overlaysRef.current, overlay]);
    setSelectedId(overlay.id);
  }, [commit]);

  const updateOverlay = useCallback((id: string, updates: OverlayPatch) => {
    commit(
      overlaysRef.current.map((overlay) =>
        overlay.id === id ? ({ ...overlay, ...updates } as Overlay) : overlay
      )
    );
  }, [commit]);

  const updateOverlayLive = useCallback((id: string, updates: OverlayPatch) => {
    setOverlays((prev) =>
      prev.map((overlay) => (overlay.id === id ? ({ ...overlay, ...updates } as Overlay) : overlay))
    );
  }, []);

  const commitCurrent = useCallback(() => {
    commit(overlaysRef.current);
  }, [commit]);

  const deleteOverlay = useCallback((id: string) => {
    const next = overlaysRef.current.filter((overlay) => overlay.id !== id);
    commit(next);
    setSelectedId((current) => (current === id ? next[next.length - 1]?.id ?? null : current));
  }, [commit]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setOverlays(historyRef.current[nextIndex]);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    setOverlays(historyRef.current[nextIndex]);
  }, []);

  const selectedOverlay = overlays.find((overlay) => overlay.id === selectedId) || null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  return {
    overlays,
    selectedId,
    selectedOverlay,
    tool,
    drawStyle,
    error,
    canUndo,
    canRedo,
    setTool,
    setDrawStyle,
    setSelectedId,
    setError,
    addOverlay,
    updateOverlay,
    updateOverlayLive,
    commitCurrent,
    deleteOverlay,
    replaceAll,
    undo,
    redo,
  };
}
