import React from 'react';
import { RnnConfig } from '../../../types/cell';
import { Input } from '../../common/Input';

interface RnnInspectorProps {
  config?: RnnConfig;
  onChange: (updates: Partial<RnnConfig>) => void;
}

export const RnnInspector: React.FC<RnnInspectorProps> = ({
  config = { timeSteps: 4, tokens: ['Deep', 'Learning', 'Recurrent', 'Sequence'], hiddenDim: 64 },
  onChange,
}) => {
  const tokenString = (config.tokens || ['Deep', 'Learning', 'Recurrent', 'Sequence']).join(', ');

  const handleTokensChange = (str: string) => {
    const parsed = str
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parsed.length > 0) {
      onChange({ tokens: parsed, timeSteps: parsed.length });
    }
  };

  return (
    <div className="sub-inspector-section">
      <Input
        label="Input Sequence Tokens"
        defaultValue={tokenString}
        key={tokenString}
        onChange={(e) => handleTokensChange(e.target.value)}
        placeholder="Deep, Learning, Recurrent, Sequence"
        helperText="Comma separated tokens unrolled across time steps"
      />

      <div className="flex-row">
        <Input
          label="Hidden State Dim (h)"
          type="number"
          min={16}
          max={512}
          value={config.hiddenDim || 64}
          onChange={(e) => onChange({ hiddenDim: Number(e.target.value) || 64 })}
        />
        <div className="checkbox-field">
          <label htmlFor="show-loop-toggle">Recurrent Loop</label>
          <input
            id="show-loop-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showRecurrentLoop !== false}
            onChange={(e) => onChange({ showRecurrentLoop: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};

