import Card from "./Card";
import { TrickRecord } from "./GameHand";
import CDR from "./CardDrawResources";
import { Clickable, RectClickable } from "./Clickable";
import { buttonColor } from "./drawResources";
import { roundedRect } from "./drawUtil";
import MenuItemDrawer from "./MenuItemDrawer";

/** previous trick drawer */
class PrevDrawer extends MenuItemDrawer {
    private current = -1;
    private prevLength = 0;  // know when length of trick history changes

    constructor(context: CanvasRenderingContext2D,
                private readonly trickHistory: readonly TrickRecord[]) {
        super(context);
    }

    private get cardWidth() {
        return this.menuWidth * 0.33333;
    }

    private darkenCard(x: number, y: number, width: number, height: number) {
        this.context.fillStyle = "rgba(0, 0, 0, 0.25)";
        roundedRect(this.context, x, y, width, height, width * 0.0268);
        this.context.fill();
    }

    private drawCard(card: Card, x: number, y: number, thisWon: boolean) {
        const { assetX, assetY } = CDR.getAssetCoords(card);
        const cardWidth = this.cardWidth;
        const cardHeight = cardWidth / CDR.assetWidth * CDR.assetHeight;
        this.context.drawImage(CDR.assets,
                               assetX, assetY,
                               CDR.assetWidth, CDR.assetHeight,
                               x, y, 
                               cardWidth, cardHeight);
        if (! thisWon) {
            this.darkenCard(x, y, cardWidth, cardHeight);
        }
    }

    /** 4 cards and 2 buttons (forward and backward) */
    draw(clickables: Clickable[]) {
        if (this.prevLength !== this.trickHistory.length) {
            this.prevLength = this.trickHistory.length;
            this.current = this.trickHistory.length - 1;
        }
        const thisTrick = this.trickHistory[this.current];
        if (thisTrick) {
            const cardWidth = this.cardWidth;
            const cardHeight = cardWidth / CDR.assetWidth * CDR.assetHeight;
            this.drawCard(thisTrick.cards[1],
                          this.menuRightX - this.menuWidth + cardWidth / 2,
                          this.menuTopY + cardHeight / 4,
                          thisTrick.whoWon === 1);
            this.drawCard(thisTrick.cards[2],
                          this.menuRightX - this.menuWidth / 2 - cardWidth / 2,
                          this.menuTopY,
                          thisTrick.whoWon === 2);
            this.drawCard(thisTrick.cards[0],
                          this.menuRightX - this.menuWidth / 2 - cardWidth / 2,
                          this.menuTopY + cardHeight / 2,
                          thisTrick.whoWon === 0);
            this.drawCard(thisTrick.cards[3],
                          this.menuRightX - this.menuWidth / 2,
                          this.menuTopY + cardHeight / 4,
                          thisTrick.whoWon === 3);
            
        }
        const midY = this.menuTopY + this.menuHeight / 3;
        const buttonWidth = 25;
        const buttonHeightD2 = 20;
        if (this.current < this.trickHistory.length - 1) {
            // next button
            const buttonLeftX = this.menuRightX - buttonWidth;
            this.context.fillStyle = buttonColor;
            this.context.beginPath();
            this.context.moveTo(this.menuRightX, midY);
            this.context.lineTo(buttonLeftX, midY + buttonHeightD2);
            this.context.lineTo(buttonLeftX, midY - buttonHeightD2);
            this.context.fill();
            clickables.push(new RectClickable(buttonLeftX,
                                          midY - buttonHeightD2,
                                          buttonWidth,
                                          buttonHeightD2 * 2,
                                          () => {
                ++this.current;
                console.log("next trick button");
            }));
        }
        if (this.current > 0) {
            // prev button
            const buttonRightX = this.menuRightX - this.menuWidth + buttonWidth;
            this.context.fillStyle = buttonColor;
            this.context.beginPath();
            this.context.moveTo(buttonRightX - buttonWidth, midY);
            this.context.lineTo(buttonRightX, midY + buttonHeightD2);
            this.context.lineTo(buttonRightX, midY - buttonHeightD2);
            this.context.fill();
            clickables.push(new RectClickable(buttonRightX - buttonWidth,
                                              midY - buttonHeightD2,
                                              buttonWidth,
                                              buttonHeightD2 * 2,
                                              () => {
                --this.current;
                console.log("prev trick button");
            }));
        }
    }
}

export default PrevDrawer;
