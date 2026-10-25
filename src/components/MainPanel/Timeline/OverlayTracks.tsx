import React, { useRef } from 'react';
import { Overlay } from '../../../types/overlay';
import { labelForKind, sortOverlaysByZ } from '../../../utils/overlays';

interface OverlayTracksProps {
  overlays: Overlay[];
  selectedId: string | null;
  currentTime: number;
  totalDuration: number;
  onSelect: (id: string) => void;
  onChangeTiming: (id: string, startTime: number, endTime: number, commit?: boolean) => void;
}

export const OverlayTracks: React.FC<OverlayTracksProps> = ({
  overlays,
  selectedId,
  currentTime,
  totalDuration,
  onSelect,
  onChangeTiming,
}) => {
  const duration = Math.max(0.001, totalDuration);
  const ordered = [...sortOverlaysByZ(overlays)].reverse();
  const dragRef = useRef<{
    id: string;
    startX: number;
    origStart: number;
    origEnd: number;
    width: number;
  } | null>(null);

  if (ordered.length === 0) return null;

  return (
    <div className="overlay-tracks" aria-label="Overlay timeline">
      {ordered.map((overlay) => {
        const left = (overlay.startTime / duration) * 100;
        const width = (Math.max(0.2, overlay.endTime - overlay.startTime) / duration) * 100;
        return (
          <div
            key={overlay.id}
            className={`overlay-track ${overlay.id === selectedId ? 'is-active' : ''}`}
          >
            <button
              type="button"
              className="overlay-track-label"
              onClick={() => onSelect(overlay.id)}
              title={`${overlay.name} (${labelForKind(overlay.kind)})`}
            >
              {overlay.name}
            </button>
            <div className="overlay-track-rail">
              <button
                type="button"
                className="overlay-track-bar"
                aria-label={`Move ${overlay.name} on timeline`}
                style={{ left: `${left}%`, width: `${width}%` }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  onSelect(overlay.id);
                  const rail = event.currentTarget.parentElement;
                  if (!rail) return;
                  const rect = rail.getBoundingClientRect();
                  dragRef.current = {
                    id: overlay.id,
                    startX: event.clientX,
                    origStart: overlay.startTime,
                    origEnd: overlay.endTime,
                    width: rect.width,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const drag = dragRef.current;
                  if (!drag || drag.id !== overlay.id) return;
                  const span = drag.origEnd - drag.origStart;
                  const dx = ((event.clientX - drag.startX) / drag.width) * duration;
                  const nextStart = Math.max(0, Math.min(duration - span, drag.origStart + dx));
                  onChangeTiming(overlay.id, nextStart, nextStart + span, false);
                }}
                onPointerUp={() => {
                  if (dragRef.current) {
                    onChangeTiming(
                      overlay.id,
                      overlay.startTime,
                      overlay.endTime,
                      true
                    );
                  }
                  dragRef.current = null;
                }}
              />
            </div>
          </div>
        );
      })}
      <div
        className="overlay-track-playhead"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  );
};
