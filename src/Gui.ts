import HandObserver from "./HandObserver";
import Card from "./Card";
import Game from "./Game";
import AI from "./AI";
import CardGroup from "./CardGroup";
import Clickable from "./Clickable";

function workerFunction() {
    // to run without a server
    // paste compiled and packed worker code here
    // and switch worker definition in constructor
}

class Gui implements HandObserver {
    // coordinates from image file
    static suitAssetYs: number[] = [0, 528, 352, 176];
    static assetHeight: number = 156;
    static valueXMult: number = 131.5834;
    static assetWidth: number = 112;

    static verticalPadding = 5;
    static spaceAboveHand = 20;

    private worker: Worker;

    private context: CanvasRenderingContext2D;
    private assets: HTMLImageElement;
    private clickables: Clickable[] = [];

    private game: Game;
    private ais: (AI|null)[];

    private cardWidth: number = 42;
    private cardHeight: number = 58.5;
    private vertical: boolean = false;

    private cardsToPass: CardGroup = new CardGroup();
    private humanPlayerPassed: boolean = false;

    public resize() {
        this.vertical = this.context.canvas.height > this.context.canvas.width;
        this.cardWidth = this.context.canvas.width / (this.vertical ? 7.6 : 13.7 );
        this.cardHeight = this.cardWidth * Gui.assetHeight / Gui.assetWidth;
        console.log("card width set to", this.cardWidth);
    }

    constructor(context: CanvasRenderingContext2D, assets: HTMLImageElement) {
        this.context = context;
        this.assets = assets;

        // this.worker = new Worker(URL.createObjectURL(new Blob(["("+workerFunction.toString()+")()"], {type: 'text/javascript'})));
        this.worker = new Worker("workerbundle.js");
        this.worker.addEventListener('message', (message) => {
            console.log("received message from worker:");
            console.log(message);
        });

        this.game = new Game();
        this.ais = [
            null,  // unused
            new AI(this.game.hand, 1),
            new AI(this.game.hand, 2),
            new AI(this.game.hand, 3)
        ];

        this.game.hand.registerObserver(this);
        for (let player = 1; player < 4; ++player) {
            this.game.hand.registerObserver(this.ais[player] as AI);
        }

        // TODO: load saved game
        this.game.reset();
        this.game.hand.resetHand();
        this.game.hand.dealHands();
        const cl = JSON.parse(JSON.stringify(this.ais, (key, value) => {
            if (key === "observerList") {
                return undefined;
            }
            return value;
        }))
        console.log("clone:");
        console.log(cl);
        this.worker.postMessage(cl);
    }

    /**
     * player clicks on card to pass
     * @param card 
     */
    private addToPass(card: Card) {
        console.log("clicked to pass", card.str());
        if (this.cardsToPass.length() < 3) {
            this.cardsToPass.insert(card);
            console.log("number of cards to pass", this.cardsToPass.length());
            this.draw();
        }
    }

    private removeFromPass(card: Card) {
        console.log("clicked to remove", card.str());
        this.cardsToPass.remove(card);
        this.draw();
    }

    /**
     * player clicks on card to play
     * @param card 
     */
    private playCard(card:Card) {
        console.log("clicked to play", card.str());
    }

    drawCard(card: Card, x: number, y: number) {
        const assetX = (((card.value === 14) ? 1 : card.value) - 1) * Gui.valueXMult;
        const assetY = Gui.suitAssetYs[card.suit];

        this.context.drawImage(this.assets,
                               assetX, assetY,
                               Gui.assetWidth, Gui.assetHeight,
                               x, y,
                               this.cardWidth, this.cardHeight);
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
        let checkingIndex = Math.floor(hand.length() / 2);
        if (Gui.startsNewSuit(checkingIndex, hand)){
            return checkingIndex;
        }
        else {  // checking in middle of suit
            // go towards break between suit 1 and 2
            let direction = (hand.length(0) + hand.length(1) > checkingIndex) ? 1 : -1;
            checkingIndex += direction;
            // don't put more than 7 on a row
            while (checkingIndex > hand.length() - 8 && checkingIndex < 8) {
                if (Gui.startsNewSuit(checkingIndex, hand)){
                    return checkingIndex;
                }
                checkingIndex += direction;
            }
            // check the other direction
            direction = 0 - direction;
            checkingIndex = Math.floor(hand.length() / 2) + direction;
            while (checkingIndex > hand.length() - 8 && checkingIndex < 8) {
                if (Gui.startsNewSuit(checkingIndex, hand)){
                    return checkingIndex;
                }
                checkingIndex += direction;
            }
            // couldn't find a good break between suits, so break in the middle of a suit
            return Math.floor(hand.length() / 2);
        }

    }

