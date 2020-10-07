import Card from "./Card";
import Gui from "./Gui";
import CardGroup from "./CardGroup";
import Clickable from "./Clickable";

const framesPerCardAnimation = 10;

class CardAnimation {
    private fromX: number;
    private fromY: number;
    private frame: number;
    private toX: number;
    private toY: number;
    private endFrame: number;

    constructor() {
        this.fromX = 0.4;
        this.fromY = -1;
        this.toX = this.fromX;
        this.toY = this.fromY;
        this.frame = 0;
        this.endFrame = framesPerCardAnimation;
    }

    /** returns array of current x position and current y position
     *  proportional to canvas width and height
     */
    public current() {
        if (this.endFrame === 0) {
            return [this.toX, this.toY];
        }
        const distanceX = this.toX - this.fromX;
        const distanceY = this.toY - this.fromY;
        const through = this.frame / this.endFrame;
        return [through * distanceX + this.fromX, through * distanceY + this.fromY];
    }

    /** x and y proportional to canvas width and height */
    public setLocation(x: number, y: number) {
        this.fromX = x;
        this.fromY = y;
        this.toX = x;
        this.toY = y;
        this.frame = this.endFrame;
    }

    /** x and y proportional to canvas width and height */
    public setDestination(x: number, y: number) {
        if ((Math.abs(this.toX - x) > 0.0078125) || (Math.abs(this.toY - y) > 0.0078125)) {
            // new destination
            [this.fromX, this.fromY] = this.current();
            this.toX = x;
            this.toY = y;
            this.endFrame = framesPerCardAnimation;
            this.frame = 0;
        }
        return this.current();
    }

    /** frame */
    public update() {
        this.frame += (this.frame < this.endFrame) ? 1 : 0;
    }
}

class Drawer {
    // coordinates from image file
    static suitAssetYs: number[] = [0, 528, 352, 176];
    static assetHeight: number = 156;
    static valueXMult: number = 131.5834;
    static assetWidth: number = 112;

    static verticalPadding = 5;
    static spaceAboveHand = 20;
    
    private context: CanvasRenderingContext2D;
    private assets: HTMLImageElement;

    private cardWidth: number = 42;
    private cardHeight: number = 58.5;
    private vertical: boolean = false;
    private fontSize: number = 18;

    private gui: Gui;

    /** key is Card.hash() */
    private cardAnimations: Map<number, CardAnimation>;

    constructor(context: CanvasRenderingContext2D, assets: HTMLImageElement, gui: Gui) {
        this.context = context;
        this.assets = assets;
        this.gui = gui;

        this.cardAnimations = new Map();
        for (let value = 2; value < 15; ++value) {
            for (let suit = 0; suit < Card.SUIT_COUNT; ++suit) {
                this.cardAnimations.set((value << 2) + suit, new CardAnimation());
            }
        }
        
        // this doesn't work, don't know why (see to-do notes below)
        this.context.font = "" + this.fontSize + "px Arial";
        this.context.textBaseline = "top";
    }

    public resize(zoom: number) {
        this.vertical = this.context.canvas.height > this.context.canvas.width;
        this.cardWidth = zoom * this.context.canvas.width / (this.vertical ? 5.4 : 10.6 );
        this.cardHeight = this.cardWidth * Drawer.assetHeight / Drawer.assetWidth;
        console.log("card width set to", this.cardWidth);
    }

    public setAiCards() {
        for (let player = 1; player < 4; ++player) {
            // locations where players are sitting proportional to canvas
            const x = (player - 1.6);
            const y = (player === 2) ? -0.5 : 0.2;
            this.gui.game.hand.getHand(player).forEach((card, _index) => {
                this.cardAnimations.get(card.hash())?.setLocation(x, y);
            });
        }
    }

    private drawCard(card: Card, x: number, y: number) {
        const assetX = (((card.value === 14) ? 1 : card.value) - 1) * Drawer.valueXMult;
        const assetY = Drawer.suitAssetYs[card.suit];

        const canvas = this.context.canvas;
        const width = canvas.width;
        const height = canvas.height;

        const anim = this.cardAnimations.get(card.hash());
        if (! anim) { throw "anim not found with card " + card.str(); }
        const [propX, propY] = anim.setDestination(x / width, y / height);

        this.context.drawImage(this.assets,
                               assetX, assetY,
                               Drawer.assetWidth, Drawer.assetHeight,
                               propX * width, propY * height,
                               this.cardWidth, this.cardHeight);
        anim.update();
    }

    private static startsNewSuit(index: number, hand: CardGroup): boolean {
        if (index >= hand.length()) {
            return false;
        }
        if (index === 0) {
            return true;
        }
        return ((hand.at(index - 1) as Card).suit !== (hand.at(index) as Card).suit);
    }

