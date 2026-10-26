import React from "react";
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
  Ban,
} from "lucide-react";
import {
  OverlayDrawStyle,
  OverlayTool,
  OVERLAY_FONTS,
} from "../../../types/overlay";

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
  { id: "select", label: "Select (V)", icon: <MousePointer2 size={15} /> },
  { id: "text", label: "Text (T)", icon: <Type size={15} /> },
  { id: "pen", label: "Brush (B)", icon: <Pencil size={15} /> },
  { id: "arrow", label: "Arrow (A)", icon: <ArrowUpRight size={15} /> },
  { id: "ellipse", label: "Ellipse (E)", icon: <Circle size={15} /> },
  { id: "rect", label: "Rectangle (R)", icon: <Square size={15} /> },
  {
    id: "highlight",
    label: "Highlighter (H)",
    icon: <Highlighter size={15} />,
  },
  { id: "eraser", label: "Eraser (X)", icon: <Eraser size={15} /> },
];

/** input[type=color] only supports #RRGGBB. Normalize anything else. */
const toHex = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return fallback;
};

const isTransparent = (value: string | undefined): boolean => {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return (
    v === "transparent" ||
    v === "none" ||
    v === "rgba(0,0,0,0)" ||
    v === "rgba(0, 0, 0, 0)"
  );
};

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
  const strokeColor = toHex(drawStyle.stroke, "#facc15");
  const fillColor = toHex(drawStyle.color ?? drawStyle.fill, "#ffffff");
  const strokeTransparent = isTransparent(drawStyle.stroke);
  const fillTransparent = isTransparent(drawStyle.color ?? drawStyle.fill);

  return (
    <div
      className="overlay-toolbar ps-toolbar"
      role="toolbar"
      aria-label="Video overlay tools"
    >
      {/* Tools */}
      <div className="ps-group">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ps-btn ${tool === item.id ? "is-active" : ""}`}
            title={item.label}
            aria-label={item.label}
            aria-pressed={tool === item.id}
            onClick={() => onToolChange(item.id)}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="ps-divider" />

      {/* Color / Fill / Size / Font */}
      <div className="ps-group ps-style">
        {/* Stroke color */}
        <label
          className={`ps-field ${strokeTransparent ? "is-transparent" : ""}`}
        >
          <span className="ps-label">Color</span>
          <span className="ps-swatch-wrap">
            <input
              type="color"
              className="ps-swatch-input"
              aria-label="Overlay stroke color"
              value={strokeColor}
              onChange={(event) =>
                onStyleChange({
                  stroke: event.target.value,
                  color: event.target.value,
                })
              }
            />
            <button
              type="button"
              className={`ps-none-btn ${strokeTransparent ? "is-on" : ""}`}
              title={
                strokeTransparent
                  ? "Enable stroke color"
                  : "Make stroke transparent"
              }
              aria-label="Toggle transparent stroke"
              aria-pressed={strokeTransparent}
              onClick={() =>
                onStyleChange({
                  stroke: strokeTransparent ? strokeColor : "transparent",
                })
              }
            >
              <Ban size={11} />
            </button>
          </span>
        </label>

        {/* Fill color */}
        <label
          className={`ps-field ${fillTransparent ? "is-transparent" : ""}`}
        >
          <span className="ps-label">Fill</span>
          <span className="ps-swatch-wrap">
            <input
              type="color"
              className="ps-swatch-input"
              aria-label="Overlay fill color"
              value={fillColor}
              onChange={(event) =>
                onStyleChange({
                  fill: event.target.value,
                  color: event.target.value,
                  background: event.target.value,
                })
              }
            />
            <button
              type="button"
              className={`ps-none-btn ${fillTransparent ? "is-on" : ""}`}
              title={
                fillTransparent ? "Enable fill color" : "Make fill transparent"
              }
              aria-label="Toggle transparent fill"
              aria-pressed={fillTransparent}
              onClick={() =>
                onStyleChange({
                  fill: fillTransparent ? fillColor : "transparent",
                  color: fillTransparent ? fillColor : "transparent",
                  background: fillTransparent ? fillColor : "transparent",
                })
              }
            >
              <Ban size={11} />
            </button>
          </span>
        </label>

        <label className="ps-field ps-field-size">
          <span className="ps-label">Size</span>
          <input
            type="range"
            className="ps-range"
            min={2}
            max={72}
            value={drawStyle.strokeWidth}
            aria-label="Overlay stroke size"
            onChange={(event) =>
              onStyleChange({ strokeWidth: Number(event.target.value) })
            }
          />
        </label>

        <label className="ps-field">
          <span className="ps-label">Font</span>
          <select
            className="ps-select"
            aria-label="Overlay font"
            value={drawStyle.fontFamily}
            onChange={(event) =>
              onStyleChange({ fontFamily: event.target.value })
            }
          >
            {OVERLAY_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ps-field ps-field-size">
          <span className="ps-label">Type</span>
          <input
            type="range"
            className="ps-range"
            min={16}
            max={96}
            value={drawStyle.fontSize}
            aria-label="Overlay font size"
            onChange={(event) =>
              onStyleChange({ fontSize: Number(event.target.value) })
            }
          />
        </label>
      </div>

      <div className="ps-divider" />

      {/* Undo / Redo */}
      <div className="ps-group">
        <button
          type="button"
          className="ps-btn"
          title="Undo (Ctrl+Z)"
          aria-label="Undo overlay edit"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          className="ps-btn"
          title="Redo (Ctrl+Shift+Z)"
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
