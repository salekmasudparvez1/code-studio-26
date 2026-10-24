import React from 'react';
import { YoloConfig } from '../../../types/cell';
import { Input } from '../../common/Input';
import { Slider } from '../../common/Slider';

interface YoloInspectorProps {
  config?: YoloConfig;
  onChange: (updates: Partial<YoloConfig>) => void;
}

export const YoloInspector: React.FC<YoloInspectorProps> = ({
  config = { gridSize: 7, confidenceThreshold: 0.6, showGrid: true, showAnchors: true },
  onChange,
}) => {
  return (
    <div className="sub-inspector-section">
      <Slider
        label="Confidence Threshold (NMS)"
        min={0.2}
        max={0.95}
        step={0.05}
        value={config.confidenceThreshold || 0.6}
        onChange={(e) => onChange({ confidenceThreshold: Number(e.target.value) })}
        valueDisplay={<span>{((config.confidenceThreshold || 0.6) * 100).toFixed(0)}%</span>}
      />

      <div className="flex-row">
        <Input
          label="S × S Grid Cells"
          type="number"
          min={3}
          max={13}
          value={config.gridSize || 7}
          onChange={(e) => onChange({ gridSize: Math.max(3, Math.min(13, Number(e.target.value) || 7)) })}
        />
        <div className="checkbox-field">
          <label htmlFor="yolo-grid-toggle">Show S×S Grid</label>
          <input
            id="yolo-grid-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showGrid !== false}
            onChange={(e) => onChange({ showGrid: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};

