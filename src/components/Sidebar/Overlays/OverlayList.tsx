import React, { useState } from 'react';
import { ChevronDown, Eye, EyeOff, Layers, Lock, Unlock } from 'lucide-react';
import { Overlay, OverlayPatch } from '../../../types/overlay';
import { SectionTitle } from '../../common/SectionTitle';
import { labelForKind, sortOverlaysByZ } from '../../../utils/overlays';

interface OverlayListProps {
  overlays: Overlay[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: OverlayPatch) => void;
  onDelete: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

export const OverlayList: React.FC<OverlayListProps> = ({
  overlays,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onReorder,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const ordered = [...sortOverlaysByZ(overlays)].reverse();

  return (
    <section className="sidebar-section overlay-list-section">
      <div className="photoshop-cell-header">
        <SectionTitle
          icon={<Layers size={14} />}
          title="Overlays"
          badge={<span className="count-badge">{overlays.length}</span>}
        />
        <button
          type="button"
          className="photoshop-collapse-button"
          aria-label={isExpanded ? 'Collapse overlays' : 'Expand overlays'}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
        >
          <ChevronDown size={15} className={isExpanded ? '' : 'is-collapsed'} />
        </button>
      </div>

      {isExpanded && (
        <div className="overlay-list" role="list" aria-label="Overlay layers">
          {ordered.length === 0 && (
            <div className="empty-state">No overlays yet. Use the toolbar above the preview.</div>
          )}
          {ordered.map((overlay) => (
            <div
              key={overlay.id}
              role="listitem"
              className={`overlay-list-item ${overlay.id === selectedId ? 'is-active' : ''}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/overlay-id', overlay.id);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData('text/overlay-id');
                if (fromId) onReorder(fromId, overlay.id);
              }}
              onClick={() => onSelect(overlay.id)}
            >
              <button
                type="button"
                className="overlay-list-icon"
                title={overlay.visible ? 'Hide overlay' : 'Show overlay'}
                aria-label={overlay.visible ? 'Hide overlay' : 'Show overlay'}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdate(overlay.id, { visible: !overlay.visible });
                }}
              >
                {overlay.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <div className="overlay-list-copy">
                <strong>{overlay.name}</strong>
                <span>{labelForKind(overlay.kind)}</span>
              </div>
              <button
                type="button"
                className="overlay-list-icon"
                title={overlay.locked ? 'Unlock overlay' : 'Lock overlay'}
                aria-label={overlay.locked ? 'Unlock overlay' : 'Lock overlay'}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdate(overlay.id, { locked: !overlay.locked });
                }}
              >
                {overlay.locked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>
              <button
                type="button"
                className="overlay-list-delete"
                title="Delete overlay"
                aria-label="Delete overlay"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(overlay.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
