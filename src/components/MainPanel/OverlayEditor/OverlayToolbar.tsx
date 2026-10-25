import React from 'react';
import {
  ArrowUpRight,
  Circle,
  Eraser,
  Highlighter,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  Type,
  Undo2,
} from 'lucide-react';
import { OverlayDrawStyle, OverlayTool, OVERLAY_FONTS } from '../../../types/overlay';

interface OverlayToolbarProps {
  tool: OverlayTool;
  drawStyle: OverlayDrawStyle;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: OverlayTool) => void;
  onStyleChange: (updates: Partial<OverlayDrawStyle>) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const TOOLS: { id: OverlayTool; label: string; icon: React.ReactNode }[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2 size={15} /> },
  { id: 'text', label: 'Text', icon: <Type size={15} /> },
  { id: 'pen', label: 'Draw', icon: <Pencil size={15} /> },
  { id: 'arrow', label: 'Arrow', icon: <ArrowUpRight size={15} /> },
  { id: 'ellipse', label: 'Circle', icon: <Circle size={15} /> },
  { id: 'rect', label: 'Rectangle', icon: <Square size={15} /> },
  { id: 'highlight', label: 'Highlight', icon: <Highlighter size={15} /> },
  { id: 'eraser', label: 'Eraser', icon: <Eraser size={15} /> },
];

export const OverlayToolbar: React.FC<OverlayToolbarProps> = ({
  tool,
  drawStyle,
  canUndo,
  canRedo,
  onToolChange,
  onStyleChange,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="overlay-toolbar" role="toolbar" aria-label="Video overlay tools">
      <div className="overlay-toolbar-group">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`overlay-tool-btn ${tool === item.id ? 'is-active' : ''}`}
            title={item.label}
            aria-label={item.label}
            aria-pressed={tool === item.id}
            onClick={() => onToolChange(item.id)}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="overlay-toolbar-group overlay-toolbar-style">
        <label className="overlay-style-field">
          <span>Color</span>
          <input
            type="color"
            aria-label="Overlay stroke color"
            value={drawStyle.stroke.startsWith('#') ? drawStyle.stroke : '#facc15'}
            onChange={(event) =>
              onStyleChange({
                stroke: event.target.value,
                color: event.target.value,
              })
            }
          />
        </label>
        <label className="overlay-style-field">
          <span>Fill</span>
          <input
            type="color"
            aria-label="Overlay fill color"
            value={drawStyle.color.startsWith('#') ? drawStyle.color : '#ffffff'}
            onChange={(event) =>
              onStyleChange({
                fill: event.target.value,
                color: event.target.value,
                background: event.target.value,
              })
            }
          />
        </label>
        <label className="overlay-style-field overlay-style-size">
          <span>Size</span>
          <input
            type="range"
            min={2}
            max={72}
            value={drawStyle.strokeWidth}
            aria-label="Overlay stroke size"
            onChange={(event) => onStyleChange({ strokeWidth: Number(event.target.value) })}
          />
        </label>
        <label className="overlay-style-field">
          <span>Font</span>
          <select
            aria-label="Overlay font"
            value={drawStyle.fontFamily}
            onChange={(event) => onStyleChange({ fontFamily: event.target.value })}
          >
            {OVERLAY_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
        <label className="overlay-style-field overlay-style-size">
          <span>Type</span>
          <input
            type="range"
            min={16}
            max={96}
            value={drawStyle.fontSize}
            aria-label="Overlay font size"
            onChange={(event) => onStyleChange({ fontSize: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="overlay-toolbar-group">
        <button
          type="button"
          className="overlay-tool-btn"
          title="Undo overlay edit (Ctrl+Z)"
          aria-label="Undo overlay edit"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          className="overlay-tool-btn"
          title="Redo overlay edit (Ctrl+Shift+Z)"
          aria-label="Redo overlay edit"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={15} />
        </button>
      </div>
    </div>
  );
};
