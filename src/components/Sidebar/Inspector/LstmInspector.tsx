import React from 'react';
import { LstmConfig } from '../../../types/cell';
import { Select } from '../../common/Select';

interface LstmInspectorProps {
  config?: LstmConfig;
  onChange: (updates: Partial<LstmConfig>) => void;
}

export const LstmInspector: React.FC<LstmInspectorProps> = ({
  config = { showGates: true, highlightGate: 'all', cellState: 1 },
  onChange,
}) => {
  return (
    <div className="sub-inspector-section">
      <Select
        label="Highlight Gate Mechanism"
        value={config.highlightGate || 'all'}
        onChange={(e) =>
          onChange({ highlightGate: e.target.value as 'all' | 'forget' | 'input' | 'output' })
        }
        options={[
          { value: 'all', label: 'All Gates (Animated Pipeline)' },
          { value: 'forget', label: 'Forget Gate: f_t = σ(W_f · [h, x] + b_f)' },
          { value: 'input', label: 'Input Gate: i_t = σ(W_i · [h, x] + b_i)' },
          { value: 'output', label: 'Output Gate: o_t = σ(W_o · [h, x] + b_o)' },
        ]}
      />
    </div>
  );
};

