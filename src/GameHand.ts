import CardGroup from "./CardGroup";
import Card from "./Card";
import HandObserver from "./HandObserver";

const nullCard = new Card(0, 0);

export interface TrickRecord {
    cards: Card[],
    whoWon: number
}

/**
 * each hand, call these in this order:
 * ```
 * resetHand();
 * dealHands();
 * pass(fromPlayer, toPlayer, passedCards);
 * receivePassedCards();  // TODO: return which cards (for UI)
 * resetTrick();
 * playCard(card);  // TODO: return hearts broken (for UI)
 * endTrick();  // TODO: returns who took the trick? (for UI)
 * endHand();  // returns who shot the moon
 * ```
 */
class GameHand {
    private hands: CardGroup[] = [new CardGroup(), new CardGroup(), new CardGroup(), new CardGroup()];
    private scores: number[] = [0, 0, 0, 0];
    private passingDirection = 0;
    private passedCardsToPlayer: Card[][] = [[], [], [], []];  // first index is player passed to
    private passCount: number = 0;

    // trick
    private playedCards: Card[] = [nullCard, nullCard, nullCard, nullCard];
    private playedCardCount: number = 0;
    /** who played the highest card in the lead suit */
    private trickLeader: number = 0;
    private whoseTurn: number = 0;
    private heartsBroken: boolean = false;
    private pointsPlayedThisTrick: boolean = false;

    /** updates in `endTrick` */
    private _trickHistory: TrickRecord[] = [];
    /** updates in `endTrick` */
    get trickHistory(): readonly TrickRecord[] { return this._trickHistory; }

    private shootMoonPossible: boolean = true;

    private observerList: HandObserver[] = [];

    /** construct new GameHand */
    constructor();
    /** copy constructor */
    constructor(gameHand: GameHand);
    constructor(gameHand?: GameHand) {
        if (gameHand) {
            // copy constructor
            this.hands[0] = new CardGroup(gameHand.hands[0]);
            this.hands[1] = new CardGroup(gameHand.hands[1]);
            this.hands[2] = new CardGroup(gameHand.hands[2]);
            this.hands[3] = new CardGroup(gameHand.hands[3]);
            this.scores = gameHand.scores.map(x => x);
            this.passingDirection = gameHand.passingDirection;
            for (let player = 0; player < 4; ++player) {
                this.passedCardsToPlayer[player].length = 0;
                gameHand.passedCardsToPlayer[player].forEach((card) => {
                    this.passedCardsToPlayer[player].push(new Card(card));
                });
            }
            this.passCount = gameHand.passCount;
            this.playedCards[0] = new Card(gameHand.playedCards[0]);
            this.playedCards[1] = new Card(gameHand.playedCards[1]);
            this.playedCards[2] = new Card(gameHand.playedCards[2]);
            this.playedCards[3] = new Card(gameHand.playedCards[3]);
            this.playedCardCount = gameHand.playedCardCount;
            this.trickLeader = gameHand.trickLeader;
            this.whoseTurn = gameHand.whoseTurn;
            this.heartsBroken = gameHand.heartsBroken;
            this.pointsPlayedThisTrick = gameHand.pointsPlayedThisTrick;
            if (gameHand._trickHistory) {
                this._trickHistory = gameHand._trickHistory.map((tr) => { return {
                    cards: tr.cards.map((card) => new Card(card)),
                    whoWon: tr.whoWon
                };});
            }
            else if (gameHand.trickHistory) {  // to be compatible with old saved data - TODO: get rid of this after a while?
                this._trickHistory = gameHand.trickHistory.map((tr) => { return {
                    cards: tr.cards.map((card) => new Card(card)),
                    whoWon: tr.whoWon
                };});
            }
            else {
                this._trickHistory = [];
            }
            this.shootMoonPossible = gameHand.shootMoonPossible;
            // don't copy observer list
        }
    }

    public registerObserver(ob: HandObserver) {
        this.observerList.push(ob);
    }

    public getWhoseTurn() {
        return this.whoseTurn;
    }

    public getHand(player: number) {
        return this.hands[player];
    }

    public getScore(player: number) {
        return this.scores[player];
    }

    public getPassingDirection(): number {
        return this.passingDirection;
    }

    public turnsLeftInTrick() {
        return 4 - this.playedCardCount;
    }

