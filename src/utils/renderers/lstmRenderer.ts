import { GraphCell } from '../../types/cell';

export function drawLstm(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'LSTM Cell Architecture & Memory Highway', 180, 130);

  // Subtitle
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    'Long Short-Term Memory · Cell State (C_t) · Forget Gate (f_t) · Input Gate (i_t) · Output Gate (o_t)',
    182,
    172
  );

  const startY = 220;
  const boxX = 220;
  const boxY = startY + 20;
  const boxW = w - 440;
  const boxH = h - 360;

  // Outer LSTM Cell Enclosure
  ctx.fillStyle = '#0c121e';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 16);
  ctx.fill();
  ctx.stroke();

  // Highlight active gate depending on progress
  // Phase 0..0.3: Forget Gate, 0.3..0.6: Input Gate, 0.6..0.85: Cell State Update, 0.85..1.0: Output Gate
  const activeGate =
    progress < 0.28 ? 'forget' : progress < 0.6 ? 'input' : progress < 0.82 ? 'cell' : 'output';

  // 1. Top Highway: Cell State (C_{t-1} -> C_t)
  const cellHighwayY = boxY + 60;
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(boxX - 40, cellHighwayY);
  ctx.lineTo(boxX + boxW + 40, cellHighwayY);
  ctx.stroke();

  // Highway labels
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('C_{t-1}', boxX - 48, cellHighwayY - 8);
  ctx.textAlign = 'left';
  ctx.fillText('C_t (Cell State)', boxX + boxW + 48, cellHighwayY - 8);

  // 2. Bottom Line: Hidden State (h_{t-1} -> h_t)
  const hiddenLineY = boxY + boxH - 50;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(boxX - 40, hiddenLineY);
  ctx.lineTo(boxX + boxW + 40, hiddenLineY);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'right';
  ctx.fillText('h_{t-1}', boxX - 48, hiddenLineY - 8);
  ctx.textAlign = 'left';
  ctx.fillText('h_t (Hidden State)', boxX + boxW + 48, hiddenLineY - 8);

  // 3. Input vector x_t coming in from bottom
  const inputX = boxX + 100;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(inputX, boxY + boxH + 40);
  ctx.lineTo(inputX, hiddenLineY);
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('x_t (Input)', inputX, boxY + boxH + 55);

  // Pointwise operations on highway
  // Multiply node (x) for forget gate
  const multX = boxX + 260;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(multX, cellHighwayY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⊗', multX, cellHighwayY);

  // Add node (+) for candidate update
  const addX = boxX + 540;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(addX, cellHighwayY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px ui-monospace, monospace';
  ctx.fillText('⊕', addX, cellHighwayY);

  // 4. Gate Boxes inside LSTM
  const gateY = boxY + 170;
  const gateW = 68;
  const gateH = 48;

  // A. Forget Gate (sigma)
  const fgX = multX;
  const isFgActive = activeGate === 'forget';
  ctx.fillStyle = isFgActive ? 'rgba(239, 68, 68, 0.4)' : '#1e293b';
  ctx.strokeStyle = isFgActive ? '#ef4444' : '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(fgX - gateW / 2, gateY, gateW, gateH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.fillText('σ', fgX, gateY + gateH / 2);

  ctx.fillStyle = isFgActive ? '#f87171' : '#94a3b8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Forget Gate (f_t)', fgX, gateY + gateH + 20);

  // Connection from input line up to forget gate and up to mult node
  ctx.strokeStyle = isFgActive ? '#ef4444' : '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fgX, hiddenLineY);
  ctx.lineTo(fgX, gateY + gateH);
  ctx.moveTo(fgX, gateY);
  ctx.lineTo(fgX, cellHighwayY + 18);
  ctx.stroke();

  // B. Input Gate (sigma) & Candidate State (tanh)
  const igX = boxX + 460;
  const candX = boxX + 600;
  const isIgActive = activeGate === 'input';

  // Input Gate sigma
  ctx.fillStyle = isIgActive ? 'rgba(34, 197, 94, 0.4)' : '#1e293b';
  ctx.strokeStyle = isIgActive ? '#22c55e' : '#475569';
  ctx.beginPath();
  ctx.roundRect(igX - gateW / 2, gateY, gateW, gateH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.fillText('σ', igX, gateY + gateH / 2);

  ctx.fillStyle = isIgActive ? '#4ade80' : '#94a3b8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Input Gate (i_t)', igX, gateY + gateH + 20);

  // Candidate State tanh
  ctx.fillStyle = isIgActive ? 'rgba(56, 189, 248, 0.4)' : '#1e293b';
  ctx.strokeStyle = isIgActive ? '#38bdf8' : '#475569';
  ctx.beginPath();
  ctx.roundRect(candX - gateW / 2, gateY, gateW, gateH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText('tanh', candX, gateY + gateH / 2);

  ctx.fillStyle = isIgActive ? '#38bdf8' : '#94a3b8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Candidate (C̃_t)', candX, gateY + gateH + 20);

  // Connect Input & Candidate to Multiply node before highway Add
  const subMultX = addX;
  const subMultY = gateY - 45;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(subMultX, subMultY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.fillText('⊗', subMultX, subMultY);

  ctx.strokeStyle = isIgActive ? '#38bdf8' : '#475569';
  ctx.beginPath();
  ctx.moveTo(igX, gateY);
  ctx.lineTo(igX, subMultY);
  ctx.lineTo(subMultX - 14, subMultY);

  ctx.moveTo(candX, gateY);
  ctx.lineTo(candX, subMultY);
  ctx.lineTo(subMultX + 14, subMultY);

  ctx.moveTo(subMultX, subMultY - 14);
  ctx.lineTo(subMultX, cellHighwayY + 18);
  ctx.stroke();

  // C. Output Gate (sigma) & Highway tanh
  const ogX = boxX + 800;
  const isOgActive = activeGate === 'output';

  ctx.fillStyle = isOgActive ? 'rgba(168, 85, 247, 0.4)' : '#1e293b';
  ctx.strokeStyle = isOgActive ? '#c084fc' : '#475569';
  ctx.beginPath();
  ctx.roundRect(ogX - gateW / 2, gateY, gateW, gateH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px ui-monospace, monospace';
  ctx.fillText('σ', ogX, gateY + gateH / 2);

  ctx.fillStyle = isOgActive ? '#c084fc' : '#94a3b8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Output Gate (o_t)', ogX, gateY + gateH + 20);

  // Tanh block after cell state
  const outTanhX = ogX + 140;
  const outTanhY = cellHighwayY + 70;
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.roundRect(outTanhX - 35, outTanhY - 20, 70, 40, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px ui-monospace, monospace';
  ctx.fillText('tanh', outTanhX, outTanhY);

  // Connect Highway into outTanh
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(boxX + boxW - 80, cellHighwayY);
  ctx.lineTo(outTanhX, cellHighwayY);
  ctx.lineTo(outTanhX, outTanhY - 20);
  ctx.stroke();

  // Output multiply node
  const outMultY = hiddenLineY - 45;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(outTanhX, outMultY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.fillText('⊗', outTanhX, outMultY);

  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(outTanhX, outTanhY + 20);
  ctx.lineTo(outTanhX, outMultY - 14);

  ctx.moveTo(ogX, gateY);
  ctx.lineTo(ogX, outMultY);
  ctx.lineTo(outTanhX - 14, outMultY);

  ctx.moveTo(outTanhX, outMultY + 14);
  ctx.lineTo(outTanhX, hiddenLineY);
  ctx.stroke();
}
