import {
  Cell,
  CodeCell,
  GraphCell,
  DelayCell,
  BoardCell,
  GraphType,
} from '../types/cell';

export const uid = (): string =>
  'cell_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

export function createCodeCell(overrides: Partial<CodeCell> = {}): CodeCell {
  return {
    id: uid(),
    type: 'code',
    name: 'model_training.py',
    source:
      'import torch\nimport torch.nn as nn\n\nclass Net(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.conv1 = nn.Conv2d(3, 16, 3)\n        self.fc = nn.Linear(16 * 14 * 14, 10)\n\n    def forward(self, x):\n        return self.fc(self.conv1(x))',
    speed: 20,
    pause: 2,
    ...overrides,
  };
}

export function createGraphCell(overrides: Partial<GraphCell> = {}): GraphCell {
  const graphType: GraphType = overrides.graphType || 'ann';

  let defaultName = 'ANN Architecture';
  if (graphType === 'cnn') defaultName = 'CNN Feature Maps & Kernels';
  else if (graphType === 'rnn') defaultName = 'RNN Recurrent Sequence Unrolled';
  else if (graphType === 'lstm') defaultName = 'LSTM Memory Cell & Gates';
  else if (graphType === 'yolo') defaultName = 'YOLOv8 Object Detection';
  else if (graphType === 'matplotlib') defaultName = 'Matplotlib Custom Plot (plt.show)';
  else if (graphType === 'decision-boundary') defaultName = 'SVM Decision Boundary';
  else if (graphType === 'clustering') defaultName = 't-SNE Embeddings & Clusters';
  else if (graphType === 'gradient-descent') defaultName = 'Gradient Descent Optimization';
  else if (graphType === 'bar') defaultName = 'Metrics Bar Chart';

  return {
    id: uid(),
    type: 'graph',
    name: overrides.name || defaultName,
    speed: 1.2,
    pause: 2,
    data: [12, 28, 18, 34, 22, 42, 30],
    barColor: '#7c9cff',
    bgColor: '#0d1117',
    decisionBoundary: {
      model: 'svm',
      pointsCount: 36,
      accuracy: '96.4%',
      showMargin: true,
    },
    neuralNetwork: {
      layers: [4, 6, 6, 2],
      activation: 'relu',
      showProbabilities: true,
    },
    cnn: {
      inputShape: '32x32x3',
      kernelSize: 3,
      featureMaps: [6, 16],
      classes: ['Airplane', 'Automobile', 'Bird', 'Cat', 'Dog'],
      filterType: 'edge',
    },
    rnn: {
      timeSteps: 4,
      tokens: ['Deep', 'Learning', 'Recurrent', 'Sequence'],
      hiddenDim: 64,
      showRecurrentLoop: true,
    },
    lstm: {
      showGates: true,
      highlightGate: 'all',
      cellState: 1,
    },
    yolo: {
      gridSize: 7,
      confidenceThreshold: 0.6,
      showGrid: true,
      showAnchors: true,
      detections: [
        { label: 'car', confidence: 0.94, color: '#38bdf8', x: 0.18, y: 0.42, w: 0.28, h: 0.26 },
        { label: 'person', confidence: 0.89, color: '#4ade80', x: 0.54, y: 0.32, w: 0.12, h: 0.42 },
        { label: 'dog', confidence: 0.92, color: '#fbbf24', x: 0.72, y: 0.56, w: 0.16, h: 0.22 },
      ],
    },
    matplotlib: {
      plotType: 'line',
      title: 'Loss vs Validation Epochs',
      xLabel: 'Epoch',
      yLabel: 'Cross-Entropy Loss',
      showGrid: true,
      showLegend: true,
      pythonCode:
        'import matplotlib.pyplot as plt\nimport numpy as np\n\nepochs = np.arange(1, 25)\ntrain_loss = 1.8 * np.exp(-epochs / 5) + 0.15\nval_loss = 1.9 * np.exp(-epochs / 6) + 0.22\n\nplt.figure(figsize=(10, 6))\nplt.plot(epochs, train_loss, label="Train Loss", color="#38bdf8", lw=2.5)\nplt.plot(epochs, val_loss, label="Val Loss", color="#f43f5e", lw=2.5)\nplt.title("Model Convergence")\nplt.xlabel("Epoch")\nplt.ylabel("Loss")\nplt.legend()\nplt.grid(True)\nplt.show()',
    },
    clustering: {
      method: 'tsne',
      clusters: 3,
      showCentroids: true,
      showHulls: true,
    },
    gradientDescent: {
      lossLandscape: 'quadratic',
      learningRate: 0.15,
      iterations: 20,
      showLossHistory: true,
    },
    ...overrides,
    graphType,
  };
}

export function createDecisionBoundaryCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'Decision Boundary (SVM)',
    graphType: 'decision-boundary',
    ...overrides,
  });
}

export function createNeuralNetworkCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'ANN Multi-Layer Perceptron',
    graphType: 'ann',
    ...overrides,
  });
}

export function createCnnCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'CNN Convolution & Pooling',
    graphType: 'cnn',
    ...overrides,
  });
}

export function createRnnCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'RNN Recurrent Loop Unrolled',
    graphType: 'rnn',
    ...overrides,
  });
}

export function createLstmCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'LSTM Gates & Memory State',
    graphType: 'lstm',
    ...overrides,
  });
}

export function createYoloCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'YOLOv8 Object Detection',
    graphType: 'yolo',
    ...overrides,
  });
}

export function createMatplotlibCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'Matplotlib Graph Show',
    graphType: 'matplotlib',
    ...overrides,
  });
}

export function createClusteringCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 't-SNE Embeddings',
    graphType: 'clustering',
    ...overrides,
  });
}

export function createGradientDescentCell(overrides: Partial<GraphCell> = {}): GraphCell {
  return createGraphCell({
    name: 'Gradient Descent Path',
    graphType: 'gradient-descent',
    ...overrides,
  });
}

export function createDelayCell(overrides: Partial<DelayCell> = {}): DelayCell {
  return {
    id: uid(),
    type: 'delay',
    name: 'End Delay',
    seconds: 3,
    ...overrides,
  };
}

export function createBoardCell(overrides: Partial<BoardCell> = {}): BoardCell {
  const bgColor = overrides.bgColor ?? '#000000';
  const isWhite = bgColor.replace(/\s/g, '').toLowerCase() === '#ffffff';
  return {
    id: uid(),
    type: 'board',
    name: isWhite ? 'Whiteboard' : 'Black board',
    seconds: 8,
    bgColor,
    ...overrides,
  };
}

export const INITIAL_CELLS: Cell[] = [
  createCodeCell({
    name: 'deep_learning.py',
    source:
      'import torch\nimport torch.nn as nn\n\n# Modern Vision & Sequence Models\ncnn = nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3)\nlstm = nn.LSTM(input_size=64, hidden_size=128, batch_first=True)\n\nprint("Models initialized successfully!")',
  }),
  createCnnCell({ name: 'CNN Feature Extraction' }),
  createRnnCell({ name: 'RNN Temporal Sequence' }),
  createLstmCell({ name: 'LSTM Memory Highway' }),
  createYoloCell({ name: 'YOLOv8 Detection & Grid' }),
  createMatplotlibCell({ name: 'Matplotlib Loss Plot' }),
  createDelayCell({ name: 'Conclusion', seconds: 3 }),
];

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
