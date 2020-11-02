export function roundedRect(context: CanvasRenderingContext2D,
                            x: number,
                            y: number,
                            width: number,
                            height: number,
                            radius: number) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    // top right
    context.arcTo(x + width, y, x + width, y + radius, radius);
    context.lineTo(x + width, y + height - radius);
    // bottom right
    context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    context.lineTo(x + radius, y + height);
    // bottom left
    context.arcTo(x, y + height, x, y + height - radius, radius);
    context.lineTo(x, y + radius);
    // top left
    context.arcTo(x, y, x + radius, y, radius);
}
