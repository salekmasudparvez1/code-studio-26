import { GraphCell } from '../../types/cell';
import { clamp } from '../math';

export function drawCnn(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.cnn || {
    inputShape: '32x32x3',
    kernelSize: 3,
    featureMaps: [6, 16],
    classes: ['Airplane', 'Automobile', 'Bird', 'Cat', 'Dog'],
    filterType: 'edge',
  };

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'Convolutional Neural Network (CNN)', 180, 130);

  // Subtitle
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `Input [${config.inputShape || '32×32×3'}] → Conv2D (3×3) → MaxPool (2×2) → Conv2D (3×3) → Flatten → Dense (Softmax)`,
    182,
    172
  );

  const startY = 210;
  const areaH = h - 350;

  // 1. Draw Input Image Volume (3 RGB channels)
  const inputX = 220;
  const inputY = startY + 60;
  const imgSize = 130;

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Input Image', inputX + imgSize / 2, startY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('32 × 32 × 3', inputX + imgSize / 2, startY + 38);

  // 3 offset isometric/perspective slices for RGB
  const rgbColors = [
    { fill: 'rgba(239, 68, 68, 0.25)', stroke: '#ef4444' }, // Red
    { fill: 'rgba(34, 197, 94, 0.25)', stroke: '#22c55e' }, // Green
    { fill: 'rgba(59, 130, 246, 0.25)', stroke: '#3b82f6' }, // Blue
  ];

  rgbColors.forEach((ch, idx) => {
    const ox = inputX + idx * 16;
    const oy = inputY - idx * 14;

    ctx.fillStyle = ch.fill;
    ctx.strokeStyle = ch.stroke;
    ctx.lineWidth = 1.5;
    ctx.fillRect(ox, oy, imgSize, imgSize);
    ctx.strokeRect(ox, oy, imgSize, imgSize);

    // Subtle pixel grid
    ctx.strokeStyle = ch.stroke + '33';
    ctx.lineWidth = 0.5;
    for (let g = 20; g < imgSize; g += 20) {
      ctx.beginPath();
      ctx.moveTo(ox + g, oy);
      ctx.lineTo(ox + g, oy + imgSize);
      ctx.moveTo(ox, oy + g);
      ctx.lineTo(ox + imgSize, oy + g);
      ctx.stroke();
    }
  });

  // Animated Sliding Kernel (3x3 receptive field) on input
  const topSliceOx = inputX + 2 * 16;
  const topSliceOy = inputY - 2 * 14;
  const kernelDim = 32;

  // Kernel coordinates sliding from top-left to bottom-right with progress
  const sweepCols = 3;
  const sweepProgress = (progress * 4) % 1;
  const sweepStep = Math.floor(progress * 4);
  const kGridX = (sweepStep % sweepCols) * 32 + sweepProgress * 24;
  const kGridY = Math.floor(sweepStep / sweepCols) * 32;

  const kernelX = clamp(topSliceOx + kGridX, topSliceOx, topSliceOx + imgSize - kernelDim);
  const kernelY = clamp(topSliceOy + kGridY, topSliceOy, topSliceOy + imgSize - kernelDim);

  ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.fillRect(kernelX, kernelY, kernelDim, kernelDim);
  ctx.strokeRect(kernelX, kernelY, kernelDim, kernelDim);

  // 2. Conv 1 Feature Maps (6 slices)
  const conv1X = 460;
  const conv1Y = startY + 50;
  const conv1Size = 110;
  const numMaps1 = 6;

  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Conv1 (ReLU)', conv1X + conv1Size / 2, startY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('28 × 28 × 6', conv1X + conv1Size / 2, startY + 38);

  for (let m = 0; m < numMaps1; m++) {
    const ox = conv1X + m * 14;
    const oy = conv1Y - m * 12;

    ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.2;
    ctx.fillRect(ox, oy, conv1Size, conv1Size);
    ctx.strokeRect(ox, oy, conv1Size, conv1Size);
  }

  // Projection beam from Kernel on Input -> Single pixel on Conv1
  const targetConv1X = conv1X + (numMaps1 - 1) * 14 + (kernelX - topSliceOx) * 0.85;
  const targetConv1Y = conv1Y - (numMaps1 - 1) * 12 + (kernelY - topSliceOy) * 0.85;

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(targetConv1X, targetConv1Y, 8, 8);

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(kernelX + kernelDim, kernelY);
  ctx.lineTo(targetConv1X, targetConv1Y);
  ctx.moveTo(kernelX + kernelDim, kernelY + kernelDim);
  ctx.lineTo(targetConv1X + 8, targetConv1Y + 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. MaxPool 1 (Downsampled 14x14x6)
  const pool1X = 660;
  const pool1Y = startY + 70;
  const pool1Size = 80;

  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MaxPool 2×2', pool1X + pool1Size / 2, startY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('14 × 14 × 6', pool1X + pool1Size / 2, startY + 38);

  for (let m = 0; m < 4; m++) {
    const ox = pool1X + m * 12;
    const oy = pool1Y - m * 10;

    ctx.fillStyle = 'rgba(236, 72, 153, 0.18)';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.2;
    ctx.fillRect(ox, oy, pool1Size, pool1Size);
    ctx.strokeRect(ox, oy, pool1Size, pool1Size);
  }

  // 4. Conv 2 Feature Maps (16 channels)
  const conv2X = 820;
  const conv2Y = startY + 85;
  const conv2Size = 65;

  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Conv2 (ReLU)', conv2X + conv2Size / 2, startY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('10 × 10 × 16', conv2X + conv2Size / 2, startY + 38);

  for (let m = 0; m < 8; m++) {
    const ox = conv2X + m * 10;
    const oy = conv2Y - m * 8;

    ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.2;
    ctx.fillRect(ox, oy, conv2Size, conv2Size);
    ctx.strokeRect(ox, oy, conv2Size, conv2Size);
  }

  // 5. Flattened Dense Layer (Vertical Vector)
  const denseX = 1000;
  const denseY = startY + 20;
  const denseH = areaH - 40;

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Flatten / FC', denseX + 15, startY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText('120 units', denseX + 15, startY + 38);

  const numUnits = 14;
  const spacing = (denseH - 60) / numUnits;
  for (let u = 0; u < numUnits; u++) {
    const uy = denseY + 50 + u * spacing;

    // Glowing connection line from Conv2 to dense
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(conv2X + 80, conv2Y);
    ctx.lineTo(denseX, uy);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(denseX + 15, uy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Right Output Classification Softmax Logits
  const predX = w - 420;
  const predY = startY + 10;
  const predW = 340;
  const predH = 290;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(predX, predY, predW, predH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Class Predictions (Softmax)', predX + 18, predY + 26);

  const classes = [
    { name: 'Dog', prob: 0.924, color: '#4ade80' },
    { name: 'Cat', prob: 0.052, color: '#38bdf8' },
    { name: 'Horse', prob: 0.014, color: '#c084fc' },
    { name: 'Automobile', prob: 0.007, color: '#fbbf24' },
    { name: 'Airplane', prob: 0.003, color: '#94a3b8' },
  ];

  const revealProgress = clamp(progress * 1.3, 0, 1);

  classes.forEach((c, idx) => {
    const itemY = predY + 65 + idx * 42;
    const curProb = c.prob * revealProgress;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(c.name, predX + 18, itemY);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${(curProb * 100).toFixed(1)}%`, predX + predW - 18, itemY);

    // Progress bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(predX + 18, itemY + 8, predW - 36, 10);
    ctx.fillStyle = c.color;
    ctx.fillRect(predX + 18, itemY + 8, (predW - 36) * curProb, 10);
  });
}

