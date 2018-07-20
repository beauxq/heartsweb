import HandObserver from "./HandObserver";
import Card from "./Card";
import Game from "./Game";
import AI from "./AI";

class Gui implements HandObserver {
    private context: CanvasRenderingContext2D;
    private assets: HTMLElement;
    private game: Game;
    private ais: (AI|null)[];

    constructor(context: CanvasRenderingContext2D, assets: HTMLElement) {
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
    }

    draw() {
        console.log("gui draw here");
    }

    click(e: MouseEvent) {
        console.log("gui click: ", e.x, e.y);
    }

    resetHand(): void {
        this.draw();
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
