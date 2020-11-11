import HandObserver from "./HandObserver";
import Card from "./Card";
import Game from "./Game";
import AI from "./AI";
import CardGroup from "./CardGroup";
import { Clickable } from "./Clickable";
import Waiter from "./Waiter";
import Drawer from "./Drawer";
import Stats from "./Stats";

/*
function workerFunction() {
    // to run without a server
    // paste compiled and packed worker code here
    // and switch worker definition in constructor
}
*/

/** controller */
class Gui implements HandObserver {
    private worker: Worker;

    public clickables: Clickable[] = [];

    public game!: Game;  // assigned in restore method - TODO: remove these ! when tsc fixes this problem https://github.com/microsoft/TypeScript/issues/30462
    private ais!: (AI|null)[];  // assigned in restore method

    public cardsToPass: CardGroup = new CardGroup();
    private humanPlayerPassed: boolean = false;
    private receivedCards: Card[] = [];

    private showingPassedCards: boolean = false;
    
    private waiter: Waiter = new Waiter();

    private drawer: Drawer;

    private storage: Storage;

    private stats: Stats;

    public getStatData() {
        return this.stats.get();
    }

    public resize(zoom: number) {
        this.drawer.resize(zoom);
    }

    /** you can't stringify Game or AI with observerList
     *  because it's infinitely recursive
     */
    static filterOutObserverList(key: string, value: any) {
        return (key === "observerList") ? undefined : value;
    }

    /** send message to worker for choosing cards to pass */
    private workerMessagePassing() {
        const cl = JSON.parse(JSON.stringify(this.ais,
                                             Gui.filterOutObserverList));
        console.log("clone:");
        console.log(cl);
        this.worker.postMessage(cl);
    }

    /** send message to worker for choosing card to play */
    private workerMessagePlay() {
        console.log("sending play message to worker, turn:", this.game.hand.getWhoseTurn());
        const cl = JSON.parse(JSON.stringify(this.ais[this.game.hand.getWhoseTurn()],
                                             Gui.filterOutObserverList));
        this.worker.postMessage(cl);
    }

    constructor(context: CanvasRenderingContext2D, storage: Storage) {
        this.storage = storage;
        this.stats = new Stats(storage);

        // this.worker = new Worker(URL.createObjectURL(new Blob(["("+workerFunction.toString()+")()"], {type: 'text/javascript'})));
        this.worker = new Worker("workerbundle.js");
        this.worker.addEventListener('message', (message) => {
            console.log("received message from worker:");
            console.log(message);
            this.handleMessage(message.data);
        });

        this.restore();

        this.drawer = new Drawer(context, this);
        this.drawer.setAiCards();

        setInterval(() => { this.draw(); }, 40);
    }

    private deleteSave() {
        this.storage.removeItem("game");
        this.storage.removeItem("ais");
        this.storage.removeItem("hpp");
    }

    private save() {
        const gameString = JSON.stringify(this.game,
                                          Gui.filterOutObserverList);
        const aiString = JSON.stringify(this.ais,
                                        Gui.filterOutObserverList);
        this.storage.setItem("game", gameString);
        this.storage.setItem("ais", aiString);
        this.storage.setItem("hpp", this.humanPlayerPassed ? "t" : "f");
    }

