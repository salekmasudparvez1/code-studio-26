import { GraphCell } from '../../types/cell';
import { clamp } from '../math';

// Deterministic 2D sample data for decision boundary classification
const DATA_POINTS = [
  // Class 0: cluster near (-2, -1) and surroundings
  { x: -3.2, y: -2.1, c: 0 }, { x: -2.8, y: -0.8, c: 0 }, { x: -2.1, y: -1.9, c: 0 },
  { x: -1.5, y: -2.6, c: 0 }, { x: -2.9, y: -2.9, c: 0 }, { x: -1.8, y: -0.6, c: 0 },
  { x: -0.8, y: -1.6, c: 0 }, { x: -2.2, y: 0.2, c: 0 }, { x: -3.6, y: -1.4, c: 0 },
  { x: -1.1, y: -0.9, c: 0 }, { x: -0.5, y: -2.2, c: 0 }, { x: -2.4, y: -3.4, c: 0 },
  { x: -0.2, y: -1.2, c: 0 }, { x: -1.9, y: -1.2, c: 0, sv: true }, { x: -0.6, y: -0.4, c: 0, sv: true },

  // Class 1: cluster near (2, 1.5) and surroundings
  { x: 2.8, y: 2.1, c: 1 }, { x: 2.1, y: 1.2, c: 1 }, { x: 1.6, y: 2.8, c: 1 },
  { x: 3.2, y: 1.6, c: 1 }, { x: 1.2, y: 1.9, c: 1 }, { x: 2.5, y: 3.2, c: 1 },
  { x: 0.9, y: 2.4, c: 1 }, { x: 3.5, y: 2.6, c: 1 }, { x: 2.2, y: 0.6, c: 1 },
  { x: 1.4, y: 0.8, c: 1 }, { x: 3.1, y: 3.6, c: 1 }, { x: 0.4, y: 1.8, c: 1 },
  { x: 0.5, y: 0.9, c: 1, sv: true }, { x: 1.8, y: 0.2, c: 1, sv: true },
];

