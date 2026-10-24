import React from 'react';
import { GraphCell, GraphType } from '../../../types/cell';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { DecisionBoundaryInspector } from './DecisionBoundaryInspector';
import { NeuralNetworkInspector } from './NeuralNetworkInspector';
import { ClusteringInspector } from './ClusteringInspector';
import { GradientDescentInspector } from './GradientDescentInspector';
import { CnnInspector } from './CnnInspector';
import { RnnInspector } from './RnnInspector';
import { LstmInspector } from './LstmInspector';
import { YoloInspector } from './YoloInspector';
import { MatplotlibInspector } from './MatplotlibInspector';

interface GraphInspectorProps {
  cell: GraphCell;
  onChange: (updates: Partial<GraphCell>) => void;
}

export const GraphInspector: React.FC<GraphInspectorProps> = ({ cell, onChange }) => {
  const currentGraphType: GraphType =
    cell.graphType === 'neural-network' ? 'ann' : cell.graphType || 'ann';

  const handleGraphTypeChange = (newType: GraphType) => {
    let newName = cell.name;
    if (newType === 'ann') newName = 'ANN Architecture';
    else if (newType === 'cnn') newName = 'CNN Feature Maps & Kernels';
    else if (newType === 'rnn') newName = 'RNN Recurrent Sequence Unrolled';
    else if (newType === 'lstm') newName = 'LSTM Memory Cell & Gates';
    else if (newType === 'yolo') newName = 'YOLOv8 Object Detection';
    else if (newType === 'matplotlib') newName = 'Matplotlib Custom Plot (plt.show)';
    else if (newType === 'decision-boundary') newName = 'SVM Decision Boundary';
    else if (newType === 'clustering') newName = 't-SNE Embeddings & Clusters';
    else if (newType === 'gradient-descent') newName = 'Gradient Descent Optimization';
    else if (newType === 'bar') newName = 'Bar Chart';

    onChange({ graphType: newType, name: newName });
  };

  const dataString = (cell.data || []).join(', ');
  const handleBarDataChange = (str: string) => {
    const parsed = str
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    onChange({ data: parsed });
  };

  return (
    <div className="inspector-fields">
      <Input
        label="Visualization Title"
        value={cell.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Visualization Title"
      />

      <Select
        label="Visualization Architecture / Type"
        value={currentGraphType}
        onChange={(e) => handleGraphTypeChange(e.target.value as GraphType)}
        options={[
          { value: 'ann', label: '1. ANN (Artificial Neural Network / MLP)' },
          { value: 'cnn', label: '2. CNN (Convolutional Neural Network)' },
          { value: 'rnn', label: '3. RNN (Recurrent Neural Network Unrolled)' },
          { value: 'lstm', label: '4. LSTM (Long Short-Term Memory Highway)' },
          { value: 'yolo', label: '5. YOLO (Real-Time Object Detection)' },
          { value: 'matplotlib', label: '6. Matplotlib Code Animation (plt.show)' },
          { value: 'decision-boundary', label: '7. Decision Boundaries (SVM / KNN / Logistic)' },
          { value: 'clustering', label: '8. Embeddings & Clustering (t-SNE / PCA)' },
          { value: 'gradient-descent', label: '9. Gradient Descent Optimization' },
          { value: 'bar', label: '10. Metrics Bar Chart' },
        ]}
      />

      {/* Sub-Inspectors for each type */}
      {currentGraphType === 'ann' && (
        <NeuralNetworkInspector
          config={cell.neuralNetwork}
          onChange={(updates) =>
            onChange({ neuralNetwork: { ...cell.neuralNetwork, ...updates } as any })
          }
        />
      )}

      {currentGraphType === 'cnn' && (
        <CnnInspector
          config={cell.cnn}
          onChange={(updates) => onChange({ cnn: { ...cell.cnn, ...updates } as any })}
        />
      )}

      {currentGraphType === 'rnn' && (
        <RnnInspector
          config={cell.rnn}
          onChange={(updates) => onChange({ rnn: { ...cell.rnn, ...updates } as any })}
        />
      )}

      {currentGraphType === 'lstm' && (
        <LstmInspector
          config={cell.lstm}
          onChange={(updates) => onChange({ lstm: { ...cell.lstm, ...updates } as any })}
        />
      )}

      {currentGraphType === 'yolo' && (
        <YoloInspector
          config={cell.yolo}
          onChange={(updates) => onChange({ yolo: { ...cell.yolo, ...updates } as any })}
        />
      )}

      {currentGraphType === 'matplotlib' && (
        <MatplotlibInspector
          config={cell.matplotlib}
          onChange={(updates) =>
            onChange({ matplotlib: { ...cell.matplotlib, ...updates } as any })
          }
        />
      )}

      {currentGraphType === 'decision-boundary' && (
        <DecisionBoundaryInspector
          config={cell.decisionBoundary}
          onChange={(updates) =>
            onChange({ decisionBoundary: { ...cell.decisionBoundary, ...updates } as any })
          }
        />
      )}

      {currentGraphType === 'clustering' && (
        <ClusteringInspector
          config={cell.clustering}
          onChange={(updates) =>
            onChange({ clustering: { ...cell.clustering, ...updates } as any })
          }
        />
      )}

      {currentGraphType === 'gradient-descent' && (
        <GradientDescentInspector
          config={cell.gradientDescent}
          onChange={(updates) =>
            onChange({ gradientDescent: { ...cell.gradientDescent, ...updates } as any })
          }
        />
      )}

      {currentGraphType === 'bar' && (
        <>
          <Input
            label="Data values (comma separated)"
            defaultValue={dataString}
            key={cell.id + '-data'}
            onChange={(e) => handleBarDataChange(e.target.value)}
            placeholder="12, 28, 18, 34, 22"
          />

          <div className="input-group">
            <label htmlFor="bar-color-picker">Bar color</label>
            <div className="color-picker-row">
              <input
                id="bar-color-picker"
                type="color"
                value={cell.barColor || '#7c9cff'}
                onChange={(e) => onChange({ barColor: e.target.value })}
                className="color-input"
              />
              <span className="color-hex">{cell.barColor || '#7c9cff'}</span>
            </div>
          </div>
        </>
      )}

      {/* Speed & Pause */}
      <div className="flex-row">
        <Input
          label="Speed multiplier"
          type="number"
          min={0.1}
          max={5}
          step={0.1}
          value={cell.speed}
          onChange={(e) => onChange({ speed: Math.max(0.1, Number(e.target.value) || 1.2) })}
        />
        <Input
          label="Pause after (sec)"
          type="number"
          min={0}
          max={30}
          step={0.5}
          value={cell.pause}
          onChange={(e) => onChange({ pause: Math.max(0, Number(e.target.value) || 0) })}
        />
      </div>
    </div>
  );
};
