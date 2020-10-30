import Clickable from "./Clickable";
import { menuColor } from "./drawResources";

class Menu {
    public opened: boolean = false;

    // animation state
    private sizeX = 0;
    private sizeY = 0;
    private readonly fullX: number;
    private readonly fullY: number;

    constructor(private context: CanvasRenderingContext2D) {
        this.fullX = 128;
        this.fullY = 128;
    }

    public draw(clickables: Clickable[]) {
        const width = this.context.canvas.width;
        const height = this.context.canvas.height;
        const radius = 20;
        const padding = 5;
        // middle of the rounded corner
        const x = width - padding - radius;
        const y = padding + radius;
        const quarter = Math.PI / 2;

        // animation update
        if (this.opened) {
            this.sizeX = Math.min(this.fullX, this.sizeX + this.fullX / 8);
            this.sizeY = Math.min(this.fullY, this.sizeY + this.fullY / 8);
            clickables.push(new Clickable(0, 0, width, height, () => {
                this.opened = false;
            }));
            if (this.sizeX === this.fullX) {
                // done opening
            }
        }
        else {  // not opened
            this.sizeX = Math.max(0, this.sizeX - this.fullX / 8);
            this.sizeY = Math.max(0, this.sizeY - this.fullY / 8);
            if (this.sizeX === 0) {
                // done closing
                const buttonSize = Math.sqrt(Math.PI) * radius;
                clickables.push(new Clickable(x - buttonSize / 2, y - buttonSize / 2, buttonSize, buttonSize, () => {
                    this.opened = true;
                }));
            }
        }

        this.context.fillStyle = menuColor;
        this.context.beginPath();
        // top right
        this.context.arc(x, y, radius, quarter, 0, false);
        this.context.lineTo(x + radius, y + this.sizeY);
        // bottom right
        this.context.arc(x, y + this.sizeY, radius, 0, quarter, false);
        this.context.lineTo(x - this.sizeX, y + this.sizeY + radius);
        // bottom left
        this.context.arc(x - this.sizeX, y + this.sizeY, radius, quarter * 3, Math.PI, false);
        this.context.lineTo(x - this.sizeX - radius, y);
        // top left
        this.context.arc(x - this.sizeX, y, radius, Math.PI, quarter * 3, false);
        this.context.lineTo(x, y - radius);
        this.context.fill();
    }
}

export default Menu;