    private static getRowBreak(hand: CardGroup): number {
        const handLength = hand.length();
        let checkingIndex = Math.floor(handLength / 2);
        if (Drawer.startsNewSuit(checkingIndex, hand)){
            return checkingIndex;
        }
        else {  // checking in middle of suit
            // go towards break between suit 1 and 2
            let direction = (hand.length(0) + hand.length(1) > checkingIndex) ? 1 : -1;
            checkingIndex += direction;
            // don't put more than 7 on a row
            while (checkingIndex > handLength - 8 && checkingIndex < 8) {
                if (Drawer.startsNewSuit(checkingIndex, hand)){
                    return checkingIndex;
                }
                checkingIndex += direction;
            }
            // check the other direction
            direction = 0 - direction;
            checkingIndex = Math.floor(handLength / 2) + direction;
            while (checkingIndex > handLength - 8 && checkingIndex < 8) {
                if (Drawer.startsNewSuit(checkingIndex, hand)){
                    return checkingIndex;
                }
                checkingIndex += direction;
            }
            // couldn't find a good break between suits, so break in the middle of a suit
            return Math.floor(handLength / 2);
        }

    }

    public drawHand(cardClick: (card: Card) => void) {
        const hand = this.gui.game.hand.getHand(0);
        const cardCount = hand.length();

        // build 2 rows
        const rows: { card: Card, index: number }[][] = [[], []];

        let firstIndexInRow1 = 0;  // start by assuming all 1 row
        if (this.vertical && cardCount > 7) {
            // need to make 2 rows
            firstIndexInRow1 = Drawer.getRowBreak(hand);
        }

        let rowIndex = 0;
        hand.forEach((card, index) => {
            if (index >= firstIndexInRow1) {
                rowIndex = 1;
            }
            rows[rowIndex].push({ card: card, index: index });
        });

        // draw them
        let rowY =
            this.context.canvas.height -
            ((this.cardHeight + Drawer.verticalPadding) * 2);
        // console.log("card width:", this.cardWidth);
        const maxRowLength = Math.max(rows[0].length, rows[1].length);
        // console.log("max row length:", maxRowLength);
        /** number of cards that can fit on a row without overlapping */
        const cardLimitPerRow = Math.floor(this.context.canvas.width / (this.cardWidth * 1.05));
        /** x distance from left side of one card to left side of the next */
        const cardSpaceWidth =
            (maxRowLength > cardLimitPerRow) ?
            (this.context.canvas.width - (this.cardWidth + 10)) / (maxRowLength - 1) :
            this.cardWidth * 1.05;
        // console.log("cardSpaceWidth:", cardSpaceWidth);
        rows.forEach((row) => {
            const xForRowBegin =
                this.context.canvas.width / 2 -  // middle
                ((cardSpaceWidth * (row.length - 1) + this.cardWidth) / 2);  // minus half the width of all the cards
                // last card doesn't take all of ^ cardSpaceWidth, only cardWidth
            row.forEach((cardAndIndex, indexInRow) => {
                // only if it's not in cards to pass
                if (this.gui.cardsToPass.find(cardAndIndex.card) === -1) {
                    const x = xForRowBegin +
                            (cardSpaceWidth * indexInRow);  // plus the width of the cards we've already drawn in this row
                    this.drawCard(cardAndIndex.card, x, rowY);
                    this.gui.clickables.push(new Clickable(x, rowY, this.cardWidth, this.cardHeight,
                                                       () => { cardClick(cardAndIndex.card); }));
                }
            });
            rowY += this.cardHeight + Drawer.verticalPadding;
        });
    }

    private drawPlayerScore(player: number, x: number, y: number) {
        this.context.fillText("Game: " + this.gui.game.scores[player], x, y);
        this.context.fillText("Hand: " + this.gui.game.hand.getScore(player), x, y + this.fontSize);
    }

    public drawScores() {
        // TODO: optimization: figure out why putting these (font and baseline) in Drawer constructor doesn't work
        this.context.font = "" + this.fontSize + "px Arial";
        this.context.textBaseline = "top";
        this.context.fillStyle = "#88ff88";
        // player 0
        this.context.fillText("Game: " + this.gui.game.scores[0] + "  Hand: " + this.gui.game.hand.getScore(0),
                              5,
                              this.yForBottomMiddle() + (this.cardHeight + Drawer.verticalPadding));
        // player 1
        this.drawPlayerScore(1, 5, this.context.canvas.height / 4);
        // player 2
        this.drawPlayerScore(2, (this.context.canvas.width + this.cardWidth + 10) / 2, 5);
        // player 3
        const w = this.context.measureText("Game: 100").width;
        this.drawPlayerScore(3, this.context.canvas.width - (w + 5), this.context.canvas.height / 3);
    }

