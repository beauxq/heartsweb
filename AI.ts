import HandObserver from "./HandObserver";
import CardGroup from "./CardGroup";
import GameHand from "./GameHand";
import Card from "./Card";

class AI implements HandObserver {
    private pointsPlayedThisTrick: boolean = false;
    private shootMoonPossible: boolean = true;
    private unknownCards: CardGroup = new CardGroup();
    private playerSeenVoidInSuits: boolean[][];

    private cardsIPassed: Card[] = [];  // and not played yet, removed from here when they are seen played
    private gameHand: GameHand;
    private whoAmI: number;  // playerIndex

    private speculateHands(passingDirection: number) {
        const speculatedHands = [
            new CardGroup(), new CardGroup(), new CardGroup(), new CardGroup()
        ];
        const spaceRemainingIn = [
            this.gameHand.getHand(0).length(),
            this.gameHand.getHand(1).length(),
            this.gameHand.getHand(2).length(),
            this.gameHand.getHand(3).length()
        ];

        // I know my own hand
        spaceRemainingIn[this.whoAmI] = 0;

        const whomIPassedTo = (this.whoAmI + passingDirection) % 4;
        spaceRemainingIn[whomIPassedTo] -= this.cardsIPassed.length;

        function nonFullHands(player) { return spaceRemainingIn[player] > 0 };

        const handsThatAllowSuit: boolean[][] = [];  // first index is suit, second is player
        for (let suit = 0; suit < 4; ++suit) {
            handsThatAllowSuit.push([
                ! (this.playerSeenVoidInSuits[0][suit]),
                ! (this.playerSeenVoidInSuits[1][suit]),
                ! (this.playerSeenVoidInSuits[2][suit]),
                ! (this.playerSeenVoidInSuits[3][suit])
            ]);
        }

        const allowSuitAndNonFull = [];  // intersection of non-full-hands with hands that allow this suit
        this.unknownCards.forEach((thisCard) => {
            allowSuitAndNonFull.length = 0;
            handsThatAllowSuit[thisCard.suit].forEach((allowThisSuit, player) => {
                if (allowThisSuit && nonFullHands(player)) {
                    allowSuitAndNonFull.push(player);
                }
            });

            if (allowSuitAndNonFull.length) {
                const receiver = allowSuitAndNonFull[Math.floor(Math.random() * allowSuitAndNonFull.length)];
                speculatedHands[receiver].insert(thisCard);
                -- spaceRemainingIn[receiver];
            }
            else {  // there are no hands left that allow this suit and have space for this card
                // so we have to do some swapping
                // find which suits are allowed in non-full hands
                const suitsAllowedInNonFull = [ false, false, false, false ];
                for (let player = 0; player < 4; ++player) {
                    if (nonFullHands(player)) {
                        for (let suit = 0; suit < 4; ++suit) {
                            if (handsThatAllowSuit[suit][player]) {
                                suitsAllowedInNonFull[suit] = true;
                            }
                        }
                    }
                }
                // find possible cards to swap (out of those suits)
                const possibleCards: Card[] = [];
                const fromPlayer: number[] = [];
                // go through the hands that "this card" is allowed in
                handsThatAllowSuit[thisCard.suit].forEach((allowed, player) => {
                    if (allowed) {
                        // go through the cards in this hand
                        speculatedHands[player].forEach((card) => {
                            // can this card go in a non-full hand?
                            if (suitsAllowedInNonFull[card.suit]) {
                                possibleCards.push(card);
                                fromPlayer.push(player);
                            }
                        });
                    }
                });

                if (possibleCards.length) {
                    // do the swap
                    const indexToSwap = Math.floor(Math.random() * possibleCards.length);
                    /** intersection of non_full and allow swap suit */
                    const allowSSANF: number[] = [];
                    handsThatAllowSuit[possibleCards[indexToSwap].suit].forEach((allowed, player) => {
                        if (allowed && nonFullHands(player)) {
                            allowSSANF.push(player);
                        }
                    });
                    
                    // assert allowSSANF size > 0  // TODO: remove (or set up debugging)
                    if (allowSSANF.length === 0) {
                        console.log("ERROR: assertion fail, single swap, no place to put swap card");
                    }

                    const receiver = allowSSANF[Math.floor(Math.random() * allowSSANF.length)];
                    speculatedHands[receiver].insert(possibleCards[indexToSwap]);
                    speculatedHands[fromPlayer[indexToSwap]].remove(possibleCards[indexToSwap]);
                    // and this card in the space that was made for it
                    speculatedHands[fromPlayer[indexToSwap]].insert(thisCard);
                    // only the size of the non-full hand changed
                    --spaceRemainingIn[receiver];
                }
                else {  // no single swap possible, double swap is needed
                    // assert: double swap is possible
                    /* questionable assertion:
                        There is a 3rd hand that is not involved in the previously used hands in this algorithm.
                        One hand is full and is the only one that allows *this_card_itr
                        A second hand is the only one not full and doesn't allow this card or any card in the first hand.
                        The 3rd hand is full and must allow some suit that is in the first hand
                                             and must have some suit that is allowed in the second hand. */

                    const fullAndAllows = handsThatAllowSuit[thisCard.suit].indexOf(true);  // "1st hand"
                    let nonFull;  // "2nd hand"
                    for (let player = 0; player < 4; ++player) {
                        if (nonFullHands(player)) {
                            nonFull = player;
                            break;
                        }
                    }
                    let thirdHand = 0;
                    while ((thirdHand === fullAndAllows) ||
                           (thirdHand === this.whoAmI) ||
                           (thirdHand === nonFull)) {
                        ++thirdHand;
                    }

                    // debugging assertions  // TODO: remove
                    if (handsThatAllowSuit[thisCard.suit].length !== 1) {
                        console.log("ERROR: big assertion was wrong, hands that allow this suit != 1");  // !
                    }
                    // also, number of non full hands was 1

                    // go through third hand and find cards allowed in non-full hand
                    const secondSwapPossibilities: Card[] = [];
                    speculatedHands[thirdHand].forEach((card) => {
                        if (suitsAllowedInNonFull[card.suit]) {
                            secondSwapPossibilities.push(card);
                        }
                    });

                    // another of the debugging assertions  // TODO: remove
                    if (secondSwapPossibilities.length === 0) {
                        console.log("ERROR: big assertion was wrong, no cards to move from 3rd to 2nd");
                    }

                    // move one of those cards to the non-full hand
                    const secondSwap = secondSwapPossibilities[Math.floor(Math.random() *
                                                                          secondSwapPossibilities.length)];
                    speculatedHands[nonFull].insert(secondSwap);
                    speculatedHands[thirdHand].remove(secondSwap);
                    --spaceRemainingIn[nonFull];

                    // find cards that can be moved from first hand to third hand
                    // possibleCards is already declared from way before and is empty
                    speculatedHands[fullAndAllows].forEach((card) => {
                        if (! (this.playerSeenVoidInSuits[thirdHand][card.suit])) {
                            possibleCards.push(card);
                        }
                    });

                    // another of the debugging assertions  // TODO: remove
                    if (possibleCards.length === 0) {
                        console.log("ERROR: big assertion was wrong, no cards to move from 1st to 3rd");
                    }

                    // move one of those cards to the third hand
                    const firstLevelSwap = possibleCards[Math.floor(Math.random() *
                                                              possibleCards.length)];
                    speculatedHands[thirdHand].insert(firstLevelSwap);
                    speculatedHands[fullAndAllows].remove(firstLevelSwap);
                    // so now it's not full and has space for this card
                    // (it will be full right after inserting this card, so don't change space remaining)

                    // Now, finally, we can get rid of this card
                    speculatedHands[fullAndAllows].insert(thisCard);
                }  // done with double swap
            }  // done with any swapping
        });  // next card

        // put in the cards that I already knew
        this.gameHand.getHand(this.whoAmI).forEach((card) => {
            speculatedHands[this.whoAmI].insert(card);
        });
        this.cardsIPassed.forEach((card) => {
            speculatedHands[whomIPassedTo].insert(card);
        });

        return speculatedHands;
    }

