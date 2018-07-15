import CardGroup from "./CardGroup";
import Card from "./Card";
import HandObserver from "./HandObserver";

const nullCard = new Card(0, 0);

class GameHand {
    private hands: CardGroup[] = [new CardGroup(), new CardGroup(), new CardGroup(), new CardGroup()];
    private scores: number[] = [0, 0, 0, 0];
    private passedCardsToPlayer: Card[][] = [[], [], [], []];  // first index is player passed to
    private passCount: number = 0;

    // trick
    private playedCards: Card[] = [nullCard, nullCard, nullCard, nullCard];
    private playedCardCount: number = 0;
    private trickLeader: number = 0;
    private whoseTurn: number = 0;
    private heartsBroken: boolean = false;

    private observerList: HandObserver[] = [];

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

    public turnsLeftInTrick() {
        return 4 - this.playedCardCount;
    }

    public heartsIsBroken() {
        return this.heartsBroken;
    }

    public getPassCount() {
        return this.passCount;
    }

    public getPlayedCards() {
        return this.playedCards;
    }

    public getPlayedCardCount() {
        return this.playedCardCount;
    }

    public getTrickLeader() {
        return this.trickLeader;
    }

    public getPassedCardsToPlayer(player: number) {
        return this.passedCardsToPlayer[player];
    }

    /**
     * to be called on keeper hand to say we're done passing
     */
    public setPassed() {
        this.passCount = 4;
    }


    public resetHand() {
        for (let i = 0; i < 4; ++i) {
            this.hands[i].clear();
            this.scores[i] = 0;
            this.passedCardsToPlayer[i].length = 0;
        }
        this.passCount = 0;
        this.heartsBroken = false;

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

        this.observerList.forEach((ob) => { ob.resetTrick(); });
    }

    private takesLead(card: Card) {
        return (card.suit === this.playedCards[this.trickLeader].suit  &&
                card.value > this.playedCards[this.trickLeader].value);
    }

    public playCard(card: Card) {
        this.hands[this.whoseTurn].remove(card);
        this.playedCards[this.whoseTurn] = card;
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

        // observer here before whoseTurn is changed
        this.observerList.forEach((ob) => { ob.seeCardPlayed(card, this.whoseTurn, showingOnlyHearts); });

        this.whoseTurn = (this.whoseTurn + 1) % 4;
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

        // TODO: history of tricks?
    }

    /**
     * returns who shot the moon, -1 if no one
     */
    public endHand() {
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
    public findValidChoices(): Card[] {
        const hand = this.hands[this.whoseTurn];
        if (hand.length() === 13) {  // first trick
            if (this.playedCardCount === 0) {  // first player
                return [new Card(2, Card.CLUBS)];
            }
            // not first player
            if (hand.length(Card.CLUBS)) {
                return hand.getSuit(Card.CLUBS).slice();
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
                // hearts in hand, play anything not hearts
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
