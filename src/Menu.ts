import Clickable from "./Clickable";
import { buttonColor, menuColor, menuTextColor } from "./drawResources";
import { TrickRecord } from "./GameHand";
import PrevDrawer from "./PrevDrawer";

interface regularClickables {
    /** clicking anywhere closes the menu */
    fullscreenCloseMenu: Clickable;
    /** does nothing, just cancels the fullscreen close for the menu area */
    menuOpenBlank: Clickable;
    /** button to open menu */
    openMenuButton: Clickable;
    /** button to close menu */
    closeMenuButton: Clickable;
    donButton: Clickable;
}

class Menu {
    public opened: boolean = false;

    // animation state
    private sizeX = 0;
    private sizeY = 0;
    private fullX: number = 128;
    private fullY: number = 128;

    /** to randomize which line gets which animation */
    private menuButtonLines: number[] = [0, 1, 2];
    private randomizeMenuButtonLines() {
        let randomI = Math.trunc(Math.random() * 3);
        [this.menuButtonLines[0], this.menuButtonLines[randomI]] = [this.menuButtonLines[randomI], this.menuButtonLines[0]];
        randomI = Math.trunc(Math.random() * 2) + 1;
        [this.menuButtonLines[1], this.menuButtonLines[randomI]] = [this.menuButtonLines[randomI], this.menuButtonLines[1]];
    }

    private rc!: regularClickables;

    private ptd: PrevDrawer;

    constructor(private context: CanvasRenderingContext2D) {
        this.ptd = new PrevDrawer(context);

        this.resize(64);
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
        const donHeight = 40;
        const donWidth = 70;

        return { width, height, radius, buttonSize, buttonSizeD2, padding, x, y, quarter, donHeight, donWidth };
    }

    public resize(cardWidth: number) {
        this.fullX = Math.trunc(120 + (cardWidth - 120 + Math.sqrt(Math.pow(cardWidth - 120, 2) + 80)) / 2 + cardWidth);
        this.fullY = this.fullX;
        const { width, height, /* radius, */ buttonSize, buttonSizeD2, /* padding, */ x, y, /* quarter, */ donHeight, donWidth } = this.menuDrawCalculations();
        this.rc = {
            fullscreenCloseMenu: new Clickable(0, 0, width, height, () => {
                console.log("clicked outside menu to close menu");
                this.opened = false;
                if (this.sizeX === this.fullX) {  // open
                    this.randomizeMenuButtonLines();
                }
            }),
            menuOpenBlank: new Clickable(x - this.fullX - buttonSizeD2, y - buttonSizeD2, this.fullX + buttonSize, this.fullY + buttonSize, () => {
                // nothing - just cancelling the full screen clickable
            }),
            openMenuButton: new Clickable(x - buttonSize / 2, y - buttonSize / 2, buttonSize, buttonSize, () => {
                this.opened = true;
                if (this.sizeX === 0) {  // closed
                    this.randomizeMenuButtonLines();
                }
            }),
            closeMenuButton: new Clickable(x - buttonSizeD2, y - buttonSizeD2, buttonSize, buttonSize, () => {
                console.log("clicked close button to close menu");
                this.opened = false;
                if (this.sizeX === this.fullX) {  // open
                    this.randomizeMenuButtonLines();
                }
            }),
            donButton: new Clickable(x - donWidth, y + this.fullY -donHeight, donWidth, donHeight, () => {
                window.open("https://www.patreon.com/user?u=44765751", "_blank");
            })
        };

        this.ptd.resize(this.fullX, this.fullY, x, y);
    }

    public draw(trickHistory: readonly TrickRecord[], clickables: Clickable[]) {
        const { /* width, height, */ radius, /* buttonSize, */ buttonSizeD2, padding, x, y, quarter, donHeight, donWidth } = this.menuDrawCalculations();
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
        this.context.globalAlpha = 0.5;
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
        this.context.globalAlpha = 1;

        // menu button - close button
        const leftX = x - buttonSizeD2 + padding * 2;
        const rightX = x + buttonSizeD2 - padding * 2;
        const topY = y - buttonSizeD2 + padding * 2;
        const botY = y + buttonSizeD2 - padding * 2;
        const proportion = this.sizeY / this.fullY;
        const linesFrom = [topY, botY, y];
        this.context.strokeStyle = menuTextColor;
        // to /
        let begin = linesFrom[this.menuButtonLines[0]];
        let endL = botY;
        let endR = topY;
        let diffL = endL - begin;
        let diffR = endR - begin;
        this.context.beginPath();
        this.context.moveTo(rightX, begin + proportion * diffR);
        this.context.lineTo(leftX, begin + proportion * diffL);
        this.context.stroke();
        // to \
        begin = linesFrom[this.menuButtonLines[1]];
        endL = topY;
        endR = botY;
        diffL = endL - begin;
        diffR = endR - begin;
        this.context.beginPath();
        this.context.moveTo(rightX, begin + proportion * diffR);
        this.context.lineTo(leftX, begin + proportion * diffL);
        this.context.stroke();
        // fade
        this.context.globalAlpha = 1 - proportion;
        this.context.beginPath();
        this.context.moveTo(rightX, linesFrom[this.menuButtonLines[2]]);
        this.context.lineTo(leftX, linesFrom[this.menuButtonLines[2]]);
        this.context.stroke();
        this.context.globalAlpha = 1;

        if (this.sizeX === 0) {
            // done closing
            clickables.push(this.rc.openMenuButton);
        }
        else {
            // don button
            const buttonHeight = proportion * donHeight;
            const buttonWidth = proportion * donWidth;
            this.context.fillStyle = buttonColor;
            this.context.fillRect(x - buttonWidth, y + this.sizeY - buttonHeight, buttonWidth, buttonHeight);
            this.context.fillStyle = menuTextColor;
            const donSize = Math.trunc(18 * proportion);
            if (donSize > 5) {
                this.context.font = `${Math.trunc(18 * proportion)}px Arial`;
                this.context.textBaseline = "top";
                this.context.fillText("Donate", x - buttonWidth * 0.9, y + this.sizeY - buttonHeight * 0.72);
            }
        
            if (this.sizeX === this.fullX) {
                // done opening
                clickables.push(this.rc.menuOpenBlank);

                this.ptd.draw(trickHistory, clickables);

                clickables.push(this.rc.closeMenuButton);
                clickables.push(this.rc.donButton);
            }
        }
    }
}

export default Menu;