    constructor(gameHand: GameHand, whoAmI: number) {
        this.gameHand = gameHand;
        this.whoAmI = whoAmI;
    }

    public resetHand() {
        this.unknownCards.fill();
        this.cardsIPassed.length = 0;
        this.playerSeenVoidInSuits = [
            [false, false, false, false],
            [false, false, false, false],
            [false, false, false, false],
            [false, false, false, false]
        ];
        this.shootMoonPossible = true;
    }

    public dealHands() {
        this.gameHand.getHand(this.whoAmI).forEach((card) => {
            this.unknownCards.remove(card);
        });
    }

    public pass(fromPlayer: number, toPlayer: number, cards: Card[]) {
        if (fromPlayer === this.whoAmI) {
            this.cardsIPassed = cards.slice();
        }
    }

    public receivePassedCards() {
        this.gameHand.getHand(this.whoAmI).forEach((card) => {
            this.unknownCards.remove(card);
        });
    }

    public resetTrick() {
        this.pointsPlayedThisTrick = false;
    }

    public seeCardPlayed(card: Card, byPlayer: number, showingOnlyHearts: boolean = false) {
        if (this.gameHand.pointsFor(card)) {
            this.pointsPlayedThisTrick = true;
        }
        this.unknownCards.remove(card);

        // remove from passed cards
        let indexInPassed = -1;
        this.cardsIPassed.forEach((passedCard, index) => {
            if (card.value === passedCard.value && card.suit === passedCard.suit) {
                indexInPassed = index;
            }
        });
        if (indexInPassed !== -1) {
            this.cardsIPassed.splice(indexInPassed, 1);
        }

        // is player showing they have none of a suit?
        const leadSuit = this.gameHand.getPlayedCards()[this.gameHand.getTrickLeader()].suit
        if (card.suit !== leadSuit) {
            this.playerSeenVoidInSuits[byPlayer][leadSuit] = true;
        }

        // showing that they only have hearts?
        if (showingOnlyHearts) {
            this.playerSeenVoidInSuits[byPlayer][Card.CLUBS] = true;
            this.playerSeenVoidInSuits[byPlayer][Card.DIAMONDS] = true;
            this.playerSeenVoidInSuits[byPlayer][Card.SPADES] = true;
        }

        // see if it's still possible to shoot the moon
        if (this.shootMoonPossible) {
            if (this.pointsPlayedThisTrick) {
                let nonZeroScore = -1;
                for (let player = 0; player < 4; ++player) {
                    if (this.gameHand.getScore(player)) {
                        nonZeroScore = player;
                        break;
                    }
                }

                if (nonZeroScore !== -1) {
                    // see whether this player has played yet this trick
                    let thisPlayerPLayed = false;
                    let goingThroughTurns = (this.gameHand.getWhoseTurn() + 5 - this.gameHand.getPlayedCardCount()) % 4;  // first turn this trick
                    for (let turn = this.gameHand.getPlayedCardCount(); turn > 0; --turn) {
                        if (goingThroughTurns === nonZeroScore) {
                            thisPlayerPLayed = true;
                            break;
                        }
                        goingThroughTurns = (goingThroughTurns + 1) % 4;
                    }

                    if (thisPlayerPLayed) {
                        if (nonZeroScore !== this.gameHand.getTrickLeader()) {
                            this.shootMoonPossible = false;
                        }

                        // for testing
                        console.log("this is the point when it becomes impossible for anyone to shoot the moon");
                    }
                }
            }
        }
    }
}

export default AI;
