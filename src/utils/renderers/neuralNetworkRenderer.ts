import { GraphCell } from '../../types/cell';
import { clamp } from '../math';

export function drawNeuralNetwork(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  h: number
): void {
  const config = cell.neuralNetwork || {
    layers: [4, 6, 6, 2],
    activation: 'relu',
    showProbabilities: true,
  };

  const layers = config.layers && config.layers.length > 0 ? config.layers : [4, 6, 6, 2];
  const activation = config.activation || 'relu';

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'Deep Neural Network Architecture', 180, 130);

  // Subtitle / Architecture spec
  const layerStr = layers.join(' → ');
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `Feedforward Network · Layers: [${layerStr}] · Activation: ${activation.toUpperCase()} · Optimization: Adam`,
    182,
    172
  );

  // Main Canvas bounds for network
  const netX = 180;
  const netY = 210;
  const netW = w - 480;
  const netH = h - 350;

  // Compute node coordinates per layer
  const layerSpacing = netW / (layers.length - 1);
  const nodePositions: { x: number; y: number; layerIdx: number; nodeIdx: number }[][] = [];

  layers.forEach((nodeCount: number, lIdx: number) => {
    const lx = netX + lIdx * layerSpacing;
    const nodeSpacing = netH / (nodeCount + 1);
    const layerNodes: { x: number; y: number; layerIdx: number; nodeIdx: number }[] = [];

    for (let nIdx = 0; nIdx < nodeCount; nIdx++) {
      const ly = netY + (nIdx + 1) * nodeSpacing;
      layerNodes.push({ x: lx, y: ly, layerIdx: lIdx, nodeIdx: nIdx });
    }
    nodePositions.push(layerNodes);
  });

  // Layer labels at top
  layers.forEach((nodeCount: number, lIdx: number) => {
    const lx = netX + lIdx * layerSpacing;
    let label = `Hidden ${lIdx}`;
    if (lIdx === 0) label = `Input [${nodeCount}]`;
    else if (lIdx === layers.length - 1) label = `Output [${nodeCount}]`;
    else label = `Dense ${lIdx} (${activation.toUpperCase()})`;

    ctx.fillStyle = lIdx === 0 ? '#38bdf8' : lIdx === layers.length - 1 ? '#4ade80' : '#c084fc';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, lx, netY - 26);
  });

  // 1. Draw Synaptic Connections (Weights)
  for (let l = 0; l < layers.length - 1; l++) {
    const fromNodes = nodePositions[l];
    const toNodes = nodePositions[l + 1];

    fromNodes.forEach((from, fIdx) => {
      toNodes.forEach((to, tIdx) => {
        // Pseudo-random deterministic weight representation
        const weightSeed = Math.sin(fIdx * 13 + tIdx * 37 + l * 19);
        const isExcitatory = weightSeed > 0;
        const opacity = Math.abs(weightSeed) * 0.45 + 0.15;

        ctx.strokeStyle = isExcitatory
          ? `rgba(96, 165, 250, ${opacity * 0.6})`
          : `rgba(244, 114, 182, ${opacity * 0.5})`;
        ctx.lineWidth = Math.abs(weightSeed) * 2.2 + 0.8;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // 2. Animated Signal Pulse along synapses
        // Progress cycles through layers: layer 0->1, 1->2, 2->3
        const numTransitions = layers.length - 1;
        const currentTransition = progress * numTransitions;
        const localProg = currentTransition - l;

        if (localProg >= 0 && localProg <= 1) {
          const pulseX = from.x + (to.x - from.x) * localProg;
          const pulseY = from.y + (to.y - from.y) * localProg;

          ctx.fillStyle = '#67e8f9';
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
  }

  // 3. Draw Nodes (Neurons)
  const nodeRadius = 18;
  const numTransitions = layers.length - 1;
  const currentTransition = progress * numTransitions;

  nodePositions.forEach((layerNodes, lIdx) => {
    // Has signal reached this layer?
    const isActivated = currentTransition >= lIdx - 0.2;
    const activationLevel = clamp(currentTransition - lIdx + 0.5, 0, 1);

    layerNodes.forEach((node, nIdx) => {
      // Outer glow when activated
      if (isActivated) {
        ctx.fillStyle =
          lIdx === layers.length - 1
            ? 'rgba(74, 222, 128, 0.4)'
            : 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 10 * activationLevel, 0, Math.PI * 2);
        ctx.fill();
      }

      // Neuron Body
      const gradient = ctx.createRadialGradient(
        node.x - 4,
        node.y - 4,
        2,
        node.x,
        node.y,
        nodeRadius
      );

      if (lIdx === 0) {
        gradient.addColorStop(0, '#7dd3fc');
        gradient.addColorStop(1, '#0284c7');
      } else if (lIdx === layers.length - 1) {
        gradient.addColorStop(0, '#86efac');
        gradient.addColorStop(1, '#16a34a');
      } else {
        gradient.addColorStop(0, '#d8b4fe');
        gradient.addColorStop(1, '#7e22ce');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Neuron border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label inside
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const nodeText = lIdx === 0 ? `x${nIdx + 1}` : lIdx === layers.length - 1 ? `y${nIdx + 1}` : `h${nIdx + 1}`;
      ctx.fillText(nodeText, node.x, node.y);
    });
  });

  // 4. Output Predictions Panel (Right Column)
  const predX = w - 260;
  const predY = 220;
  const predW = 200;
  const predH = 240;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(predX, predY, predW, predH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Output Softmax', predX + 16, predY + 24);

  // Animate probabilities emerging with progress
  const outProgress = clamp((progress - 0.7) / 0.3, 0, 1);
  const probA = (0.892 * outProgress).toFixed(3);
  const probB = (0.108 * outProgress).toFixed(3);

  // Class 0 Bar
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Class 0 (Cat)', predX + 16, predY + 60);
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'right';
  ctx.fillText(`${(Number(probA) * 100).toFixed(1)}%`, predX + predW - 16, predY + 60);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(predX + 16, predY + 70, predW - 32, 12);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(predX + 16, predY + 70, (predW - 32) * Number(probA), 12);

  // Class 1 Bar
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'left';
  ctx.fillText('Class 1 (Dog)', predX + 16, predY + 110);
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'right';
  ctx.fillText(`${(Number(probB) * 100).toFixed(1)}%`, predX + predW - 16, predY + 110);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(predX + 16, predY + 120, predW - 32, 12);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(predX + 16, predY + 120, (predW - 32) * Number(probB), 12);

  // Loss Metric
  ctx.fillStyle = '#64748b';
  ctx.font = '11px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Cross-Entropy Loss: ${(0.148 - outProgress * 0.1).toFixed(3)}`, predX + 16, predY + 165);
  ctx.fillText(`Inference: ${(12.4).toFixed(1)}ms`, predX + 16, predY + 185);
  ctx.fillText(`Params: 84 weights`, predX + 16, predY + 205);
}
