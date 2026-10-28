export type CellType = 'code' | 'graph' | 'delay' | 'board';

export type GraphType =
  | 'bar'
  | 'decision-boundary'
  | 'ann'
  | 'cnn'
  | 'rnn'
  | 'lstm'
  | 'yolo'
  | 'clustering'
  | 'gradient-descent'
  | 'matplotlib'
  | 'neural-network'; // backwards-compatible alias for 'ann'

export interface BaseCell {
  id: string;
  type: CellType;
  name: string;
}

export interface CodeCell extends BaseCell {
  type: 'code';
  source: string;
  speed: number; // characters per second
  pause: number; // pause after typing in seconds
  output?: NotebookOutput;
}

export interface NotebookOutput {
  text?: string;
  imageDataUrl?: string;
  mimeType?: string;
}

export type DecisionBoundaryModel = 'svm' | 'logistic' | 'knn';

export interface DecisionBoundaryConfig {
  model: DecisionBoundaryModel;
  pointsCount?: number;
  accuracy?: string;
  showMargin?: boolean;
}

export interface NeuralNetworkConfig {
  layers: number[]; // e.g. [4, 6, 6, 2]
  activation: 'relu' | 'sigmoid' | 'softmax' | 'tanh';
  showProbabilities?: boolean;
}

export interface CnnConfig {
  inputShape?: string; // e.g. '32x32x3'
  kernelSize?: number; // e.g. 3
  featureMaps?: number[]; // e.g. [6, 16]
  classes?: string[];
  filterType?: 'edge' | 'sharpen' | 'gaussian';
}

export interface RnnConfig {
  timeSteps?: number;
  tokens?: string[];
  hiddenDim?: number;
  showRecurrentLoop?: boolean;
}

export interface LstmConfig {
  showGates?: boolean;
  highlightGate?: 'all' | 'forget' | 'input' | 'output';
  cellState?: number;
}

export interface YoloDetection {
  label: string;
  confidence: number;
  color: string;
  x: number; // normalized [0, 1]
  y: number;
  w: number;
  h: number;
}

export interface YoloConfig {
  gridSize?: number; // e.g. 7 or 13
  confidenceThreshold?: number;
  showGrid?: boolean;
  showAnchors?: boolean;
  detections?: YoloDetection[];
}

export type MatplotlibPlotType = 'line' | 'scatter' | 'bar' | 'loss-curve' | 'heatmap';

export interface MatplotlibConfig {
  pythonCode: string;
  plotType: MatplotlibPlotType;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

export type ClusteringMethod = 'tsne' | 'pca' | 'kmeans';

export interface ClusteringConfig {
  method: ClusteringMethod;
  clusters: number; // e.g. 3 or 4
  showCentroids?: boolean;
  showHulls?: boolean;
}

export type LossLandscapeType = 'quadratic' | 'saddle' | 'rosenbrock';

export interface GradientDescentConfig {
  lossLandscape: LossLandscapeType;
  learningRate: number; // e.g. 0.15
  iterations: number; // e.g. 20
  showLossHistory?: boolean;
}

export interface GraphCell extends BaseCell {
  type: 'graph';
  graphType: GraphType;
  // Common graph animation props
  speed: number; // animation speed multiplier
  pause: number; // pause after animation in seconds

  // Specific graph type configs
  data?: number[]; // for bar chart
  barColor?: string;
  bgColor?: string;

  decisionBoundary?: DecisionBoundaryConfig;
  neuralNetwork?: NeuralNetworkConfig;
  cnn?: CnnConfig;
  rnn?: RnnConfig;
  lstm?: LstmConfig;
  yolo?: YoloConfig;
  matplotlib?: MatplotlibConfig;
  clustering?: ClusteringConfig;
  gradientDescent?: GradientDescentConfig;
}

export interface DelayCell extends BaseCell {
  type: 'delay';
  seconds: number;
}

export interface BoardCell extends BaseCell {
  type: 'board';
  seconds: number;
  bgColor: string;
}

export type Cell = CodeCell | GraphCell | DelayCell | BoardCell;
