import React from "react";
import { DelayCell } from "../../../types/cell";
import { Input } from "../../common/Input";

interface DelayInspectorProps {
  cell: DelayCell;
  onChange: (updates: Partial<DelayCell>) => void;
}

export const DelayInspector: React.FC<DelayInspectorProps> = ({
  cell,
  onChange,
}) => {
  return (
    <div className="inspector-fields">
      <Input
        label="Label"
        value={cell.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Pause"
      />

      <Input
        label="Delay (seconds)"
        type="number"
        min={0.5}
        max={30}
        step={0.5}
        value={cell.seconds}
        onChange={(e) =>
          onChange({ seconds: Math.max(0.5, Number(e.target.value) || 3) })
        }
      />
    </div>
  );
};
