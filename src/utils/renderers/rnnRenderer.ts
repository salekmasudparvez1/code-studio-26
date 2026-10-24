import { GraphCell } from '../../types/cell';

export function drawRnn(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.rnn || {
    timeSteps: 4,
    tokens: ['Deep', 'Learning', 'Recurrent', 'Sequence'],
    hiddenDim: 64,
  };

  const tokens = config.tokens && config.tokens.length > 0
    ? config.tokens
    : ['Deep', 'Learning', 'Recurrent', 'Sequence'];
  const numSteps = tokens.length;

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'Recurrent Neural Network (RNN Unrolled)', 180, 130);

  // Subtitle
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `Sequential Processing · Hidden State Update: h_t = tanh(W_xh · x_t + W_hh · h_{t-1} + b) · Unrolled Sequence`,
    182,
    172
  );

  const startY = 220;
  const areaW = w - 400;

  // 1. Folded Representation (Left Panel)
  const foldedX = 220;
  const foldedY = startY + 70;
  const foldedBoxW = 140;
  const foldedBoxH = 220;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(foldedX, foldedY, foldedBoxW, foldedBoxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Folded Cell', foldedX + foldedBoxW / 2, foldedY + 18);

  // Node (h)
  const cellCenterX = foldedX + foldedBoxW / 2;
  const cellCenterY = foldedY + 110;

  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cellCenterX, cellCenterY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText('h', cellCenterX, cellCenterY);

  // Input arrow x_t
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cellCenterX, cellCenterY + 75);
  ctx.lineTo(cellCenterX, cellCenterY + 28);
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText('x_t', cellCenterX, cellCenterY + 86);

  // Output arrow y_t
  ctx.beginPath();
  ctx.moveTo(cellCenterX, cellCenterY - 28);
  ctx.lineTo(cellCenterX, cellCenterY - 75);
  ctx.stroke();
  ctx.fillText('y_t', cellCenterX, cellCenterY - 86);

  // Self Recurrent Loop arrow (W_hh)
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cellCenterX + 36, cellCenterY, 20, Math.PI * 0.8, Math.PI * 1.6);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px ui-monospace, monospace';
  ctx.fillText('W_hh', cellCenterX + 68, cellCenterY);

  // 2. Unrolled Representation Across Time (Right Area)
  const unrolledStartX = 440;
  const unrolledW = areaW - 220;
  const stepSpacing = unrolledW / numSteps;

  const activeStepFloat = progress * numSteps;
  const activeStepInt = Math.floor(activeStepFloat);

  for (let t = 0; t < numSteps; t++) {
    const stepX = unrolledStartX + t * stepSpacing + stepSpacing / 2;
    const isProcessed = t <= activeStepInt;
    const isCurrent = t === activeStepInt;

    // Time index tag
    ctx.fillStyle = isCurrent ? '#fbbf24' : '#64748b';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Step t = ${t + 1}`, stepX, foldedY + 18);

    // Hidden State Node h_t
    const nodeY = cellCenterY;
    const nodeRadius = 24;

    // Outer glow for active step
    if (isCurrent) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(stepX, nodeY, nodeRadius + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    const gradient = ctx.createRadialGradient(stepX - 4, nodeY - 4, 2, stepX, nodeY, nodeRadius);
    if (isProcessed) {
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(1, '#0284c7');
    } else {
      gradient.addColorStop(0, '#334155');
      gradient.addColorStop(1, '#0f172a');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(stepX, nodeY, nodeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isCurrent ? '#fbbf24' : isProcessed ? '#38bdf8' : '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.fillText(`h_${t + 1}`, stepX, nodeY);

    // Input Token Box (Bottom)
    const tokenBoxW = 90;
    const tokenBoxH = 34;
    const tokenY = cellCenterY + 70;

    ctx.fillStyle = isCurrent ? 'rgba(56, 189, 248, 0.25)' : '#0c121e';
    ctx.strokeStyle = isCurrent ? '#38bdf8' : '#28334b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(stepX - tokenBoxW / 2, tokenY, tokenBoxW, tokenBoxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.fillText(`"${tokens[t]}"`, stepX, tokenY + tokenBoxH / 2);

    // Input vector arrow up to h_t
    ctx.strokeStyle = isCurrent ? '#38bdf8' : '#475569';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(stepX, tokenY);
    ctx.lineTo(stepX, nodeY + nodeRadius + 4);
    ctx.stroke();

    // Output Prediction Tag (Top)
    const outY = cellCenterY - 80;
    ctx.strokeStyle = isCurrent ? '#4ade80' : '#475569';
    ctx.beginPath();
    ctx.moveTo(stepX, nodeY - nodeRadius - 4);
    ctx.lineTo(stepX, outY);
    ctx.stroke();

    ctx.fillStyle = isCurrent ? '#4ade80' : '#94a3b8';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.fillText(`ŷ_${t + 1}`, stepX, outY - 10);

    // Horizontal Recurrent Connection Arrow (h_{t-1} -> h_t)
    if (t < numSteps - 1) {
      const nextStepX = unrolledStartX + (t + 1) * stepSpacing + stepSpacing / 2;

      ctx.strokeStyle = isProcessed ? '#fbbf24' : '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(stepX + nodeRadius + 4, nodeY);
      ctx.lineTo(nextStepX - nodeRadius - 4, nodeY);
      ctx.stroke();

      // Recurrent weight label
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.fillText('W_hh', (stepX + nextStepX) / 2, nodeY - 14);

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(nextStepX - nodeRadius - 4, nodeY);
      ctx.lineTo(nextStepX - nodeRadius - 12, nodeY - 5);
      ctx.lineTo(nextStepX - nodeRadius - 12, nodeY + 5);
      ctx.closePath();
      ctx.fillStyle = isProcessed ? '#fbbf24' : '#334155';
      ctx.fill();
    }
  }

  // 3. Mathematical Formula Callout Box (Bottom)
  const mathBoxX = 220;
  const mathBoxY = h - 220;
  const mathBoxW = w - 440;
  const mathBoxH = 75;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#28334b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(mathBoxX, mathBoxY, mathBoxW, mathBoxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Recurrent State Equations:', mathBoxX + 20, mathBoxY + 24);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px ui-monospace, monospace';
  ctx.fillText(
    'h_t = tanh( W_xh · x_t  +  W_hh · h_{t-1}  +  b_h )        ŷ_t = softmax( W_hy · h_t  +  b_y )',
    mathBoxX + 20,
    mathBoxY + 50
  );
}
