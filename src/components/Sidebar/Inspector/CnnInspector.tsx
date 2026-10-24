import React from 'react';
import { CnnConfig } from '../../../types/cell';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';

interface CnnInspectorProps {
  config?: CnnConfig;
  onChange: (updates: Partial<CnnConfig>) => void;
}

export const CnnInspector: React.FC<CnnInspectorProps> = ({
  config = { inputShape: '32x32x3', kernelSize: 3, filterType: 'edge' },
  onChange,
}) => {
  return (
    <div className="sub-inspector-section">
      <div className="flex-row">
        <Input
          label="Input Shape"
          value={config.inputShape || '32x32x3'}
          onChange={(e) => onChange({ inputShape: e.target.value })}
          placeholder="32x32x3"
        />
        <Input
          label="Kernel Size"
          type="number"
          min={1}
          max={7}
          value={config.kernelSize || 3}
          onChange={(e) => onChange({ kernelSize: Number(e.target.value) || 3 })}
        />
      </div>

      <Select
        label="Filter Kernel Feature"
        value={config.filterType || 'edge'}
        onChange={(e) => onChange({ filterType: e.target.value as 'edge' | 'sharpen' | 'gaussian' })}
        options={[
          { value: 'edge', label: 'Sobel Edge Detection (3×3)' },
          { value: 'sharpen', label: 'Ridge Detection Filter' },
          { value: 'gaussian', label: 'Gaussian Feature Smoothing' },
        ]}
      />
    </div>
  );
};

