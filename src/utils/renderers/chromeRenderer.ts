import { Cell } from "../../types/cell";

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function drawWindowFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, w, h);

  drawRoundRect(ctx, 36, 34, w - 72, h - 68, 22, "#161b22", "#30363d");

  const lights = [
    { x: 76, color: "#ff5f57" },
    { x: 108, color: "#febc2e" },
    { x: 140, color: "#28c840" },
  ];
  lights.forEach((l) => {
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.arc(l.x, 75, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#8b949e";
  ctx.font = "26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, w / 2, 76);

  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(37, 118);
  ctx.lineTo(w - 37, 118);
  ctx.stroke();
}

export function drawSidebarDecoration(
  ctx: CanvasRenderingContext2D,
  h: number,
  cell: Cell,
): void {
  ctx.fillStyle = "#10151d";
  ctx.fillRect(38, 119, 74, h - 158);

  ctx.fillStyle = "#8b949e";
  ctx.font = "22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("≡", 75, 158);

  ctx.fillStyle = "#1f6feb";
  ctx.fillRect(38, 190, 74, 54);
  ctx.fillStyle = "#c9d1d9";
  ctx.font = "19px system-ui, sans-serif";

  let tag = "TXT";
  if (cell.type === "code") {
    const ext = cell.name.split(".").pop()?.toUpperCase() || "CODE";
    tag = ext.slice(0, 3);
  } else if (cell.type === "graph") {
    if (cell.graphType === "decision-boundary") tag = "SVM";
    else if (cell.graphType === "ann" || cell.graphType === "neural-network")
      tag = "ANN";
    else if (cell.graphType === "cnn") tag = "CNN";
    else if (cell.graphType === "rnn") tag = "RNN";
    else if (cell.graphType === "lstm") tag = "LSTM";
    else if (cell.graphType === "yolo") tag = "YOLO";
    else if (cell.graphType === "matplotlib") tag = "PLT";
    else if (cell.graphType === "clustering") tag = "TSNE";
    else if (cell.graphType === "gradient-descent") tag = "OPT";
    else tag = "VIZ";
  }
  ctx.fillText(tag, 75, 217);
}

export function drawStatusBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  globalTime: number,
  fps: number,
): void {
  ctx.fillStyle = "#1f6feb";
  ctx.fillRect(38, h - 82, w - 76, 44);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("●  Animation Preview", 58, h - 60);

  ctx.textAlign = "right";
  const frames = Math.round(globalTime * fps);
  ctx.fillText(`${frames} frames`, w - 58, h - 60);
}