export function drawDecisionBoundary(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.decisionBoundary || {
    model: 'svm',
    accuracy: '96.4%',
    showMargin: true,
  };

  const model = config.model || 'svm';
  const accuracy = config.accuracy || '96.4%';

  // Chart dimensions
  const chartX = 180;
  const chartY = 190;
  const chartW = w - 360;
  const chartH = h - 330;

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'Decision Boundary Visualization', chartX, 130);

  // Model badge
  let modelLabel = 'SVM (RBF Kernel)';
  if (model === 'logistic') modelLabel = 'Logistic Regression (Sigmoid)';
  if (model === 'knn') modelLabel = 'K-Nearest Neighbors (k=5)';

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Classifier: ${modelLabel} · Accuracy: ${accuracy}`, chartX + 2, 172);

  // Main plot background
  ctx.fillStyle = '#0c121e';
  ctx.fillRect(chartX, chartY, chartW, chartH);
  ctx.strokeStyle = '#28334b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(chartX, chartY, chartW, chartH);

  // Coordinate mapping
  const toScreenX = (val: number) => chartX + ((val + 4.5) / 9) * chartW;
  const toScreenY = (val: number) => chartY + chartH - ((val + 4.5) / 9) * chartH;

  // 1. Draw Background Decision Regions
  const regionAlpha = Math.min(0.2, progress * 0.2);
  // Class 0 Region (bottom-left)
  ctx.fillStyle = `rgba(56, 139, 253, ${regionAlpha})`;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH);
  ctx.lineTo(chartX, toScreenY(0));
  ctx.lineTo(toScreenX(0), chartY + chartH);
  ctx.closePath();
  ctx.fill();

  // Class 1 Region (top-right)
  ctx.fillStyle = `rgba(255, 123, 114, ${regionAlpha})`;
  ctx.beginPath();
  ctx.moveTo(chartX + chartW, chartY);
  ctx.lineTo(chartX + chartW, toScreenY(0));
  ctx.lineTo(toScreenX(0), chartY);
  ctx.closePath();
  ctx.fill();

  // 2. Grid lines
  ctx.strokeStyle = '#182236';
  ctx.lineWidth = 1;
  for (let v = -4; v <= 4; v += 2) {
    const sx = toScreenX(v);
    const sy = toScreenY(v);

    ctx.beginPath();
    ctx.moveTo(sx, chartY);
    ctx.lineTo(sx, chartY + chartH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(chartX, sy);
    ctx.lineTo(chartX + chartW, sy);
    ctx.stroke();

    // Ticks
    ctx.fillStyle = '#64748b';
    ctx.font = '14px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(v), sx, chartY + chartH + 16);
    ctx.textAlign = 'right';
    ctx.fillText(String(v), chartX - 10, sy + 4);
  }

  // Axes lines (x=0, y=0)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  const zeroX = toScreenX(0);
  const zeroY = toScreenY(0);

  ctx.beginPath();
  ctx.moveTo(zeroX, chartY);
  ctx.lineTo(zeroX, chartY + chartH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(chartX, zeroY);
  ctx.lineTo(chartX + chartW, zeroY);
  ctx.stroke();

  // Axis Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Feature X₁ →', chartX + chartW - 12, zeroY - 10);
  ctx.textAlign = 'left';
  ctx.fillText('Feature X₂ ↑', zeroX + 10, chartY + 24);

  // 3. Decision Boundary Line / Hyperplane (animated with progress)
  const animProgress = clamp(progress * 1.2, 0, 1);
  if (animProgress > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(chartX, chartY, chartW, chartH);
    ctx.clip();

    // Primary Decision Boundary
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    const startX = -4.5;
    const endX = -4.5 + animProgress * 9.0;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += 0.1) {
      // Dynamic boundary formula depending on model
      let y = 0;
      if (model === 'svm') {
        y = -0.75 * x + 0.25 * Math.sin(x * 1.2) * 1.1;
      } else if (model === 'logistic') {
        y = -0.8 * x;
      } else {
        // KNN non-linear curve
        y = -0.7 * x + 0.5 * Math.cos(x * 1.5);
      }

      const sx = toScreenX(x);
      const sy = toScreenY(y);
      if (x === startX) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Margin lines (for SVM)
    if (model === 'svm' && config.showMargin !== false) {
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;

      // Positive margin (+1)
      ctx.beginPath();
      for (let x = startX; x <= endX; x += 0.2) {
        const y = -0.75 * x + 0.25 * Math.sin(x * 1.2) * 1.1 + 1.1;
        const sx = toScreenX(x);
        const sy = toScreenY(y);
        if (x === startX) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Negative margin (-1)
      ctx.beginPath();
      for (let x = startX; x <= endX; x += 0.2) {
        const y = -0.75 * x + 0.25 * Math.sin(x * 1.2) * 1.1 - 1.1;
        const sx = toScreenX(x);
        const sy = toScreenY(y);
        if (x === startX) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // 4. Data Points
  DATA_POINTS.forEach((p, idx) => {
    // Stagger point appearance slightly with progress
    const pointThreshold = (idx / DATA_POINTS.length) * 0.4;
    if (progress < pointThreshold) return;

    const sx = toScreenX(p.x);
    const sy = toScreenY(p.y);

    const isClass0 = p.c === 0;
    const dotColor = isClass0 ? '#38bdf8' : '#f87171';
    const glowColor = isClass0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(248, 113, 113, 0.35)';

    // Outer glow
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.fill();

    // Inner dot
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Highlight Support Vectors
    if (p.sv && model === 'svm') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // 5. Legend & Info HUD (Top Right inside chart)
  const hudW = 260;
  const hudH = 130;
  const hudX = chartX + chartW - hudW - 16;
  const hudY = chartY + 16;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 8);
  ctx.fill();
  ctx.stroke();

  // Legend Items
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(hudX + 22, hudY + 28, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Class 0 (y = -1)', hudX + 38, hudY + 28);

  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(hudX + 22, hudY + 56, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Class 1 (y = +1)', hudX + 38, hudY + 56);

  if (model === 'svm') {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hudX + 22, hudY + 84, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Support Vectors (SV)', hudX + 38, hudY + 84);
  } else {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hudX + 14, hudY + 84);
    ctx.lineTo(hudX + 30, hudY + 84);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Decision Boundary', hudX + 38, hudY + 84);
  }

  // Margin width notation
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('Margin: 2 / ||w|| = 0.42', hudX + 16, hudY + 112);
}

