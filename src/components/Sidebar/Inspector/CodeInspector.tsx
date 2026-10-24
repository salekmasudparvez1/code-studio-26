import React from "react";
import { CodeCell } from "../../../types/cell";
import { Input } from "../../common/Input";
import { Textarea } from "../../common/Textarea";

interface CodeInspectorProps {
  cell: CodeCell;
  onChange: (updates: Partial<CodeCell>) => void;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({
  cell,
  onChange,
}) => {
  return (
    <div className="inspector-fields">
      <Input
        label="Filename"
        value={cell.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="main.py"
      />

      <Textarea
        label="Source code"
        value={cell.source}
        rows={6}
        onChange={(e) => onChange({ source: e.target.value })}
        placeholder="Enter source code..."
      />

      <div className="flex-row">
        <Input
          label="Typing speed (char/s)"
          type="number"
          min={1}
          max={100}
          value={cell.speed}
          onChange={(e) =>
            onChange({ speed: Math.max(1, Number(e.target.value) || 18) })
          }
        />
        <Input
          label="Pause after (sec)"
          type="number"
          min={0}
          max={30}
          step={0.5}
          value={cell.pause}
          onChange={(e) =>
            onChange({ pause: Math.max(0, Number(e.target.value) || 0) })
          }
        />
      </div>
    </div>
  );
};
