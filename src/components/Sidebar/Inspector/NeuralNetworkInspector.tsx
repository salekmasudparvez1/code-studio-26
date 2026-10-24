import React from 'react';
import { NeuralNetworkConfig } from '../../../types/cell';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';

interface NeuralNetworkInspectorProps {
  config?: NeuralNetworkConfig;
  onChange: (updates: Partial<NeuralNetworkConfig>) => void;
}

export const NeuralNetworkInspector: React.FC<NeuralNetworkInspectorProps> = ({
  config = { layers: [4, 6, 6, 2], activation: 'relu', showProbabilities: true },
  onChange,
}) => {
  const layerString = (config.layers || [4, 6, 6, 2]).join(', ');

  const handleLayersChange = (str: string) => {
    const parsed = str
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0 && n <= 12);
    if (parsed.length >= 2) {
      onChange({ layers: parsed });
    }
  };

  return (
    <div className="sub-inspector-section">
      <Input
        label="Layer Nodes (comma separated)"
        defaultValue={layerString}
        key={layerString}
        onChange={(e) => handleLayersChange(e.target.value)}
        placeholder="4, 6, 6, 2"
        helperText="Format: Input, Hidden 1, Hidden 2..., Output"
      />

      <div className="flex-row">
        <Select
          label="Activation Function"
          value={config.activation || 'relu'}
          onChange={(e) =>
            onChange({ activation: e.target.value as 'relu' | 'sigmoid' | 'softmax' | 'tanh' })
          }
          options={[
            { value: 'relu', label: 'ReLU' },
            { value: 'sigmoid', label: 'Sigmoid' },
            { value: 'tanh', label: 'Tanh' },
            { value: 'softmax', label: 'Softmax' },
          ]}
        />
        <div className="checkbox-field">
          <label htmlFor="show-prob-toggle">Output Softmax</label>
          <input
            id="show-prob-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showProbabilities !== false}
            onChange={(e) => onChange({ showProbabilities: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};

