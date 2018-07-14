import CardGroup from "./CardGroup";
import Card from "./Card";

class GameHand {
    private hands: CardGroup[] = [new CardGroup(), new CardGroup(), new CardGroup(), new CardGroup()];
    private scores: number[] = [0, 0, 0, 0];
    private passedCardsToPlayer: Card[][] = [[], [], [], []];  // first index is player passed to
    private passCount: number = 0;

    // trick
    private playedCards: Card[] = [null, null, null, null];
    private playedCardCount: number = 0;
    private trickLeader: number;
    private whoseTurn: number;
    private heartsBroken: boolean = false;

    public getWhoseTurn() {
        return this.whoseTurn;
    }

    public getHand(player) {
        return this.hands[player];
    }

    public getScore(player) {
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

    public getPassedCardsToPlayer(player) {
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
    }

    public pass(fromPlayer: number, toPlayer: number, cards: Card[]) {
        cards.forEach((card) => {
            this.passedCardsToPlayer[toPlayer].push(card);
            this.hands[fromPlayer].remove(card);
        });

        ++this.passCount;
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
    }

    public resetTrick() {
        this.playedCardCount = 0;
        this.trickLeader = this.whoseTurn;
    }

    private takesLead(card: Card) {
        return (card.suit === this.playedCards[this.trickLeader].suit  &&
                card.value > this.playedCards[this.trickLeader].value);
    }

    public playCard(card: Card) {
        this.hands[this.whoseTurn].remove(card);
        this.playedCards[this.whoseTurn] = card;
        ++this.playedCardCount;

        // notify ai:
        // if points played this trick
        // remove from unknown cards of all players
        // remove from passed cards
        // is player showing they have none of a suit?
        // showing that they only have hearts?

        if (this.takesLead(card)) {
            this.trickLeader = this.whoseTurn;
        }

        if (card.suit === Card.HEARTS) {
            this.heartsBroken = true;  // TODO: alternate rule q of spades breaks hearts?
        }

        this.whoseTurn = (this.whoseTurn + 1) % 4;
    }

    private pointsFor(card: Card) {
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
                const validChoices = [];
                hand.forEach((card) => {
                    if (card.suit !== Card.HEARTS) {
                        validChoices.push(card);
                    }
                });
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
