import { GraphCell } from '../../types/cell';
import { clamp } from '../math';

// Clusters configuration
const CLUSTER_DEFS = [
  { cx: -2.2, cy: 1.6, color: '#38bdf8', name: 'Cluster A (NLP Vectors)', count: 24 },
  { cx: 2.4, cy: 1.8, color: '#c084fc', name: 'Cluster B (Vision Embeddings)', count: 22 },
  { cx: 0.2, cy: -2.2, color: '#34d399', name: 'Cluster C (Audio Embeddings)', count: 26 },
  { cx: -2.6, cy: -1.8, color: '#fbbf24', name: 'Cluster D (Tabular Features)', count: 18 },
];

// Generate deterministic points around clusters
const EMBEDDING_POINTS = CLUSTER_DEFS.flatMap((cl, cIdx) => {
  const points = [];
  for (let i = 0; i < cl.count; i++) {
    // Generate pseudo-random offset
    const angle = (i / cl.count) * Math.PI * 2 + cIdx * 1.5;
    const r = (Math.sin(i * 17 + cIdx * 31) * 0.5 + 0.5) * 1.2 + 0.3;
    const targetX = cl.cx + Math.cos(angle) * r;
    const targetY = cl.cy + Math.sin(angle) * r;

    // Initial scattered position (before t-SNE projection)
    const initAngle = ((i + cIdx * 10) / 90) * Math.PI * 2;
    const initR = (Math.cos(i * 23) * 0.5 + 0.5) * 3.5 + 0.5;
    const startX = Math.cos(initAngle) * initR;
    const startY = Math.sin(initAngle) * initR;

    points.push({
      startX,
      startY,
      targetX,
      targetY,
      clusterIdx: cIdx,
      color: cl.color,
    });
  }
  return points;
});

export function drawClustering(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.clustering || {
    method: 'tsne',
    clusters: 3,
    showCentroids: true,
    showHulls: true,
  };

  const method = config.method || 'tsne';
  const numClusters = clamp(config.clusters || 3, 2, 4);
  const activeClusters = CLUSTER_DEFS.slice(0, numClusters);

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'Embeddings & Dimensionality Reduction', 180, 130);

  // Subtitle
  let methodTitle = 't-SNE (t-Distributed Stochastic Neighbor Embedding)';
  if (method === 'pca') methodTitle = 'Principal Component Analysis (PCA 2D Projection)';
  if (method === 'kmeans') methodTitle = 'K-Means Clustering on Embeddings (k=3)';

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `${methodTitle} · Latent Space: ℝ¹²⁸ → ℝ² · Metric: Cosine Distance`,
    182,
    172
  );

  // Chart dimensions
  const chartX = 180;
  const chartY = 190;
  const chartW = w - 460;
  const chartH = h - 330;

  // Background
  ctx.fillStyle = '#0c121e';
  ctx.fillRect(chartX, chartY, chartW, chartH);
  ctx.strokeStyle = '#28334b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(chartX, chartY, chartW, chartH);

  // Coordinate mapping
  const toScreenX = (val: number) => chartX + ((val + 4.5) / 9) * chartW;
  const toScreenY = (val: number) => chartY + chartH - ((val + 4.5) / 9) * chartH;

  // Grid
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
  }

  // Axes lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  const zeroX = toScreenX(0);
  const zeroY = toScreenY(0);
  ctx.beginPath();
  ctx.moveTo(zeroX, chartY);
  ctx.lineTo(zeroX, chartY + chartH);
  ctx.moveTo(chartX, zeroY);
  ctx.lineTo(chartX + chartW, zeroY);
  ctx.stroke();

  // Axis Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Dimension 1 (PCA 1 / t-SNE 1) →', chartX + chartW - 12, zeroY - 10);
  ctx.textAlign = 'left';
  ctx.fillText('Dimension 2 ↑', zeroX + 10, chartY + 24);

  // Animation easing: Points smoothly converge into clusters as progress increases
  const easeProgress = Math.sin((progress * Math.PI) / 2);

  // 1. Draw Cluster Dispersion Ellipses (Hulls)
  if (config.showHulls !== false) {
    activeClusters.forEach((cl) => {
      const sx = toScreenX(cl.cx);
      const sy = toScreenY(cl.cy);
      const rx = (chartW / 9) * 1.6 * easeProgress;
      const ry = (chartH / 9) * 1.4 * easeProgress;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(sx, sy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.fillStyle = cl.color.replace(')', ', 0.08)').replace('#', 'rgba('); // approximate or hex to rgb
      // Draw hex glow
      ctx.fillStyle = cl.color + '15';
      ctx.fill();
      ctx.strokeStyle = cl.color + '55';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();
    });
  }

  // 2. Draw Data Points (Interpolated from start to clustered target)
  const filteredPoints = EMBEDDING_POINTS.filter((p) => p.clusterIdx < numClusters);

  filteredPoints.forEach((p) => {
    const curX = p.startX + (p.targetX - p.startX) * easeProgress;
    const curY = p.startY + (p.targetY - p.startY) * easeProgress;

    const sx = toScreenX(curX);
    const sy = toScreenY(curY);

    // Glowing halo
    ctx.fillStyle = p.color + '33';
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Point
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // 3. Draw Centroids
  if (config.showCentroids !== false && easeProgress > 0.3) {
    activeClusters.forEach((cl, i) => {
      const sx = toScreenX(cl.cx);
      const sy = toScreenY(cl.cy);

      // Centroid crosshair
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy);
      ctx.lineTo(sx + 12, sy);
      ctx.moveTo(sx, sy - 12);
      ctx.lineTo(sx, sy + 12);
      ctx.stroke();

      // Outer ring
      ctx.strokeStyle = cl.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Centroid label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`μ${i + 1}`, sx, sy - 18);
    });
  }

  // 4. Right Side HUD & Cluster Legend
  const hudX = w - 260;
  const hudY = 190;
  const hudW = 200;
  const hudH = 260;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Clusters (k = ' + numClusters + ')', hudX + 16, hudY + 24);

  activeClusters.forEach((cl, i) => {
    const itemY = hudY + 60 + i * 36;
    ctx.fillStyle = cl.color;
    ctx.beginPath();
    ctx.arc(hudX + 22, itemY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`Cluster ${String.fromCharCode(65 + i)}`, hudX + 36, itemY + 4);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`${cl.count} pts`, hudX + 140, itemY + 4);
  });

  // Metrics footer
  const statsY = hudY + hudH - 65;
  ctx.strokeStyle = '#28334b';
  ctx.beginPath();
  ctx.moveTo(hudX + 12, statsY);
  ctx.lineTo(hudX + hudW - 12, statsY);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`Silhouette: 0.814`, hudX + 16, statsY + 20);
  ctx.fillText(`Perplexity: 30`, hudX + 16, statsY + 36);
  ctx.fillText(`Convergence: 98%`, hudX + 16, statsY + 52);
}