    /** from local storage */
    private restore() {
        const gameString = this.storage.getItem("game");
        const aiString = this.storage.getItem("ais");
        const hpp = this.storage.getItem("hpp");

        this.humanPlayerPassed = hpp === "t";

        if (gameString && aiString) {
            const ais = JSON.parse(aiString);
            this.game = new Game(JSON.parse(gameString));
            this.ais = [
                null,  // unused
                new AI(ais[1]),
                new AI(ais[2]),
                new AI(ais[3])
            ];
            this.ais[1]!.setHand(this.game.hand);
            this.ais[2]!.setHand(this.game.hand);
            this.ais[3]!.setHand(this.game.hand);
        }
        else {
            this.game = new Game();
            this.ais = [
                null,  // unused
                new AI(this.game.hand, 1),
                new AI(this.game.hand, 2),
                new AI(this.game.hand, 3)
            ];
        }

        for (let player = 1; player < 4; ++player) {
            this.game.hand.registerObserver(this.ais[player]!);
        }
        this.game.hand.registerObserver(this);

        if (! gameString) {
            this.game.reset();
            this.game.hand.resetHand(this.game.getPassingDirection());
        }
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
        }
    }

    public removeFromPass(card: Card) {
        console.log("clicked to remove", card.str());
        this.cardsToPass.remove(card);
    }

    /**
     * player clicks on card to play
     * @param card 
     */
    private playCard(card:Card) {
        console.log("clicked to play", card.str());
        const validChoices = this.game.hand.findValidChoices();
        if (validChoices.some((validCard) => {
                return (card.value === validCard.value && card.suit === validCard.suit);
            })
        ) {
            this.game.hand.playCard(card);
        }
    }

    public passButtonClick() {
        if (! (this.cardsToPass.length() > 2)) { return; }
        this.humanPlayerPassed = true;
        const passingCards = this.cardsToPass.slice();
        this.cardsToPass.clear();
        this.game.hand.pass(0, this.game.getPassingDirection(), passingCards);
    }

    public draw() {
        // console.log("gui draw here");
        this.drawer.background();
        this.clickables.length = 0;

        this.drawer.drawScores();

        if (! this.humanPlayerPassed) {  // passing needs to be done
            //passing
            this.drawer.drawHand((card: Card) => { this.addToPass(card); });
            this.drawer.drawCardsToPass();
            this.drawer.drawPassButton(this.cardsToPass.length() === 3);
        }
        else if (this.game.hand.getPassCount() < 4) {
            this.drawer.drawHand((card: Card) => { console.log(`clicked on card ${card.str()} when human already passed`); });
        }
        else if (this.showingPassedCards) {
            console.log("got draw in showing passed cards, length:", this.cardsToPass.length());
            this.drawer.drawHand((card: Card) => { console.log(`clicked card ${card.str()} while showing passed, but you shouldn't see this because click goes to skipping timer`); });
            this.drawer.drawCardsToPass();
        }
        else if (this.game.winners.length) {  // game over
            this.drawer.drawPreviousTrick();  // I think this doesn't work
            this.drawer.drawEnd(this.game.winners);
        }
        else {
            this.drawer.drawHand((card: Card) => { this.playCard(card); });
            this.drawer.drawPlayedCards();
            this.drawer.drawPreviousTrick();
        }

        this.drawer.drawMenu();
    }

    public click(e: MouseEvent) {
        console.log("gui click: ", e.x, e.y);

        // have to go through clickables backwards
        // because the one that is drawn last is on top and thus has priority for click
        for (let i = this.clickables.length - 1; i >= 0; --i) {
            if (this.clickables[i].contains(e.x, e.y)) {
                // found an object under click
                if (this.clickables[i].allowedWhileWaiting) {
                    return this.clickables[i].onClick();
                    // this click doesn't skip waiter
                }
                else {  // not allowed while waiting
                    if (this.waiter.click()) {
                        return;
                    }
                    // else not waiting
                    return this.clickables[i].onClick();
                }
                // break;  // only click on one thing at a time
            }
        }
        // nothing to click on
        this.waiter.click();
    }

    private handleMessage(messageData: any) {
        if (messageData.value) {
            // single card
            // play it
            console.log("received message from worker, turn:", this.game.hand.getWhoseTurn());
            this.waiter.gotMessage(new Card(messageData));
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

    /**
     * returns a promise resolved when were done waiting
     * @param seconds 
     * @param allowSkipWithClick clicking the mouse skips the wait
     * @param forPlay waiting for the next player to play a card
     */
    private drawWait(seconds: number, allowSkipWithClick: boolean, forPlay: boolean) {
        return this.waiter.wait(seconds, allowSkipWithClick, forPlay);
    }

    private showReceivedCards() {
        this.showingPassedCards = true;
        return this.drawWait(3, true, false).then(() => {
            this.showingPassedCards = false;
            this.cardsToPass.clear();
        });
    }

    private computerTurn() {
        this.workerMessagePlay();
        this.drawWait(0.5, true, true).then((messageData) => {
            this.game.hand.playCard(messageData as Card);
        });
    }

    // notifications from hand (handObserver interface)
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
            this.drawer.setAiCards();
            this.game.hand.resetTrick();
        }
    }
    receivePassedCards(): void {
        console.log("gui sees received passed cards");
        this.drawer.setAiCards();
        this.game.hand.resetTrick();
    }
    resetTrick(): void {
        if (this.game.hand.getWhoseTurn() !== 0) {
            this.computerTurn();
        }
        else {
            this.save();
        }
    }
    pass(fromPlayer: number, _toPlayer: number, _cards: Card[]) {
        if (fromPlayer === 0) {
            this.humanPlayerPassed = true;
        }
        if (this.game.hand.getPassCount() === 4) {
            // show passed cards
            this.receivedCards = this.game.hand.getPassedCardsToPlayer(0).slice();
            // console.log("about to clear from pass function");
            this.cardsToPass.clear();
            this.cardsToPass.insert(this.receivedCards[0]);
            this.cardsToPass.insert(this.receivedCards[1]);
            this.cardsToPass.insert(this.receivedCards[2]);
            this.showReceivedCards().then(() => {
                this.game.hand.receivePassedCards();
            });
        }
        else if (this.game.hand.getPassCount() === 3) {
            this.save();
        }
    }
    seeCardPlayed(_card: Card, _byPlayer: Number, _showingOnlyHearts: boolean) {
        console.log("see card played in GUI");
        // show card for 1 second, while next turn thinks
        if (this.game.hand.getPlayedCardCount() === 4) {
            // if the queen is in this trick, add to stats
            if (this.game.hand.getPlayedCards().some((card) => {
                return card.value === 12 && card.suit === Card.SPADES;
            })) {
                this.stats.queen(this.game.hand.getTrickLeader());
            }

            this.game.hand.endTrick();
            this.drawWait(2, true, false).then(() => {
                if (this.game.hand.getHand(0).length()) {
                    this.game.hand.resetTrick();
                }
                else {
                    console.log("last card of hand played");
                    const whoMoon = this.game.hand.endHand();
                    this.game.endHand();
                    this.stats.hand(whoMoon);
                    // check for game end
                    if (this.game.winners.length) {
                        // game end
                        this.stats.game(this.game.scores);
                        this.deleteSave();
                        this.drawWait(2, false, false).then(() => {
                            this.drawWait(1000000, true, false).then(() => {
                                this.game.reset();
                                this.game.hand.resetHand(this.game.getPassingDirection());
                            });
                        });
                    }
                    else {  // game not over
                        // if menu opened, don't move to next hand
                        // else, wait for animation of cards going away
                        this.drawWait(this.drawer.menu.opened ? 1000000 : 0.5, true, false).then(() => {
                            this.game.hand.resetHand(this.game.getPassingDirection());
                        });
                    }
                }
            });
        }
        else if (this.game.hand.getWhoseTurn() !== 0) {  // (and not last turn in trick)
            this.computerTurn();
        }
        else {  // human turn
            this.save();
        }
    }
}

export default Gui;
