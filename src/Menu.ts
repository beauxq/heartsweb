import { Clickable, RectClickable, CircleClickable } from "./Clickable";
import { buttonColor, menuAlpha, menuColor, menuTextColor } from "./drawResources";
import { roundedRect } from "./drawUtil";
import Gui from "./Gui";
import PrevDrawer from "./PrevDrawer";
import StatDrawer from "./StatDrawer";

interface regularClickables {
    /** clicking anywhere closes the menu */
    fullscreenCloseMenu: Clickable;
    /** does nothing, just cancels the fullscreen close for the menu area */
    menuOpenBlank: Clickable;
    openMenuButton: Clickable;
    closeMenuButton: Clickable;
    donButton: Clickable;
    menuItemToggle: Clickable;
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

    /** previous trick drawer */
    private ptd: PrevDrawer;

    private statD: StatDrawer;

    /** otherwise showing previous tricks */
    private showingStats: boolean;

    constructor(private context: CanvasRenderingContext2D, readonly gui: Gui) {
        this.ptd = new PrevDrawer(context, gui.game.hand.trickHistory);
        this.statD = new StatDrawer(context, gui.getStatData());

        this.showingStats = false;

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
        // middle of the (top right rounded corner) / (circle button)
        const x = width - padding - radius;
        const y = padding + radius;
        const donHeight = 40;
        const donWidth = 70;

        return { width, height, radius, buttonSize, buttonSizeD2, padding, x, y, donHeight, donWidth };
    }

    public resize(cardWidth: number) {
        const { width, height, radius, buttonSize, buttonSizeD2, padding, x, y, donHeight, donWidth } = this.menuDrawCalculations();
        this.fullX = Math.trunc(160 + (cardWidth - 120 + Math.sqrt(Math.pow(cardWidth - 120, 2) + 80)) / 2 + cardWidth * 1.875);
        // lower cap on x for screen width
        this.fullX = Math.min(this.fullX, width - (radius * 2) - (padding * 2));
        this.fullY = this.fullX;
        this.rc = {
            fullscreenCloseMenu: new RectClickable(0, 0, width, height, () => {
                console.log("clicked outside menu to close menu");
                this.opened = false;
                if (this.sizeX === this.fullX) {  // open
                    this.randomizeMenuButtonLines();
                }
            }),
            menuOpenBlank: new RectClickable(x - this.fullX - buttonSizeD2, y - buttonSizeD2, this.fullX + buttonSize, this.fullY + buttonSize, () => {
                // nothing - just cancelling the full screen clickable
            }),
            openMenuButton: new CircleClickable(x, y, radius, () => {
                this.opened = true;
                if (this.sizeX === 0) {  // closed
                    this.randomizeMenuButtonLines();
                }
            }),
            closeMenuButton: new CircleClickable(x, y, radius, () => {
                console.log("clicked close button to close menu");
                this.opened = false;
                if (this.sizeX === this.fullX) {  // open
                    this.randomizeMenuButtonLines();
                }
            }),
            donButton: new RectClickable(x - donWidth, y + this.fullY -donHeight, donWidth, donHeight, () => {
                window.open("https://www.patreon.com/user?u=44765751", "_blank");
            }),
            menuItemToggle: new RectClickable(x - this.fullX, y + this.fullY - 40, this.fullX * 2/3, 40, () => {
                this.showingStats = ! this.showingStats;
            })
        };

        this.ptd.resize(this.fullX, this.fullY, x, y);
        this.statD.resize(this.fullX, this.fullY, x, y);
    }

    public draw(clickables: Clickable[]) {
        const { /* width, height, */ radius, /* buttonSize, */ buttonSizeD2, padding, x, y, donHeight, donWidth } = this.menuDrawCalculations();
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
        this.context.globalAlpha = menuAlpha;
        roundedRect(this.context,
                    x - this.sizeX - radius,
                    y - radius,
                    this.sizeX + 2 * radius,
                    this.sizeY + 2 * radius,
                    radius);
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

            const iconHeight = proportion * 34;
            const iconBottomY = y + this.sizeY - proportion * 3;
            const iconWidth = this.sizeX / 5;
            // stats button
            const statsBarWidth = iconWidth / 3;
            const statsMidX = x - this.sizeX * 5/6;
            const statsLeftX = statsMidX - statsBarWidth * 1.5;
            this.context.fillStyle = menuTextColor;  // TODO: maybe try a dark blue?
            this.context.beginPath();
            this.context.moveTo(statsLeftX, iconBottomY);
            this.context.lineTo(statsLeftX, iconBottomY - iconHeight / 3);
            this.context.lineTo(statsLeftX + statsBarWidth, iconBottomY - iconHeight / 3);
            this.context.moveTo(statsLeftX + statsBarWidth, iconBottomY);
            this.context.lineTo(statsLeftX + statsBarWidth, iconBottomY - iconHeight);
            this.context.lineTo(statsLeftX + statsBarWidth * 2, iconBottomY - iconHeight);
            this.context.lineTo(statsLeftX + statsBarWidth * 2, iconBottomY);
            this.context.moveTo(statsLeftX + statsBarWidth * 2, iconBottomY - iconHeight * 2 / 3);
            this.context.lineTo(statsLeftX + statsBarWidth * 3, iconBottomY - iconHeight * 2 / 3);
            this.context.lineTo(statsLeftX + statsBarWidth * 3, iconBottomY);
            this.context.stroke();

            // eye button
            const eyeMidX = x - this.sizeX / 2;
            const iconHeightD2 = iconHeight / 2;
            this.context.beginPath();
            this.context.ellipse(eyeMidX, iconBottomY - iconHeightD2, iconHeightD2, iconHeightD2, 0, 0, Math.PI * 2);
            this.context.stroke();
            this.context.beginPath();
            this.context.ellipse(eyeMidX, iconBottomY - iconHeightD2, iconHeightD2 / 3, iconHeightD2 / 3, 0, 0, Math.PI * 2);
            this.context.stroke();
            this.context.beginPath();
            this.context.ellipse(eyeMidX, iconBottomY - iconHeightD2, iconWidth / 2, iconHeightD2, 0, 0, Math.PI * 2);
            this.context.stroke();

            if (this.sizeX === this.fullX) {
                // done opening
                clickables.push(this.rc.menuOpenBlank);
                
                this.context.strokeRect(x - this.sizeX +
                    (
                        this.showingStats
                        ? (this.statD.draw(clickables), 0)
                        : (this.ptd.draw(clickables), this.sizeX / 3)
                    ),
                    y + this.sizeY - 40, this.sizeX / 3, 40);

                clickables.push(this.rc.closeMenuButton);
                clickables.push(this.rc.donButton);
                clickables.push(this.rc.menuItemToggle);
            }
        }
    }
}

export default Menu;