    public heartsIsBroken() {
        return this.heartsBroken;
    }

    public getPassCount() {
        return this.passCount;
    }

    public getPlayedCards(): readonly Card[] {
        return this.playedCards;
    }

    public getPlayedCardCount() {
        return this.playedCardCount;
    }

    /** changes with `GameHand.endTrick()`
     *  
     *  Between `endTrick` and `resetTrick`, this returns the same cards as `getPlayedCards`
     */
    public getPreviousTrick() {
        const l = this._trickHistory.length;
        return l ? this._trickHistory[l - 1] : {
            cards: [],
            whoWon: 0
        };
    }

    /** who played the highest card in the lead suit */
    public getTrickLeader() {
        return this.trickLeader;
    }

    public getPassedCardsToPlayer(player: number) {
        return this.passedCardsToPlayer[player];
    }

    public getShootMoonPossible(): boolean {
        return this.shootMoonPossible;
    }

    /**
     * to be called on keeper hand to say we're done passing
     */
    public setPassed() {
        this.passCount = 4;
    }

    /** to be called with speculated hands in AI simulation */
    public setHands(hands: CardGroup[]): void {
        this.hands = hands;
    }

    public resetHand(passingDirection: number) {
        this.passingDirection = passingDirection;
        for (let i = 0; i < 4; ++i) {
            this.hands[i].clear();
            this.scores[i] = 0;
            this.passedCardsToPlayer[i].length = 0;
        }
        this.passCount = 0;
        this.heartsBroken = false;
        this._trickHistory.length = 0;
        this.shootMoonPossible = true;

        this.observerList.forEach((ob) => { ob.resetHand(); });
    }

    public dealHands() {
        const deck = new CardGroup();
        deck.fill();

        while (deck.length()) {
            for (let i = 0; i < 4; ++i) {
                const dealt = deck.dealOne();
                this.hands[i].insert(dealt);

                if (dealt.value === 2 && dealt.suit === Card.CLUBS) {
                    this.whoseTurn = i;
                }
            }
        }

        this.observerList.forEach((ob) => { ob.dealHands(); });
    }

    public pass(fromPlayer: number, toPlayer: number, cards: Card[]) {
        cards.forEach((card) => {
            this.passedCardsToPlayer[toPlayer].push(card);
            this.hands[fromPlayer].remove(card);
        });

        ++this.passCount;

        this.observerList.forEach((ob) => { ob.pass(fromPlayer, toPlayer, cards); });
    }

    public receivePassedCards() {
        for (let playerIndex = 0; playerIndex < 4; ++playerIndex) {
            this.passedCardsToPlayer[playerIndex].forEach((card) => {
                this.hands[playerIndex].insert(card);
                if (card.value === 2 && card.suit === Card.CLUBS) {
                    this.whoseTurn = playerIndex;
                }
            });
        }

        this.observerList.forEach((ob) => { ob.receivePassedCards(); });
    }

    public resetTrick() {
        this.playedCards = [nullCard, nullCard, nullCard, nullCard];
        this.playedCardCount = 0;
        this.trickLeader = this.whoseTurn;
        this.pointsPlayedThisTrick = false;

        this.observerList.forEach((ob) => { ob.resetTrick(); });
    }

    private takesLead(card: Card) {
        return (card.suit === this.playedCards[this.trickLeader].suit  &&
                card.value > this.playedCards[this.trickLeader].value);
    }