    private yForBottomMiddle() {
        return this.context.canvas.height -
               ((this.vertical ? 3 : 2) *
                (this.cardHeight + Drawer.verticalPadding) +
                Drawer.spaceAboveHand);  // space for score or something
    }

    public drawCardsToPass() {
        const rowY = this.yForBottomMiddle();
        let x = this.context.canvas.width / 2 - (1.5 * this.cardWidth + 10);
        this.gui.cardsToPass.forEach((card) => {
            this.drawCard(card, x, rowY);
            this.gui.clickables.push(new Clickable(x, rowY, this.cardWidth, this.cardHeight,
                                               () => { this.gui.removeFromPass(card); }));
            x += this.cardWidth + 10;
        });
    }

    public drawPlayedCards() {
        const y = Math.min(this.yForBottomMiddle(), this.context.canvas.height / 2);
        const x = (this.context.canvas.width - this.cardWidth) / 2;
        const playedCards = this.gui.game.hand.getPlayedCards();
        if (playedCards[0].value) {
            this.drawCard(playedCards[0], x, y);
        }
        if (playedCards[1].value) {
            this.drawCard(playedCards[1], x - (10 + this.cardWidth), y - (this.cardHeight / 2 + 5));
        }
        if (playedCards[2].value) {
            this.drawCard(playedCards[2], x, y - (this.cardHeight + 10));
        }
        if (playedCards[3].value) {
            this.drawCard(playedCards[3], x + (10 + this.cardWidth), y - (this.cardHeight / 2 + 5));
        }
    }

    /**
     * 
     * @param x 
     * @param y 
     * @param size 
     * @param direction number of quadrants clockwise from right
     */
    private drawArrow(x: number, y: number, size: number, direction: number, opaque: boolean) {
        this.context.globalAlpha = opaque ? 1 : 0.5;
        this.context.fillStyle = "orange";

        this.context.translate(x + size/2, y + size/2);
        this.context.rotate(direction * Math.PI / 2);
        
        this.context.beginPath();
        this.context.moveTo(size / 2, 0);
        this.context.lineTo(0, 0 - size/2);
        this.context.lineTo(0, 0 - size/4);
        this.context.lineTo(0 - size/2, 0 - size/4);
        this.context.lineTo(0 - size/2, size / 4);
        this.context.lineTo(0, size / 4);
        this.context.lineTo(0, size / 2);
        this.context.fill();

        // undo rotation and translation and alpha
        this.context.rotate(0 - direction * Math.PI / 2);
        this.context.translate(0 - (x + size/2), 0 - (y + size/2));
        this.context.globalAlpha = 1;
    }

    public drawPassButton(opaque: boolean) {
        const size = 80;
        const x = this.context.canvas.width / 2 - (size / 2);
        const y =
            this.context.canvas.height -
            ((this.vertical ? 3 : 2) *
             (this.cardHeight + Drawer.verticalPadding) +
             Drawer.spaceAboveHand +
             Drawer.verticalPadding +
             size);
        
        this.drawArrow(x, y, size, this.gui.game.getPassingDirection() + 1, opaque);
        this.gui.clickables.push(new Clickable(x, y, size, size,
                                 () => { this.gui.passButtonClick(); }));
    }

    public drawEnd(winners: number[]) {
        this.context.fillStyle = "lightgray";
        const lineCount = winners.length + 1;
        const lineSize = this.fontSize + 2;

        // TODO: get names from somewhere if they are customizeable
        const winnerNames = ["You", "Left", "North", "3 o'Clock"];

        const boxHeight = (lineCount + 2) * lineSize;
        // TODO: max of measure text for all names and "winners" instead of winnerNames[3]
        const boxWidth = this.context.measureText(winnerNames[3]).width + (2 * lineSize);
        const boxX = (this.context.canvas.width - boxWidth) / 2;
        const boxY = (this.context.canvas.height - boxHeight) / 2;

        this.context.fillRect(boxX, boxY, boxWidth, boxHeight);

        // TODO: optimization: figure out why putting these (font and baseline) in Drawer contructor doesn't work
        this.context.font = "" + this.fontSize + "px Arial";
        this.context.textBaseline = "top";
        this.context.fillStyle = "black";

        this.context.fillText("winner" + ((winners.length > 1) ? "s:" : ":"), boxX + lineSize, boxY + lineSize);
        winners.forEach((player, index) => {
            this.context.fillText(winnerNames[player], boxX + lineSize, boxY + ((index + 2) * lineSize));
        });
    }

    public background() {
        this.context.fillStyle = "purple";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }
}

export default Drawer;
