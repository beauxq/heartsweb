import Clickable from "./Clickable";
import { menuColor, menuTextColor } from "./drawResources";

interface regularClickables {
    /** clicking anywhere closes the menu */
    fullscreenCloseMenu: Clickable;
    /** does nothing, just cancels the fullscreen close for the menu area */
    menuOpenBlank: Clickable;
    /** button to open menu */
    openMenuButton: Clickable;
    /** button to close menu */
    closeMenuButton: Clickable;
}

class Menu {
    public opened: boolean = false;

    // animation state
    private sizeX = 0;
    private sizeY = 0;
    private readonly fullX: number;
    private readonly fullY: number;

    private rc!: regularClickables;

    constructor(private context: CanvasRenderingContext2D) {
        this.fullX = 128;
        this.fullY = 128;

        this.resize();
    }

    private menuDrawCalculations() {
        const width = this.context.canvas.width;
        const height = this.context.canvas.height;
        const radius = 20;
        /** length of square with same area as circle with radius ^ */
        const buttonSize = Math.sqrt(Math.PI) * radius;
        /** `buttonSize / 2` */
        const buttonSizeD2 = buttonSize / 2;  // because this is used a lot
        const padding = 5;
        // middle of the rounded corner
        const x = width - padding - radius;
        const y = padding + radius;
        const quarter = Math.PI / 2;

        return { width, height, radius, buttonSize, buttonSizeD2, padding, x, y, quarter };
    }

    public resize() {
        const { width, height, /* radius, */ buttonSize, buttonSizeD2, /* padding, */ x, y, /* quarter */ } = this.menuDrawCalculations();
        this.rc = {
            fullscreenCloseMenu: new Clickable(0, 0, width, height, () => {
                console.log("clicked outside menu to close menu");
                this.opened = false;
            }),
            menuOpenBlank: new Clickable(x - this.fullX - buttonSizeD2, y - buttonSizeD2, this.fullX + buttonSize, this.fullY + buttonSize, () => {
                // nothing - just cancelling the full screen clickable
            }),
            openMenuButton: new Clickable(x - buttonSize / 2, y - buttonSize / 2, buttonSize, buttonSize, () => {
                this.opened = true;
            }),
            closeMenuButton: new Clickable(x - buttonSizeD2, y - buttonSizeD2, buttonSize, buttonSize, () => {
                console.log("clicked close button to close menu");
                this.opened = false;
            })
        };

        // TODO: probably change this.sizeX and this.sizeY here
    }

    public draw(clickables: Clickable[]) {
        const { /* width, height, */ radius, /* buttonSize, */ buttonSizeD2, padding, x, y, quarter } = this.menuDrawCalculations();
        // animation update
        if (this.opened) {
            this.sizeX = Math.min(this.fullX, this.sizeX + this.fullX / 8);
            this.sizeY = Math.min(this.fullY, this.sizeY + this.fullY / 8);
            clickables.push(this.rc.fullscreenCloseMenu);
        }
        else {  // not opened
            this.sizeX = Math.max(0, this.sizeX - this.fullX / 8);
            this.sizeY = Math.max(0, this.sizeY - this.fullY / 8);
        }

        // menu area and open button
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

        // menu button - close button
        const leftX = x - buttonSizeD2 + padding * 2;
        const rightX = x + buttonSizeD2 - padding * 2;
        const topY = y - buttonSizeD2 + padding * 2;
        const botY = y + buttonSizeD2 - padding * 2;
        const diff = botY - topY;
        const proportion = this.sizeY / this.fullY;
        this.context.strokeStyle = menuTextColor;
        this.context.beginPath();
        this.context.moveTo(rightX, topY);
        this.context.lineTo(leftX, topY + proportion * diff);
        this.context.stroke();
        this.context.beginPath();
        this.context.moveTo(rightX, botY);
        this.context.lineTo(leftX, botY - proportion * diff);
        this.context.stroke();
        this.context.globalAlpha = 1 - proportion;
        this.context.beginPath();
        this.context.moveTo(rightX, y);
        this.context.lineTo(leftX, y);
        this.context.stroke();
        this.context.globalAlpha = 1;


        if (this.sizeX === this.fullX) {
            // done opening
            clickables.push(this.rc.menuOpenBlank);
            clickables.push(this.rc.closeMenuButton);
        }
        else if (this.sizeX === 0) {
            // done closing
            clickables.push(this.rc.openMenuButton);
        }
    }
}

export default Menu;
