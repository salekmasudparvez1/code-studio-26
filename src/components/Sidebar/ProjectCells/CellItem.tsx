import React from 'react';
import {
  FileCode,
  BarChart3,
  Clock,
  Presentation,
  ChevronUp,
  ChevronDown,
  Trash2,
  Network,
  Split,
  Shapes,
  TrendingDown,
  Layers,
  Repeat,
  Cpu,
  Scan,
  LineChart,
  Eye,
} from 'lucide-react';
import { Cell } from '../../../types/cell';
import { getCellDuration } from '../../../utils/duration';

interface CellItemProps {
  cell: Cell;
  isActive: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onSelectStart?: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export const CellItem: React.FC<CellItemProps> = ({
  cell,
  isActive,
  canMoveUp,
  canMoveDown,
  canDelete,
  onSelect,
  onSelectStart,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const duration = getCellDuration(cell).toFixed(1);

  const renderIcon = () => {
    if (cell.type === 'code') return <FileCode size={15} />;
    if (cell.type === 'delay') return <Clock size={15} />;
    if (cell.type === 'board') return <Presentation size={15} />;
    if (cell.type === 'graph') {
      switch (cell.graphType) {
        case 'ann':
        case 'neural-network':
          return <Network size={15} />;
        case 'cnn':
          return <Layers size={15} />;
        case 'rnn':
          return <Repeat size={15} />;
        case 'lstm':
          return <Cpu size={15} />;
        case 'yolo':
          return <Scan size={15} />;
        case 'matplotlib':
          return <LineChart size={15} />;
        case 'decision-boundary':
          return <Split size={15} />;
        case 'clustering':
          return <Shapes size={15} />;
        case 'gradient-descent':
          return <TrendingDown size={15} />;
        case 'bar':
        default:
          return <BarChart3 size={15} />;
      }
    }
    return <FileCode size={15} />;
  };

  const getSubtypeLabel = () => {
    if (cell.type === 'code') return 'Code';
    if (cell.type === 'delay') return 'Delay';
    if (cell.type === 'board') return 'Board';
    if (cell.type === 'graph') {
      switch (cell.graphType) {
        case 'ann':
        case 'neural-network':
          return 'ANN';
        case 'cnn':
          return 'CNN';
        case 'rnn':
          return 'RNN';
        case 'lstm':
          return 'LSTM';
        case 'yolo':
          return 'YOLO';
        case 'matplotlib':
          return 'Plot';
        case 'decision-boundary':
          return 'SVM';
        case 'clustering':
          return 't-SNE';
        case 'gradient-descent':
          return 'Opt';
        case 'bar':
        default:
          return 'Chart';
      }
    }
    return 'Layer';
  };

  const getIconClass = () => {
    if (cell.type === 'code') return 'cell-type-code';
    if (cell.type === 'delay') return 'cell-type-delay';
    if (cell.type === 'board') return 'cell-type-board';
    if (cell.type === 'graph') {
      return `cell-type-${cell.graphType || 'graph'}`;
    }
    return '';
  };

  return (
    <div
      className={`cell-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      title="Click to select and preview layer"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
    >
      {/* Photoshop Layer Visibility Eye */}
      <span
        className="layer-visibility-icon"
        title="Preview from start of layer"
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectStart) {
            onSelectStart();
          } else {
            onSelect();
          }
        }}
      >
        <Eye size={13} />
      </span>

      {/* Layer Thumbnail / Badge */}
      <div className={`cell-type-icon ${getIconClass()}`}>
        {renderIcon()}
      </div>

      {/* Layer Info */}
      <div className="cell-info">
        <div className="cell-name">{cell.name || cell.type}</div>
        <div className="cell-meta">
          <span className="cell-type-badge">{getSubtypeLabel()}</span>
          <span className="cell-duration-badge">{duration}s</span>
        </div>
      </div>

      {/* Layer Actions (Reorder & Delete) */}
      <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="cell-action-btn"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          title="Move layer up"
          aria-label="Move layer up"
        >
          <ChevronUp size={13} />
        </button>
        <button
          className="cell-action-btn"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          title="Move layer down"
          aria-label="Move layer down"
        >
          <ChevronDown size={13} />
        </button>
        <button
          className="cell-action-btn danger"
          disabled={!canDelete}
          onClick={onDelete}
          title="Delete layer"
          aria-label="Delete layer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
