import { GraphCell } from '../../types/cell';
import { clamp } from '../math';

export function drawMatplotlib(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.matplotlib || {
    plotType: 'line',
    title: 'Model Convergence (Epochs vs Loss)',
    xLabel: 'Epoch',
    yLabel: 'Cross-Entropy Loss',
    showGrid: true,
    showLegend: true,
    pythonCode: 'plt.plot(epochs, train_loss)\nplt.plot(epochs, val_loss)\nplt.show()',
  };

  // Main Canvas bounds for Matplotlib Window
  const winX = 180;
  const winY = 130;
  const winW = w - 360;
  const winH = h - 250;

  // Window frame styling (Matplotlib Figure Window)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, winH, 8);
  ctx.fill();
  ctx.stroke();

  // Matplotlib Figure Window Titlebar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(winX, winY, winW, 36);
  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(winX, winY + 36);
  ctx.lineTo(winX + winW, winY + 36);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Figure 1 · Matplotlib (Interactive Qt/TkAgg backend)', winX + 16, winY + 18);

  // Matplotlib Toolbar Icons (Home, Back, Forward, Pan, Zoom, Config, Save)
  const toolbarY = winY + 36;
  const toolbarH = 34;
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(winX, toolbarY, winW, toolbarH);
  ctx.strokeStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(winX, toolbarY + toolbarH);
  ctx.lineTo(winX + winW, toolbarY + toolbarH);
  ctx.stroke();

  const toolIcons = ['⌂ Home', '← Back', '→ Fwd', '✥ Pan', '🔍 Zoom', '⚙ Subplots', '💾 Save'];
  let toolX = winX + 16;
  ctx.font = '12px system-ui, sans-serif';
  toolIcons.forEach((t) => {
    ctx.fillStyle = '#64748b';
    ctx.fillText(t, toolX, toolbarY + toolbarH / 2);
    toolX += ctx.measureText(t).width + 24;
  });

  // Coordinates readout on far right of toolbar
  const coordX = (progress * 24).toFixed(2);
  const coordY = (1.8 * Math.exp(-Number(coordX) / 5) + 0.15).toFixed(3);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`x=${coordX}  y=${coordY}`, winX + winW - 18, toolbarY + toolbarH / 2);
  ctx.textAlign = 'left';

  // Axes plot bounds
  const axesX = winX + 100;
  const axesY = toolbarY + toolbarH + 60;
  const axesW = winW - 160;
  const axesH = winH - (toolbarH + 36 + 130);

  // Axes Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(axesX, axesY, axesW, axesH);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(axesX, axesY, axesW, axesH);

  // Plot Title
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.title || 'Matplotlib Figure Output', axesX + axesW / 2, axesY - 24);

  // Grid Lines
  if (config.showGrid !== false) {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let i = 1; i <= 6; i++) {
      const gy = axesY + (axesH / 6) * i;
      ctx.beginPath();
      ctx.moveTo(axesX, gy);
      ctx.lineTo(axesX + axesW, gy);
      ctx.stroke();

      const gx = axesX + (axesW / 6) * i;
      ctx.beginPath();
      ctx.moveTo(gx, axesY);
      ctx.lineTo(gx, axesY + axesH);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Y-Axis Ticks & Label
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const yVal = (2.0 * (1 - i / 5)).toFixed(1);
    const ty = axesY + (axesH / 5) * i;
    ctx.fillText(yVal, axesX - 12, ty + 4);
  }

  // Y-Axis Label
  ctx.save();
  ctx.translate(axesX - 55, axesY + axesH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(config.yLabel || 'Loss', 0, 0);
  ctx.restore();

  // X-Axis Ticks & Label
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const xVal = String(i * 5);
    const tx = axesX + (axesW / 5) * i;
    ctx.fillText(xVal, tx, axesY + axesH + 20);
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(config.xLabel || 'Epoch', axesX + axesW / 2, axesY + axesH + 45);

  // Progressive Curves Drawing based on progress
  const numPoints = 60;
  const drawCount = Math.floor(clamp(progress * 1.1, 0, 1) * numPoints);

  const trainLossPts: { x: number; y: number }[] = [];
  const valLossPts: { x: number; y: number }[] = [];

  for (let p = 0; p <= numPoints; p++) {
    const epoch = (p / numPoints) * 25;
    const tLoss = 1.8 * Math.exp(-epoch / 5) + 0.15;
    const vLoss = 1.9 * Math.exp(-epoch / 6.5) + 0.26 + 0.04 * Math.sin(epoch * 1.5);

    const px = axesX + (p / numPoints) * axesW;
    const py1 = axesY + axesH - (tLoss / 2.0) * axesH;
    const py2 = axesY + axesH - (vLoss / 2.0) * axesH;

    trainLossPts.push({ x: px, y: py1 });
    valLossPts.push({ x: px, y: py2 });
  }

  // Draw Train Loss Curve (Cyan)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= drawCount && i < trainLossPts.length; i++) {
    if (i === 0) ctx.moveTo(trainLossPts[i].x, trainLossPts[i].y);
    else ctx.lineTo(trainLossPts[i].x, trainLossPts[i].y);
  }
  ctx.stroke();

  // Draw Val Loss Curve (Rose)
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= drawCount && i < valLossPts.length; i++) {
    if (i === 0) ctx.moveTo(valLossPts[i].x, valLossPts[i].y);
    else ctx.lineTo(valLossPts[i].x, valLossPts[i].y);
  }
  ctx.stroke();

  // Draw Current Leading Point dots
  if (drawCount > 0 && drawCount < trainLossPts.length) {
    const pt1 = trainLossPts[drawCount];
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pt1.x, pt1.y, 6, 0, Math.PI * 2);
    ctx.fill();

    const pt2 = valLossPts[drawCount];
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(pt2.x, pt2.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Matplotlib Legend Box (Top Right inside axes)
  if (config.showLegend !== false) {
    const legX = axesX + axesW - 170;
    const legY = axesY + 16;
    const legW = 150;
    const legH = 70;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legX, legY, legW, legH, 4);
    ctx.fill();
    ctx.stroke();

    // Train legend
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(legX + 12, legY + 22);
    ctx.lineTo(legX + 36, legY + 22);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Train Loss', legX + 46, legY + 22);

    // Val legend
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(legX + 12, legY + 48);
    ctx.lineTo(legX + 36, legY + 48);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Val Loss', legX + 46, legY + 48);
  }
}