    public playCard(card: Card) {
        // console.log("playing card on turn:", this.whoseTurn);
        this.hands[this.whoseTurn].remove(card);
        this.playedCards[this.whoseTurn] = card;
        // console.log("added card to playedCards:", this.playedCards);
        ++this.playedCardCount;

        if (this.takesLead(card)) {
            this.trickLeader = this.whoseTurn;
        }

        let showingOnlyHearts = false;
        if (card.suit === Card.HEARTS) {
            if (this.playedCardCount === 1 && ! this.heartsBroken) {
                showingOnlyHearts = true;
            }
            this.heartsBroken = true;  // TODO: alternate rule q of spades breaks hearts?
        }

        if (this.pointsFor(card)) {
            this.pointsPlayedThisTrick = true;
        }
        
        // give observer who played the card
        const byPlayer = this.whoseTurn;

        // see if it's still possible to shoot the moon
        if (this.shootMoonPossible) {
            if (this.pointsPlayedThisTrick) {
                let nonZeroScore = -1;
                for (let player = 0; player < 4; ++player) {
                    if (this.getScore(player)) {
                        nonZeroScore = player;
                        break;
                    }
                }

                if (nonZeroScore !== -1) {
                    // see whether this player has played yet this trick
                    let thisPlayerPLayed = false;
                    let goingThroughTurns = (byPlayer + 5 - this.getPlayedCardCount()) % 4;  // first turn this trick
                    for (let turn = this.getPlayedCardCount(); turn > 0; --turn) {
                        if (goingThroughTurns === nonZeroScore) {
                            thisPlayerPLayed = true;
                            break;
                        }
                        goingThroughTurns = (goingThroughTurns + 1) % 4;
                    }

                    if (thisPlayerPLayed) {
                        if (nonZeroScore !== this.getTrickLeader()) {
                            this.shootMoonPossible = false;

                            // for testing
                            // console.log("INFO: this is the point when it becomes impossible for anyone to shoot the moon");
                        }
                    }
                }
            }
        }

        this.whoseTurn = (this.whoseTurn + 1) % 4;

        this.observerList.forEach((ob) => { ob.seeCardPlayed(card, byPlayer, showingOnlyHearts); });
    }

    public pointsFor(card: Card) {
        return (card.suit === Card.HEARTS) ? 1 : (
            (card.value === 12 && card.suit === Card.SPADES) ? 13 : 0
        );
    }

    public endTrick() {
        this.playedCards.forEach((card) => {
            this.scores[this.trickLeader] += this.pointsFor(card);
        });

        this.whoseTurn = this.trickLeader;

        this._trickHistory.push({
            cards: this.playedCards.slice(),
            whoWon: this.trickLeader
        });
    }

    /**
     * returns who shot the moon, -1 if no one
     */
    public endHand() {
        // need the played cards to go away so gui doesn't try to draw them
        this.playedCards = [nullCard, nullCard, nullCard, nullCard];
        this.playedCardCount = 0;
        
        for (let winPlayer = 0; winPlayer < 4; ++winPlayer) {  // check for shoot the moon
            if (this.scores[winPlayer] === 26) {
                this.scores[winPlayer] = 0;
                for (let losePlayer = 0; losePlayer < 4; ++losePlayer) {
                    if (losePlayer !== winPlayer) {
                        this.scores[losePlayer] = 26;
                    }
                }
                return winPlayer;
            }
            else if (this.scores[winPlayer] > 0) {  // 1 to 25 points
                return -1;
            }
        }
        alert("this should never happen, invalid scores");
        console.log("this should never happen, invalid scores");
        return -2;
    }


    // rules of the game
    public findValidChoices(): readonly Card[] {
        const hand = this.hands[this.whoseTurn];
        if (hand.length() === 13) {  // first trick
            if (this.playedCardCount === 0) {  // first player
                return [new Card(2, Card.CLUBS)];
            }
            // not first player
            if (hand.length(Card.CLUBS)) {
                return hand.getSuit(Card.CLUBS);
            }
            else {  // no clubs
                const validChoices: Card[] = [];
                hand.forEach((card) => {
                    if (! this.pointsFor(card)) {
                        validChoices.push(card);
                    }
                });
                if (validChoices.length) {
                    return validChoices;
                }
                // only points in hand
                return hand.slice();
            }
        }
        else {  // not first trick
            if (this.playedCardCount === 0) {  // leading trick
                if (this.heartsBroken) {
                    return hand.slice();
                }
                // hearts not broken
                if (hand.length(Card.HEARTS) === hand.length()) {  // only hearts in hand
                    return hand.slice();
                }
                // non-hearts in hand, play anything not hearts
                const validChoices: Card[] = [];
                hand.forEach((card) => {
                    if (card.suit !== Card.HEARTS) {
                        validChoices.push(card);
                    }
                });
                return validChoices;
            }
            else {  // not leading trick
                if (hand.length(this.playedCards[this.trickLeader].suit)) {  // have suit that is lead
                    return hand.getSuit(this.playedCards[this.trickLeader].suit);
                }
                // don't have matching suit
                return hand.slice();
            }
        }
    }
}

export default GameHand;
