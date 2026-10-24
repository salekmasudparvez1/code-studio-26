import React from "react";
import { GradientDescentConfig, LossLandscapeType } from "../../../types/cell";
import { Select } from "../../common/Select";
import { Input } from "../../common/Input";
import { Slider } from "../../common/Slider";

interface GradientDescentInspectorProps {
  config?: GradientDescentConfig;
  onChange: (updates: Partial<GradientDescentConfig>) => void;
}

export const GradientDescentInspector: React.FC<
  GradientDescentInspectorProps
> = ({
  config = {
    lossLandscape: "quadratic",
    learningRate: 0.15,
    iterations: 20,
    showLossHistory: true,
  },
  onChange,
}) => {
  return (
    <div className="sub-inspector-section">
      <Select
        label="Loss Landscape Surface"
        value={config.lossLandscape || "quadratic"}
        onChange={(e) =>
          onChange({ lossLandscape: e.target.value as LossLandscapeType })
        }
        options={[
          {
            value: "quadratic",
            label: "Convex Quadratic Bowl: J(w) = w₁² + 0.7w₂²",
          },
          { value: "saddle", label: "Saddle Point Surface" },
          { value: "rosenbrock", label: "Rosenbrock Non-Convex Valley" },
        ]}
      />

      <Slider
        label="Learning Rate (η)"
        min={0.02}
        max={0.45}
        step={0.01}
        value={config.learningRate || 0.15}
        onChange={(e) => onChange({ learningRate: Number(e.target.value) })}
        valueDisplay={
          <span>η = {(config.learningRate || 0.15).toFixed(2)}</span>
        }
      />

      <div className="flex-row">
        <Input
          label="Iterations (Steps)"
          type="number"
          min={5}
          max={40}
          value={config.iterations || 20}
          onChange={(e) =>
            onChange({
              iterations: Math.max(
                5,
                Math.min(40, Number(e.target.value) || 20),
              ),
            })
          }
        />
        <div className="checkbox-field">
          <label htmlFor="show-loss-history-toggle">Loss Curve</label>
          <input
            id="show-loss-history-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showLossHistory !== false}
            onChange={(e) => onChange({ showLossHistory: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};