    drawHand(cardClick: Function) {
        const hand = this.game.hand.getHand(0);
        const cardCount = hand.length();

        // build 2 rows
        const rows: { card: Card, index: number }[][] = [[], []];

        let firstIndexInRow1 = 0;  // start by assuming all 1 row
        if (this.vertical && cardCount > 7) {
            // need to make 2 rows
            firstIndexInRow1 = Gui.getRowBreak(hand);
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
            ((this.cardHeight + Gui.verticalPadding) * 2);
        const cardSpaceWidth = this.cardWidth * 1.05;
        rows.forEach((row) => {
            const xForRowBegin =
                this.context.canvas.width / 2 -  // middle
                ((cardSpaceWidth * (row.length - 1) + this.cardWidth) / 2);  // minus half the width of all the cards
                // last card doesn't take all of ^ cardSpaceWidth, only cardWidth
            row.forEach((cardAndIndex, indexInRow) => {
                // only if it's not in cards to pass
                if (this.cardsToPass.find(cardAndIndex.card) === -1) {
                    const x = xForRowBegin +
                            (cardSpaceWidth * indexInRow);  // plus the width of the cards we've already drawn in this row
                    this.drawCard(cardAndIndex.card, x, rowY);
                    this.clickables.push(new Clickable(x, rowY, this.cardWidth, this.cardHeight,
                                                       () => { cardClick(cardAndIndex.card); }));
                }
            });
            rowY += this.cardHeight + Gui.verticalPadding;
        });
    }

    private drawCardsToPass() {
        const rowY =
            this.context.canvas.height -
            ((this.vertical ? 3 : 2) *
             (this.cardHeight + Gui.verticalPadding) +
             Gui.spaceAboveHand);  // space for score or something
        let x = this.context.canvas.width / 2 - (1.5 * this.cardWidth + 10);
        this.cardsToPass.forEach((card) => {
            this.drawCard(card, x, rowY);
            this.clickables.push(new Clickable(x, rowY, this.cardWidth, this.cardHeight,
                                               () => { this.removeFromPass(card); }));
            x += this.cardWidth + 10;
        });
    }

    /**
     * 
     * @param x 
     * @param y 
     * @param size 
     * @param direction number of quadrants clockwise from right
     */
    private drawArrow(x: number, y: number, size: number, direction: number) {
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

        // undo rotation and translation
        this.context.rotate(0 - direction * Math.PI / 2);
        this.context.translate(0 - (x + size/2), 0 - (y + size/2));
    }

    private drawPassButton() {
        const size = 80;
        const x = this.context.canvas.width / 2 - (size / 2);
        const y =
            this.context.canvas.height -
            ((this.vertical ? 3 : 2) *
             (this.cardHeight + Gui.verticalPadding) +
             Gui.spaceAboveHand +
             Gui.verticalPadding +
             size);
        
        this.drawArrow(x, y, size, this.game.getPassingDirection() + 1);
        this.clickables.push(new Clickable(x, y, size, size,
                             () => { this.passButtonClick(); }));
    }

    private passButtonClick() {
        this.game.hand.pass(0, this.game.getPassingDirection(), this.cardsToPass.slice());
        this.cardsToPass.clear();
        this.humanPlayerPassed = true;
        this.draw();
    }

    public draw() {
        console.log("gui draw here");
        this.context.fillStyle = "purple";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.clickables.length = 0;

        if (! this.humanPlayerPassed) {  // passing needs to be done
            //passing
            this.drawHand((card: Card) => { this.addToPass(card); });
            this.drawCardsToPass();

            if (this.cardsToPass.length() === 3) {
                this.drawPassButton();
            }
        }
        else if (this.game.hand.getPassCount() < 4) {
            this.drawHand(() => { console.log("clicked on card when human already passed"); });
        }
        else {
            this.drawHand((card: Card) => { this.playCard(card); });
        }
    }

    public click(e: MouseEvent) {
        console.log("gui click: ", e.x, e.y);
        this.clickables.some((c) => {
            if (c.contains(e.x, e.y)) {
                c.onClick();
                return true;  // only click on one thing at a time
            }
            return false;
        });
    }

    resetHand(): void {
        // this.draw();
    }
    dealHands(): void {
        this.humanPlayerPassed = false;
        this.draw();
    }
    receivePassedCards(): void {
        // TODO: show passed cards
        this.draw();
    }
    resetTrick(): void {
        this.draw();
    }
    pass(fromPlayer: number, toPlayer: number, cards: Card[]) {
        if (fromPlayer === 0) {
            this.humanPlayerPassed = true;
        }
        if (this.game.hand.getPassCount() === 4) {
            this.game.hand.receivePassedCards();
        }
        this.draw();
    }
    seeCardPlayed(card: Card, byPlayer: Number, showingOnlyHearts: boolean) {
        this.draw();
    }
}

export default Gui;
