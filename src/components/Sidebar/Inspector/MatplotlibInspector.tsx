import React from 'react';
import { MatplotlibConfig } from '../../../types/cell';
import { Input } from '../../common/Input';
import { Textarea } from '../../common/Textarea';

interface MatplotlibInspectorProps {
  config?: MatplotlibConfig;
  onChange: (updates: Partial<MatplotlibConfig>) => void;
}

export const MatplotlibInspector: React.FC<MatplotlibInspectorProps> = ({
  config = {
    pythonCode: 'plt.plot(x, y)\nplt.title("Title")\nplt.show()',
    plotType: 'line',
    title: 'Model Convergence (Epochs vs Loss)',
    xLabel: 'Epoch',
    yLabel: 'Cross-Entropy Loss',
    showGrid: true,
    showLegend: true,
  },
  onChange,
}) => {
  return (
    <div className="sub-inspector-section">
      <Input
        label="Figure Title (plt.title)"
        value={config.title || ''}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Figure Title"
      />

      <div className="flex-row">
        <Input
          label="X-Axis Label (plt.xlabel)"
          value={config.xLabel || 'Epoch'}
          onChange={(e) => onChange({ xLabel: e.target.value })}
        />
        <Input
          label="Y-Axis Label (plt.ylabel)"
          value={config.yLabel || 'Loss'}
          onChange={(e) => onChange({ yLabel: e.target.value })}
        />
      </div>

      <Textarea
        label="Matplotlib Python Script"
        value={config.pythonCode || ''}
        rows={5}
        onChange={(e) => onChange({ pythonCode: e.target.value })}
        placeholder="import matplotlib.pyplot as plt\nplt.plot(x, y)\nplt.show()"
        helperText="Simulated animated execution with interactive figure toolbar"
      />

      <div className="flex-row">
        <div className="checkbox-field">
          <label htmlFor="plt-grid-toggle">Show Grid (plt.grid)</label>
          <input
            id="plt-grid-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showGrid !== false}
            onChange={(e) => onChange({ showGrid: e.target.checked })}
          />
        </div>
        <div className="checkbox-field">
          <label htmlFor="plt-legend-toggle">Show Legend (plt.legend)</label>
          <input
            id="plt-legend-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showLegend !== false}
            onChange={(e) => onChange({ showLegend: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};

