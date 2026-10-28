import React from "react";
import { BoardCell } from "../../../types/cell";
import { Input } from "../../common/Input";

const PRESETS = [
  { label: "Black", value: "#000000" },
  { label: "White", value: "#ffffff" },
  { label: "Dark", value: "#0d1117" },
  { label: "Slate", value: "#1e293b" },
];

const toHex = (value: string | undefined): string => {
  if (!value) return "#000000";
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return "#000000";
};

interface BoardInspectorProps {
  cell: BoardCell;
  onChange: (updates: Partial<BoardCell>) => void;
}

export const BoardInspector: React.FC<BoardInspectorProps> = ({
  cell,
  onChange,
}) => {
  const color = toHex(cell.bgColor);

  return (
    <div className="inspector-fields">
      <Input
        label="Label"
        value={cell.name}
        onChange={(event) => onChange({ name: event.target.value })}
        placeholder="Black board"
      />

      <Input
        label="Duration (seconds)"
        type="number"
        min={0.5}
        max={120}
        step={0.5}
        value={cell.seconds}
        onChange={(event) =>
          onChange({ seconds: Math.max(0.5, Number(event.target.value) || 8) })
        }
      />

      <Input
        label="Canvas color"
        type="color"
        value={color}
        onChange={(event) => onChange({ bgColor: event.target.value })}
      />

      <div className="board-color-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`board-preset-btn ${color.toLowerCase() === preset.value ? "is-active" : ""}`}
            title={preset.label}
            aria-label={`${preset.label} board`}
            style={{ background: preset.value }}
            onClick={() =>
              onChange({
                bgColor: preset.value,
                name:
                  preset.value === "#ffffff"
                    ? "Whiteboard"
                    : preset.value === "#000000"
                      ? "Black board"
                      : cell.name,
              })
            }
          />
        ))}
      </div>
    </div>
  );
};
