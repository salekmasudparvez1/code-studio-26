import React, { useState } from 'react';
import {
  FileCode,
  Clock,
  Presentation,
  Network,
  Split,
  Shapes,
  TrendingDown,
  BarChart3,
  ChevronDown,
  Sparkles,
  Layers,
  Repeat,
  Cpu,
  Scan,
  LineChart,
} from 'lucide-react';
import { CellType, GraphType } from '../../../types/cell';
import { Button } from '../../common/Button';
import { parseNotebook } from '../../../utils/notebook';
import { Cell } from '../../../types/cell';

interface AddCellButtonsProps {
  onAddCell: (type: CellType, graphType?: GraphType) => void;
  onImportCells: (cells: Cell[]) => void;
}

export const AddCellButtons: React.FC<AddCellButtonsProps> = ({ onAddCell, onImportCells }) => {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleAddGraph = (gt: GraphType) => {
    onAddCell('graph', gt);
    setShowAiMenu(false);
  };

  const handleNotebookImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      onImportCells(parseNotebook(await file.text(), file.name));
      setImportError(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unable to import notebook.');
    }
  };

  return (
    <div className="add-cell-container">
      <label className="notebook-import-button btn btn-sm" title="Import a Jupyter notebook">
        <input type="file" accept=".ipynb,application/json" onChange={handleNotebookImport} />
        Import .ipynb
      </label>
      {importError && <div className="notebook-import-error" role="alert">{importError}</div>}
      <div className="add-cell-bar">
        <Button
          size="sm"
          icon={<FileCode size={14} />}
          onClick={() => onAddCell('code')}
          title="Add animated code typing cell"
        >
          Code
        </Button>

        <div className="ai-dropdown-wrapper">
          <Button
            size="sm"
            variant="primary"
            icon={<Sparkles size={14} />}
            onClick={() => setShowAiMenu((prev) => !prev)}
            title="Explore AI/ML Visualizations"
          >
            AI / ML Models <ChevronDown size={12} />
          </Button>

          {showAiMenu && (
            <div className="ai-dropdown-menu">
              <button className="ai-menu-item" onClick={() => handleAddGraph('ann')}>
                <Network size={14} className="menu-icon ann" />
                <div>
                  <div className="menu-title">ANN (Multi-Layer Perceptron)</div>
                  <div className="menu-desc">Feedforward layers & forward pass</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('cnn')}>
                <Layers size={14} className="menu-icon cnn" />
                <div>
                  <div className="menu-title">CNN (Convolutional Network)</div>
                  <div className="menu-desc">Feature maps, sliding kernels & pooling</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('rnn')}>
                <Repeat size={14} className="menu-icon rnn" />
                <div>
                  <div className="menu-title">RNN (Recurrent Network)</div>
                  <div className="menu-desc">Unrolled sequential tokens & loops</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('lstm')}>
                <Cpu size={14} className="menu-icon lstm" />
                <div>
                  <div className="menu-title">LSTM (Memory Highway)</div>
                  <div className="menu-desc">Cell state, forget, input & output gates</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('yolo')}>
                <Scan size={14} className="menu-icon yolo" />
                <div>
                  <div className="menu-title">YOLOv8 (Object Detection)</div>
                  <div className="menu-desc">S×S grid, anchor boxes & NMS predictions</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('matplotlib')}>
                <LineChart size={14} className="menu-icon matplotlib" />
                <div>
                  <div className="menu-title">Matplotlib Custom Plot</div>
                  <div className="menu-desc">Python code show & interactive figure</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('decision-boundary')}>
                <Split size={14} className="menu-icon" />
                <div>
                  <div className="menu-title">Decision Boundaries</div>
                  <div className="menu-desc">KNN, SVM, Logistic Regression</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('clustering')}>
                <Shapes size={14} className="menu-icon" />
                <div>
                  <div className="menu-title">Embeddings & Clustering</div>
                  <div className="menu-desc">PCA, t-SNE, K-Means centroids</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('gradient-descent')}>
                <TrendingDown size={14} className="menu-icon" />
                <div>
                  <div className="menu-title">Gradient Descent</div>
                  <div className="menu-desc">Loss contours & learning rate path</div>
                </div>
              </button>

              <button className="ai-menu-item" onClick={() => handleAddGraph('bar')}>
                <BarChart3 size={14} className="menu-icon" />
                <div>
                  <div className="menu-title">Standard Bar Chart</div>
                  <div className="menu-desc">Metric bars & custom colors</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <Button
          size="sm"
          icon={<Presentation size={14} />}
          onClick={() => onAddCell('board')}
          title="Add a black board / whiteboard cell"
        >
          Board
        </Button>
        <Button
          size="sm"
          icon={<Clock size={14} />}
          onClick={() => onAddCell('delay')}
          title="Add pause delay cell"
        >
          Delay
        </Button>
      </div>
    </div>
  );
};
