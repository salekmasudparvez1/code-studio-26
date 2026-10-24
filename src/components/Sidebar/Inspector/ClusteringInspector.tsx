import React from 'react';
import { ClusteringConfig, ClusteringMethod } from '../../../types/cell';
import { Select } from '../../common/Select';
import { Input } from '../../common/Input';

interface ClusteringInspectorProps {
  config?: ClusteringConfig;
  onChange: (updates: Partial<ClusteringConfig>) => void;
}

export const ClusteringInspector: React.FC<ClusteringInspectorProps> = ({
  config = { method: 'tsne', clusters: 3, showCentroids: true, showHulls: true },
  onChange,
}) => {
  return (
    <div className="sub-inspector-section">
      <Select
        label="Embedding & Projection Method"
        value={config.method || 'tsne'}
        onChange={(e) => onChange({ method: e.target.value as ClusteringMethod })}
        options={[
          { value: 'tsne', label: 't-SNE (Non-Linear Manifold)' },
          { value: 'pca', label: 'PCA (Principal Component Analysis)' },
          { value: 'kmeans', label: 'K-Means on Feature Vectors' },
        ]}
      />

      <div className="flex-row">
        <Input
          label="Clusters (k)"
          type="number"
          min={2}
          max={4}
          value={config.clusters || 3}
          onChange={(e) => onChange({ clusters: Math.max(2, Math.min(4, Number(e.target.value) || 3)) })}
        />
        <div className="checkbox-field">
          <label htmlFor="show-centroids-toggle">Show Centroids</label>
          <input
            id="show-centroids-toggle"
            type="checkbox"
            className="form-checkbox"
            checked={config.showCentroids !== false}
            onChange={(e) => onChange({ showCentroids: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};

