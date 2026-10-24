import { GraphCell } from '../../types/cell';
import { clamp } from '../math';

export function drawYolo(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.yolo || {
    gridSize: 7,
    confidenceThreshold: 0.6,
    showGrid: true,
    showAnchors: true,
    detections: [
      { label: 'car', confidence: 0.94, color: '#38bdf8', x: 0.18, y: 0.42, w: 0.28, h: 0.26 },
      { label: 'person', confidence: 0.89, color: '#4ade80', x: 0.54, y: 0.32, w: 0.12, h: 0.42 },
      { label: 'dog', confidence: 0.92, color: '#fbbf24', x: 0.72, y: 0.56, w: 0.16, h: 0.22 },
    ],
  };

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'YOLOv8 Real-Time Object Detection', 180, 130);

  // Subtitle
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    'Single-Stage Detection · Feature Pyramid Network (FPN) · Anchor-Free Head · Non-Maximum Suppression (NMS)',
    182,
    172
  );

  const startY = 210;
  const imageX = 220;
  const imageY = startY + 10;
  const imageW = (w - 480) * 0.68;
  const imageH = h - 350;

  // 1. Draw Simulated Input Scene Frame
  ctx.fillStyle = '#080e1a';
  ctx.fillRect(imageX, imageY, imageW, imageH);
  ctx.strokeStyle = '#28334b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(imageX, imageY, imageW, imageH);

  // Ground plane & stylized road/environment
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(imageX, imageY + imageH * 0.55, imageW, imageH * 0.45);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(imageX, imageY + imageH * 0.55);
  ctx.lineTo(imageX + imageW, imageY + imageH * 0.55);
  ctx.stroke();

  // Subtle background silhouettes (skyline / road markings)
  ctx.strokeStyle = '#334155';
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(imageX, imageY + imageH * 0.78);
  ctx.lineTo(imageX + imageW, imageY + imageH * 0.78);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. S x S Grid Overlay (Feature Map cells)
  const gridSize = config.gridSize || 7;
  if (config.showGrid !== false) {
    const gridOpacity = Math.max(0.08, 0.3 - progress * 0.2); // grid is most prominent at start
    ctx.strokeStyle = `rgba(56, 189, 248, ${gridOpacity})`;
    ctx.lineWidth = 1;

    for (let i = 1; i < gridSize; i++) {
      const gx = imageX + (imageW / gridSize) * i;
      ctx.beginPath();
      ctx.moveTo(gx, imageY);
      ctx.lineTo(gx, imageY + imageH);
      ctx.stroke();

      const gy = imageY + (imageH / gridSize) * i;
      ctx.beginPath();
      ctx.moveTo(imageX, gy);
      ctx.lineTo(imageX + imageW, gy);
      ctx.stroke();
    }
  }

  // 3. Candidate Anchor Proposals (Flash early during detection phase)
  if (progress < 0.45 && config.showAnchors !== false) {
    const anchorAlpha = Math.sin((progress / 0.45) * Math.PI) * 0.4;
    ctx.strokeStyle = `rgba(251, 191, 36, ${anchorAlpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Sample candidate boxes that get pruned by NMS
    const candidateOffsets = [
      { x: 0.15, y: 0.4, w: 0.32, h: 0.28 },
      { x: 0.52, y: 0.3, w: 0.15, h: 0.45 },
      { x: 0.7, y: 0.54, w: 0.18, h: 0.24 },
      { x: 0.35, y: 0.2, w: 0.2, h: 0.2 },
    ];
    candidateOffsets.forEach((b) => {
      ctx.strokeRect(imageX + b.x * imageW, imageY + b.y * imageH, b.w * imageW, b.h * imageH);
    });
    ctx.setLineDash([]);
  }

  // 4. Confirmed Bounding Box Detections
  const detections = config.detections || [
    { label: 'car', confidence: 0.94, color: '#38bdf8', x: 0.18, y: 0.42, w: 0.28, h: 0.26 },
    { label: 'person', confidence: 0.89, color: '#4ade80', x: 0.54, y: 0.32, w: 0.12, h: 0.42 },
    { label: 'dog', confidence: 0.92, color: '#fbbf24', x: 0.72, y: 0.56, w: 0.16, h: 0.22 },
  ];

  const revealProgress = clamp((progress - 0.25) / 0.5, 0, 1);

  if (revealProgress > 0) {
    detections.forEach((det, idx) => {
      const stagger = idx * 0.15;
      const detProg = clamp((revealProgress - stagger) / (1 - stagger), 0, 1);
      if (detProg <= 0) return;

      const bx = imageX + det.x * imageW;
      const by = imageY + det.y * imageH;
      const bw = det.w * imageW;
      const bh = det.h * imageH;

      // Glow halo
      ctx.strokeStyle = det.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = det.color;
      ctx.shadowBlur = 10 * detProg;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.shadowBlur = 0;

      // Corner accent brackets
      const bracketLen = 14;
      ctx.lineWidth = 4;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bracketLen);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + bracketLen, by);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - bracketLen, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + bracketLen);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - bracketLen);
      ctx.lineTo(bx, by + bh);
      ctx.lineTo(bx + bracketLen, by + bh);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bx + bw - bracketLen, by + bh);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + bw, by + bh - bracketLen);
      ctx.stroke();

      // Label Tag Pill
      const tagText = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px ui-monospace, monospace';
      const textMetrics = ctx.measureText(tagText);
      const tagW = textMetrics.width + 16;
      const tagH = 22;

      ctx.fillStyle = det.color;
      ctx.beginPath();
      ctx.roundRect(bx, by - tagH, tagW, tagH, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, bx + 8, by - tagH / 2);
    });
  }

  // 5. Right Side Telemetry HUD Panel
  const hudX = imageX + imageW + 30;
  const hudY = imageY;
  const hudW = w - hudX - 60;
  const hudH = imageH;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Detection Telemetry', hudX + 18, hudY + 20);

  // Key stats
  const stats = [
    { label: 'Architecture', val: 'YOLOv8x (PyTorch)' },
    { label: 'Input Resolution', val: '640 × 640' },
    { label: 'Inference Latency', val: '3.6 ms' },
    { label: 'mAP @ 0.5:0.95', val: '53.9%' },
    { label: 'NMS IoU Threshold', val: '0.45' },
    { label: 'Objects Found', val: revealProgress > 0.5 ? `${detections.length} objects` : 'Scanning...' },
  ];

  stats.forEach((st, idx) => {
    const iy = hudY + 55 + idx * 26;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(st.label, hudX + 18, iy);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(st.val, hudX + hudW - 18, iy);
    ctx.textAlign = 'left';
  });

  // Table of Detections
  const tableY = hudY + 225;
  ctx.strokeStyle = '#28334b';
  ctx.beginPath();
  ctx.moveTo(hudX + 18, tableY);
  ctx.lineTo(hudX + hudW - 18, tableY);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Detected Bounding Boxes:', hudX + 18, tableY + 12);

  detections.forEach((det, idx) => {
    const dy = tableY + 36 + idx * 30;
    const isVisible = revealProgress > idx * 0.2;

    ctx.fillStyle = isVisible ? det.color : '#475569';
    ctx.beginPath();
    ctx.arc(hudX + 26, dy + 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isVisible ? '#e2e8f0' : '#64748b';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(`${det.label.padEnd(8)} ${(det.confidence * 100).toFixed(1)}%`, hudX + 40, dy + 2);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[${det.x.toFixed(2)}, ${det.y.toFixed(2)}, ${det.w.toFixed(2)}]`, hudX + hudW - 18, dy + 2);
    ctx.textAlign = 'left';
  });
}

