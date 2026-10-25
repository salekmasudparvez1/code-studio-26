export type OverlayKind =
  | 'text'
  | 'path'
  | 'arrow'
  | 'ellipse'
  | 'rect'
  | 'highlight';

export type OverlayTool =
  | 'select'
  | 'text'
  | 'pen'
  | 'arrow'
  | 'ellipse'
  | 'rect'
  | 'highlight'
  | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface OverlayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OverlayBase {
  id: string;
  name: string;
  kind: OverlayKind;
  startTime: number;
  endTime: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface TextOverlay extends OverlayBase {
  kind: 'text';
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  background: string | null;
  padding: number;
}

export interface PathOverlay extends OverlayBase {
  kind: 'path';
  points: Point[];
  stroke: string;
  strokeWidth: number;
}

export interface HighlightOverlay extends OverlayBase {
  kind: 'highlight';
  points: Point[];
  stroke: string;
  strokeWidth: number;
}

export interface ArrowOverlay extends OverlayBase {
  kind: 'arrow';
  x: number;
  y: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}

export interface EllipseOverlay extends OverlayBase {
  kind: 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill: string | null;
}

export interface RectOverlay extends OverlayBase {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill: string | null;
}

export type Overlay =
  | TextOverlay
  | PathOverlay
  | HighlightOverlay
  | ArrowOverlay
  | EllipseOverlay
  | RectOverlay;

export interface OverlayDrawStyle {
  stroke: string;
  strokeWidth: number;
  fill: string | null;
  color: string;
  background: string | null;
  fontFamily: string;
  fontSize: number;
}

export const DEFAULT_OVERLAY_STYLE: OverlayDrawStyle = {
  stroke: '#facc15',
  strokeWidth: 6,
  fill: null,
  color: '#ffffff',
  background: 'rgba(15, 23, 42, 0.72)',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 42,
};

export type OverlayPatch = Partial<{
  name: string;
  startTime: number;
  endTime: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  text: string;
  x: number;
  y: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  background: string | null;
  padding: number;
  points: Point[];
  stroke: string;
  strokeWidth: number;
  fill: string | null;
}>;

export const OVERLAY_FONTS = [
  { value: 'system-ui, sans-serif', label: 'Sans' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif' },
  { value: 'ui-monospace, Consolas, monospace', label: 'Mono' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
];
