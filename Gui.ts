import HandObserver from "./HandObserver";
import Card from "./Card";
import Game from "./Game";
import AI from "./AI";

class Gui implements HandObserver {
    // coordinates from image file
    static suitAssetYs: number[] = [0, 528, 352, 176];
    static assetHeight: number = 156;
    static valueXMult: number = 131.5834;
    static assetWidth: number = 112;

    private context: CanvasRenderingContext2D;
    private assets: HTMLImageElement;
    private game: Game;
    private ais: (AI|null)[];
    private cardWidth: number = 42;
    private cardHeight: number = 58.5;
    private vertical: boolean = false;

    public resize() {
        this.vertical = this.context.canvas.height > this.context.canvas.width;
        this.cardWidth = this.context.canvas.width / (this.vertical ? 7.5 : 13.5 );
        this.cardHeight = this.cardWidth * Gui.assetHeight / Gui.assetWidth;
        console.log("card width set to", this.cardWidth);
    }

    constructor(context: CanvasRenderingContext2D, assets: HTMLImageElement) {
        this.context = context;
        this.assets = assets;

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

        this.game.reset();
        this.game.hand.resetHand();
        this.game.hand.dealHands();
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

    drawHand() {
        if (this.context.canvas.width > this.context.canvas.height) {
            // one row
        }
        else {
            // two rows
        }
        this.game.hand.getHand(0).forEach((card, index) => {

        });
    }

    draw() {
        console.log("gui draw here");
        this.context.fillStyle = "purple";
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        if (this.game.hand.getPassCount() < 4) {  // passing needs to be done
            //passing

            this.drawCard(this.game.hand.getHand(0).at(0) as Card, 20, 20);
        }
        else {
            
        }
    }

    click(e: MouseEvent) {
        console.log("gui click: ", e.x, e.y);
    }

    resetHand(): void {
        // this.draw();
    }
    dealHands(): void {
        this.draw();
    }
    receivePassedCards(): void {
        this.draw();
    }
    resetTrick(): void {
        this.draw();
    }
    pass(fromPlayer: number, toPlayer: number, cards: Card[]) {
        this.draw();
    }
    seeCardPlayed(card: Card, byPlayer: Number, showingOnlyHearts: boolean) {
        this.draw();
    }
}

export default Gui;
