export function drawNotebookImage(
  ctx: CanvasRenderingContext2D,
  data: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  mimeType = "image/png",
): void {
  const image = new Image();

  image.onload = () => {
    const scale = Math.min(
      maxWidth / image.naturalWidth,
      maxHeight / image.naturalHeight,
      1,
    );

    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    ctx.drawImage(image, x, y, width, height);
  };

  image.src = data.startsWith("data:")
    ? data
    : `data:${mimeType};base64,${data}`;
}
