import { NotebookOutput } from "../../types/cell";

const outputImages = new Map<string, HTMLImageElement>();

export function drawNotebookOutput(
  ctx: CanvasRenderingContext2D,
  output: NotebookOutput,
  w: number,
): void {
  const x = 142;
  const y = 735;
  const width = w - 280;
  const height = 210;

  ctx.fillStyle = "#0b111f";
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "#7ee787";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Output", x + 18, y + 14);

  if (output.imageDataUrl) {
    let image = outputImages.get(output.imageDataUrl);
    if (!image) {
      image = new Image();
      // Notify the canvas preview when an asynchronous image finishes loading.
      // Without this, a paused preview can remain stuck on the loading placeholder.
      image.onload = () => window.dispatchEvent(new Event("codestudio:image-loaded"));
      image.onerror = () => window.dispatchEvent(new Event("codestudio:image-loaded"));
      image.src = output.imageDataUrl;
      outputImages.set(output.imageDataUrl, image);
    }
    if (image.complete && image.naturalWidth > 0) {
      const scale = Math.min(
        (width - 36) / image.naturalWidth,
        (height - 54) / image.naturalHeight,
        1,
      );
      const imageWidth = image.naturalWidth * scale;
      const imageHeight = image.naturalHeight * scale;
      ctx.drawImage(image, x + 18, y + 48, imageWidth, imageHeight);
    } else {
      ctx.fillStyle = "#8b949e";
      ctx.font = "20px system-ui, sans-serif";
      ctx.fillText("Loading image output…", x + 18, y + 65);
    }
  }

  if (output.text) {
    ctx.fillStyle = "#c9d1d9";
    ctx.font = '20px "SFMono-Regular", Consolas, monospace';
    const lines = output.text.split(/\r?\n/);
    const maxLines = 6;
    lines.slice(0, maxLines).forEach((line, index) => {
      ctx.fillText(line.slice(0, 110), x + 18, y + 52 + index * 25);
    });
    if (lines.length > maxLines) {
      ctx.fillStyle = "#8b949e";
      ctx.fillText("… more output", x + 18, y + 52 + maxLines * 25);
    }
  }
}
