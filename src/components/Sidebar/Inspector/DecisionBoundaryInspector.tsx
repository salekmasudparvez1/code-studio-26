import React from 'react';
import { DecisionBoundaryConfig, DecisionBoundaryModel } from '../../../types/cell';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';

interface DecisionBoundaryInspectorProps {
  config?: DecisionBoundaryConfig;
  onChange: (updates: Partial<DecisionBoundaryConfig>) => void;
}

export const DecisionBoundaryInspector: React.FC<DecisionBoundaryInspectorProps> = ({
  config = { model: 'svm', accuracy: '96.4%', showMargin: true },
  onChange,
}) => {
  return (
    <div className="sub-inspector-section">
      <Select
        label="Classifier Model"
        value={config.model || 'svm'}
        onChange={(e) => onChange({ model: e.target.value as DecisionBoundaryModel })}
        options={[
          { value: 'svm', label: 'Support Vector Machine (SVM / RBF)' },
          { value: 'logistic', label: 'Logistic Regression (Linear)' },
          { value: 'knn', label: 'K-Nearest Neighbors (k=5)' },
        ]}
      />

      <div className="flex-row">
        <Input
          label="Model Accuracy"
          value={config.accuracy || '96.4%'}
          onChange={(e) => onChange({ accuracy: e.target.value })}
          placeholder="96.4%"
        />
        <div className="checkbox-field">
          <label htmlFor="show-margin-toggle">Show Margins</label>
          <input
            id="show-margin-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showMargin !== false}
            onChange={(e) => onChange({ showMargin: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};

