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
    private fontSize: number = 18;

    private cardsToPass: CardGroup = new CardGroup();
    private humanPlayerPassed: boolean = false;
    private receivedCards: Card[] = [];

    private showingPassedCards: boolean = false;
    private waiting: boolean = false;
    private clickSkips: boolean = true;
    private currentWait: any = null;

    public resize() {
        this.vertical = this.context.canvas.height > this.context.canvas.width;
        this.cardWidth = this.context.canvas.width / (this.vertical ? 7.6 : 13.7 );
        this.cardHeight = this.cardWidth * Gui.assetHeight / Gui.assetWidth;
        console.log("card width set to", this.cardWidth);
    }

    private workerMessagePassing() {
        const cl = JSON.parse(JSON.stringify(this.ais, (key, value) => {
            if (key === "observerList") {
                return undefined;
            }
            return value;
        }));
        console.log("clone:");
        console.log(cl);
        this.worker.postMessage(cl);
    }

    private workerMessagePlay() {
        console.log("sending play message to worker, turn:", this.game.hand.getWhoseTurn());
        const cl = JSON.parse(JSON.stringify(this.ais[this.game.hand.getWhoseTurn()], (key, value) => {
            if (key === "observerList") {
                return undefined;
            }
            return value;
        }));
        this.worker.postMessage(cl);
    }

    constructor(context: CanvasRenderingContext2D, assets: HTMLImageElement) {
        this.context = context;
        this.assets = assets;

        // this.worker = new Worker(URL.createObjectURL(new Blob(["("+workerFunction.toString()+")()"], {type: 'text/javascript'})));
        this.worker = new Worker("workerbundle.js");
        this.worker.addEventListener('message', (message) => {
            console.log("received message from worker:");
            console.log(message);
            this.handleMessage(message.data);
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
        // these are in resetHand observer
        // this.game.hand.dealHands();
        // this.workerMessagePassing();
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
        const validChoices = this.game.hand.findValidChoices();
        if (validChoices.some((validCard) => {
                if (card.value === validCard.value && card.suit === validCard.suit) {
                    return true;
                }
                return false;
            })
        ) {
            this.game.hand.playCard(card);
        }
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

    private drawPlayerScore(player: number, x: number, y: number) {
        this.context.fillText("Game: " + this.game.scores[player], x, y + this.fontSize / 2);
        this.context.fillText("Hand: " + this.game.hand.getScore(player), x, y + this.fontSize * 1.5);
    }

    drawScores() {
        this.context.font = "" + this.fontSize + "px Arial";
        this.context.fillStyle = "#88ff88";
        // player 0
        this.context.fillText("Game: " + this.game.scores[0] + "  Hand: " + this.game.hand.getScore(0),
                              5,
                              this.yForBottomMiddle() + (this.cardHeight + Gui.verticalPadding) + this.fontSize / 2);
        // player 1
        this.drawPlayerScore(1, 5, this.context.canvas.height / 4);
        // player 2
        this.drawPlayerScore(2, (this.context.canvas.width + this.cardWidth + 10) / 2, 5);
        // player 3
        this.drawPlayerScore(3, this.context.canvas.width - 100, this.context.canvas.height / 2);
    }

    private yForBottomMiddle() {
        return this.context.canvas.height -
               ((this.vertical ? 3 : 2) *
                (this.cardHeight + Gui.verticalPadding) +
                Gui.spaceAboveHand);  // space for score or something
    }

    private drawCardsToPass() {
        const rowY = this.yForBottomMiddle();
        let x = this.context.canvas.width / 2 - (1.5 * this.cardWidth + 10);
        this.cardsToPass.forEach((card) => {
            this.drawCard(card, x, rowY);
            this.clickables.push(new Clickable(x, rowY, this.cardWidth, this.cardHeight,
                                               () => { this.removeFromPass(card); }));
            x += this.cardWidth + 10;
        });
    }

    private drawPlayedCards() {
        const y = Math.min(this.yForBottomMiddle(), this.context.canvas.height / 2);
        const x = (this.context.canvas.width - this.cardWidth) / 2;
        const playedCards = this.game.hand.getPlayedCards();
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
        this.humanPlayerPassed = true;
        const passingCards = this.cardsToPass.slice();
        this.cardsToPass.clear();
        this.game.hand.pass(0, this.game.getPassingDirection(), passingCards);
        // console.log("about to clear from passButtonClick");
        // this.cardsToPass.clear();
        // this.draw();
    }

    public draw() {
        console.log("gui draw here");
        this.context.fillStyle = "purple";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.clickables.length = 0;

        this.drawScores();

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
        else if (this.showingPassedCards) {
            console.log("got draw in showing passed cards, length:", this.cardsToPass.length());
            this.drawHand((card: Card) => { console.log("clicked card while showing passed, but you shouldn't see this because click goes to skipping timer"); });
            this.drawCardsToPass();
        }
        else {
            this.drawHand((card: Card) => { this.playCard(card); });
            this.drawPlayedCards();
        }
    }

    public click(e: MouseEvent) {
        console.log("gui click: ", e.x, e.y);
        if (this.waiting && this.clickSkips) {
            clearTimeout(this.currentWait);
            this.waiting = false;
            return;
        }

        this.clickables.some((c) => {
            if (c.contains(e.x, e.y)) {
                c.onClick();
                return true;  // only click on one thing at a time
            }
            return false;
        });
    }

    private handleMessage(messageData: any) {
        if (messageData.value) {
            // single card
            // play it
            console.log("received message from worker, turn:", this.game.hand.getWhoseTurn());
            this.game.hand.playCard(new Card(messageData));
        }
        else {
            // passing data
            for (let fromPlayer = 1; fromPlayer < 4; ++fromPlayer) {
                const toPlayer = (fromPlayer + this.game.getPassingDirection()) % 4;
                const cardArray: Card[] = [
                    new Card(messageData[fromPlayer][0]),
                    new Card(messageData[fromPlayer][1]),
                    new Card(messageData[fromPlayer][2])
                ];
                this.game.hand.pass(fromPlayer, toPlayer, cardArray);
            }
        }
    }

    private drawWait(seconds: number, allowSkipWithClick: boolean) {
        this.waiting = true;
        this.clickSkips = allowSkipWithClick;
        this.currentWait = setTimeout(() => {
            this.waiting = false;
        }, seconds * 1000);
        this.draw();
        console.log("just called draw from drawWait, length:", this.cardsToPass.length());
        return new Promise((resolve, reject) => {
            let intervalTimer: any;
            intervalTimer = setInterval(() => {
                if (! this.waiting) {
                    clearInterval(intervalTimer);
                    resolve();
                }
            }, 50);
        });
    }

    private showReceivedCards() {
        this.showingPassedCards = true;
        return this.drawWait(3, true).then(() => {
            this.showingPassedCards = false;
            this.cardsToPass.clear();
        });
    }

    resetHand(): void {
        this.game.hand.dealHands();
    }
    dealHands(): void {
        this.receivedCards.length = 0;
        if (this.game.getPassingDirection()) {
            this.humanPlayerPassed = false;
            this.workerMessagePassing();
        }
        else {
            this.game.hand.setPassed();
            this.humanPlayerPassed = true;
            this.game.hand.resetTrick();
        }
        this.draw();
    }
    receivePassedCards(): void {
        console.log("gui sees received passed cards");
        this.game.hand.resetTrick();
        this.draw();
    }
    resetTrick(): void {
        if (this.game.hand.getWhoseTurn() !== 0) {
            this.workerMessagePlay();
        }
        this.draw();
    }
    pass(fromPlayer: number, toPlayer: number, cards: Card[]) {
        if (fromPlayer === 0) {
            this.humanPlayerPassed = true;
        }
        else if (toPlayer === 0) {
            // saved passed cards
            this.receivedCards = cards.slice();
        }
        if (this.game.hand.getPassCount() === 4) {
            // show passed cards
            console.log("about to clear from pass function");
            this.cardsToPass.clear();
            this.cardsToPass.insert(this.receivedCards[0]);
            this.cardsToPass.insert(this.receivedCards[1]);
            this.cardsToPass.insert(this.receivedCards[2]);
            this.showReceivedCards().then(() => {
                this.game.hand.receivePassedCards();
            });
        }
        this.draw();
    }
    seeCardPlayed(card: Card, byPlayer: Number, showingOnlyHearts: boolean) {
        // TODO: show card for 1 second, while next turn thinks
        if (this.game.hand.getPlayedCardCount() === 4) {
            this.game.hand.endTrick();
            this.drawWait(2, true).then(() => {
                if (this.game.hand.getHand(0).length()) {
                    this.game.hand.resetTrick();
                }
                else {
                    console.log("last card of hand played");
                    this.game.hand.endHand();
                    this.game.endHand();
                    // TODO: check for game end
                    this.game.hand.resetHand();
                }
            });
        }
        else if (this.game.hand.getWhoseTurn() !== 0) {  // (and not last turn in trick)
            this.workerMessagePlay();
        }
        this.draw();
    }
}

export default Gui;
