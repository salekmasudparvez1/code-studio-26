import { GraphCell } from '../../types/cell';

export function drawGradientDescent(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.gradientDescent || {
    lossLandscape: 'quadratic',
    learningRate: 0.15,
    iterations: 20,
    showLossHistory: true,
  };

  const lr = config.learningRate || 0.15;
  const maxIterations = config.iterations || 20;

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'Gradient Descent Optimization', 180, 130);

  // Subtitle
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `Objective: min J(w₁, w₂) = w₁² + 0.7w₂² · Update: w_{t+1} = w_t - η∇J(w_t) · η = ${lr.toFixed(2)}`,
    182,
    172
  );

  // Layout: Left = 2D Loss Contours, Right = Loss curve & Stats HUD
  const leftX = 180;
  const leftY = 200;
  const leftW = (w - 420) * 0.6;
  const leftH = h - 340;

  const rightX = leftX + leftW + 30;
  const rightY = leftY;
  const rightW = w - rightX - 60;
  const rightH = leftH;

  // 1. LEFT PANEL: 2D Loss Contours
  ctx.fillStyle = '#0c121e';
  ctx.fillRect(leftX, leftY, leftW, leftH);
  ctx.strokeStyle = '#28334b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(leftX, leftY, leftW, leftH);

  // Coordinate mapping for contours
  const toScreenX = (val: number) => leftX + ((val + 4) / 8) * leftW;
  const toScreenY = (val: number) => leftY + leftH - ((val + 4) / 8) * leftH;

  // Concentric Elliptical Contours of J(w) = w1^2 + 0.7 * w2^2
  const centerSX = toScreenX(0);
  const centerSY = toScreenY(0);

  const contourLevels = [0.5, 1.2, 2.2, 3.5, 5.0, 7.0, 9.5, 12.5];
  contourLevels.forEach((level, idx) => {
    const rx = (level / 8) * (leftW * 0.45);
    const ry = (level / 8) * (leftH * 0.45) * 0.85;

    ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 + idx * 0.03})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(centerSX, centerSY, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Value label along contour
    ctx.fillStyle = '#475569';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`J=${level.toFixed(1)}`, centerSX + rx + 8, centerSY);
  });

  // Cross axes
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerSX, leftY);
  ctx.lineTo(centerSX, leftY + leftH);
  ctx.moveTo(leftX, centerSY);
  ctx.lineTo(leftX + leftW, centerSY);
  ctx.stroke();

  // Axis Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Weight w₁ →', leftX + leftW - 10, centerSY - 8);
  ctx.textAlign = 'left';
  ctx.fillText('Weight w₂ ↑', centerSX + 8, leftY + 16);

  // Global Minimum Marker
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(centerSX, centerSY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 11px ui-monospace, monospace';
  ctx.fillText('w* = (0,0)', centerSX + 10, centerSY + 14);

  // 2. Compute Gradient Descent Trajectory
  // J(w) = w1^2 + 0.7 * w2^2 -> grad = [2*w1, 1.4*w2]
  let currentW = { x: -3.4, y: 3.2 };
  const trajectory: { x: number; y: number; loss: number; gradX: number; gradY: number }[] = [];

  for (let step = 0; step <= maxIterations; step++) {
    const loss = currentW.x * currentW.x + 0.7 * currentW.y * currentW.y;
    const gradX = 2 * currentW.x;
    const gradY = 1.4 * currentW.y;

    trajectory.push({
      x: currentW.x,
      y: currentW.y,
      loss,
      gradX,
      gradY,
    });

    // Step update
    currentW = {
      x: currentW.x - lr * gradX,
      y: currentW.y - lr * gradY,
    };
  }

  // Current interpolated step based on progress
  const activeStepFloat = progress * maxIterations;
  const activeStepInt = Math.floor(activeStepFloat);
  const frac = activeStepFloat - activeStepInt;

  // Draw Path Lines up to current step
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= activeStepInt && i < trajectory.length; i++) {
    const sx = toScreenX(trajectory[i].x);
    const sy = toScreenY(trajectory[i].y);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Draw Path Markers
  for (let i = 0; i <= activeStepInt && i < trajectory.length; i++) {
    const sx = toScreenX(trajectory[i].x);
    const sy = toScreenY(trajectory[i].y);

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Current Moving Ball with Gradient Arrow
  if (activeStepInt < trajectory.length) {
    const p1 = trajectory[activeStepInt];
    const p2 = trajectory[Math.min(activeStepInt + 1, trajectory.length - 1)];

    const curX = p1.x + (p2.x - p1.x) * frac;
    const curY = p1.y + (p2.y - p1.y) * frac;
    const curSX = toScreenX(curX);
    const curSY = toScreenY(curY);

    // Glowing Optimizer Ball
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(curSX, curSY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(curSX, curSY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Negative Gradient Vector Arrow (-∇J)
    const arrowLen = 35;
    const norm = Math.hypot(p1.gradX, p1.gradY) || 1;
    const dirX = (-p1.gradX / norm) * arrowLen;
    const dirY = (p1.gradY / norm) * arrowLen; // invert Y for screen coords

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(curSX, curSY);
    ctx.lineTo(curSX + dirX, curSY + dirY);
    ctx.stroke();
  }

  // 3. RIGHT PANEL: Loss History Curve & Real-Time Metrics HUD
  const hudH = 170;
  const lossCurveH = rightH - hudH - 20;

  // A. Loss vs Iterations Plot
  ctx.fillStyle = '#0c121e';
  ctx.fillRect(rightX, rightY, rightW, lossCurveH);
  ctx.strokeStyle = '#28334b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rightX, rightY, rightW, lossCurveH);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Loss Reduction Curve J(t)', rightX + 16, rightY + 22);

  // Plotting loss line
  const maxLoss = trajectory[0].loss;
  const toCurveX = (step: number) => rightX + 30 + (step / maxIterations) * (rightW - 50);
  const toCurveY = (lossVal: number) => rightY + lossCurveH - 24 - (lossVal / maxLoss) * (lossCurveH - 60);

  // Grid in loss plot
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightX + 30, rightY + lossCurveH - 24);
  ctx.lineTo(rightX + rightW - 20, rightY + lossCurveH - 24);
  ctx.stroke();

  // Loss curve path up to current step
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i <= activeStepInt && i < trajectory.length; i++) {
    const cx = toCurveX(i);
    const cy = toCurveY(trajectory[i].loss);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // Highlight current loss dot
  const curLoss = trajectory[Math.min(activeStepInt, trajectory.length - 1)].loss;
  const dotCX = toCurveX(activeStepInt);
  const dotCY = toCurveY(curLoss);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(dotCX, dotCY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Axis labels
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('0', rightX + 30, rightY + lossCurveH - 10);
  ctx.fillText(`t=${maxIterations}`, rightX + rightW - 40, rightY + lossCurveH - 10);
  ctx.fillText(`J=0`, rightX + 6, rightY + lossCurveH - 22);
  ctx.fillText(`J₀`, rightX + 8, rightY + 45);

  // B. Metrics HUD Box (Bottom Right)
  const hudBoxY = rightY + lossCurveH + 20;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rightX, hudBoxY, rightW, hudH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Optimization Telemetry', rightX + 16, hudBoxY + 24);

  const curGradNorm = Math.hypot(
    trajectory[Math.min(activeStepInt, trajectory.length - 1)].gradX,
    trajectory[Math.min(activeStepInt, trajectory.length - 1)].gradY
  );

  const statItems = [
    { label: 'Step Iteration', val: `${Math.min(activeStepInt, maxIterations)} / ${maxIterations}` },
    { label: 'Learning Rate (η)', val: lr.toFixed(2) },
    { label: 'Current Loss J(w)', val: curLoss.toFixed(4) },
    { label: 'Gradient ||∇J||', val: curGradNorm.toFixed(4) },
  ];

  statItems.forEach((item, idx) => {
    const iy = hudBoxY + 54 + idx * 24;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(item.label, rightX + 16, iy);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(item.val, rightX + rightW - 16, iy);
    ctx.textAlign = 'left';
  });

  // Status pill
  const isConverged = curLoss < 0.05 || activeStepInt >= maxIterations - 2;
  const statusColor = isConverged ? '#4ade80' : '#fbbf24';
  const statusText = isConverged ? '✓ Converged (At Global Min)' : '⚡ Stepping Down Gradient...';

  ctx.fillStyle = statusColor;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(statusText, rightX + 16, hudBoxY + hudH - 14);
}
