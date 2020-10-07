import HandObserver from "./HandObserver";
import CardGroup from "./CardGroup";
import GameHand from "./GameHand";
import Card from "./Card";

class AI implements HandObserver {
    /** number of tricks to simulate */
    static LEVEL: number = 10000;

    private unknownCards: CardGroup = new CardGroup();
    private playerSeenVoidInSuits: boolean[][] = [];

    /** and not played yet, removed from here when they are seen played */
    private cardsIPassed: Card[] = [];
    private gameHand: GameHand;
    /** player index */
    private whoAmI: number;

    /** to be called in worker where observerList has been removed */
    public observeSelf() {
        this.gameHand.registerObserver(this);
        // TODO: find out if I need this... I don't think I do
    }

    public setHand(hand: GameHand) {
        this.gameHand = hand;
    }

    public choosePassingCards() {
        const t0 = performance.now();  // time test

        const hand = this.gameHand.getHand(this.whoAmI);
        const scoresForEachCombination: number[] = new Array(286).fill(0);
        const cardsForEachCombination: Card[][] = new Array(286).fill([]);

        let scoreIndex = 0;
        for (let i = 0; i < 11; ++i) {
            for (let j = i+1; j < 12; ++j) {
                for (let k = j+1; k < 13; ++k) {
                    const cards = [hand.at(i) as Card, hand.at(j) as Card, hand.at(k) as Card];
                    cardsForEachCombination[scoreIndex] = cards;

                    const loopCount = Math.floor(AI.LEVEL / (286 * 4)) + 1;

                    for (let simNum = loopCount; simNum > 0; --simNum) {
                        const sim = new GameHand(this.gameHand);
                        const simAIS = [
                            new AI(sim, 0),
                            new AI(sim, 1),
                            new AI(sim, 2),
                            new AI(sim, 3)
                        ];
                        sim.setHands(this.speculateHands(sim.getPassingDirection()));

                        // passing
                        for (let playerToPass = 0; playerToPass < 4; ++playerToPass) {
                            if (playerToPass === this.whoAmI) {
                                sim.pass(playerToPass, (playerToPass + this.gameHand.getPassingDirection()) % 4, cards);
                            }
                            else {  // not the player who is simulating
                                sim.pass(playerToPass,
                                         (playerToPass + this.gameHand.getPassingDirection()) % 4,
                                         sim.getHand(playerToPass).pickRandom(3));
                            }
                        }
                        sim.receivePassedCards();

                        // playing
                        for (let tricks = 13; tricks > 0; --tricks) {
                            sim.resetTrick();
                            while (sim.turnsLeftInTrick()) {
                                sim.playCard(simAIS[sim.getWhoseTurn()].simPlayCard());
                            }
                            sim.endTrick();
                        }
                        sim.endHand();
                        // done playing

                        scoresForEachCombination[scoreIndex] += sim.getScore(this.whoAmI);
                    }
                    
                    ++scoreIndex;
                }
            }
        }

        let bestIndex = 0;
        for (scoreIndex = 0; scoreIndex < 286; ++ scoreIndex) {
            if (scoresForEachCombination[scoreIndex] < scoresForEachCombination[bestIndex]) {
                bestIndex = scoreIndex;
            }
        }

        const t1 = performance.now();

        // for testing
        console.log("player " + this.whoAmI + " had:")
        hand.forEach((card) => {
            console.log(card.str());
        });
        console.log("and chose to pass:");
        console.log(cardsForEachCombination[bestIndex]);
        console.log("time: " + (t1-t0));

        return cardsForEachCombination[bestIndex];
    }

    private speculateHands(passingDirection: number): CardGroup[] {
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

        function nonFullHands(player: number) { return spaceRemainingIn[player] > 0 };

        // testing nonFullHands
        // console.log("nonFullHands:");
        // console.log(0, nonFullHands(0));
        // console.log(1, nonFullHands(1));
        // console.log(2, nonFullHands(2));
        // console.log(3, nonFullHands(3));

        /** first index is suit, second is player, excludes the player speculating */
        const handsThatAllowSuit: boolean[][] = [];
        for (let suit = 0; suit < 4; ++suit) {
            handsThatAllowSuit.push([
                (! (this.playerSeenVoidInSuits[0][suit])) && this.whoAmI !== 0,
                (! (this.playerSeenVoidInSuits[1][suit])) && this.whoAmI !== 1,
                (! (this.playerSeenVoidInSuits[2][suit])) && this.whoAmI !== 2,
                (! (this.playerSeenVoidInSuits[3][suit])) && this.whoAmI !== 3
            ]);
        }
        // console.log("handsThatAllowSuit:");
        // console.log(handsThatAllowSuit);

        // console.log("unknown length", this.unknownCards.length());
        // this.unknownCards.forEach((card) => { console.log(card.str()); });

        const allowSuitAndNonFull: number[] = [];  // intersection of non-full-hands with hands that allow this suit
        this.unknownCards.forEach((thisCard) => {
            // console.log("trying to find a place for ", thisCard.str());
            allowSuitAndNonFull.length = 0;
            handsThatAllowSuit[thisCard.suit].forEach((allowThisSuit, player) => {
                if (allowThisSuit && nonFullHands(player)) {
                    allowSuitAndNonFull.push(player);
                    // console.log("allowSuitAndNonFull:", allowSuitAndNonFull);
                }
            });

            if (allowSuitAndNonFull.length) {
                const receiver = allowSuitAndNonFull[Math.floor(Math.random() * allowSuitAndNonFull.length)];
                speculatedHands[receiver].insert(thisCard);
                -- spaceRemainingIn[receiver];
            }
            else {  // there are no hands left that allow this suit and have space for this card
                // console.log("couldn't find a place for it in one step (0 swaps)");
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
                        One hand is full and is the only one that allows  thisCard
                        A second hand is the only one not full and doesn't allow thisCard or any card in the first hand.
                        The 3rd hand is full and must allow some suit that is in the first hand
                                             and must have some suit that is allowed in the second hand. */

                    const fullAndAllows = handsThatAllowSuit[thisCard.suit].indexOf(true);  // "1st hand"
                    let nonFull: number = 0;  // "2nd hand"
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
                    if (handsThatAllowSuit[thisCard.suit].filter(x => x).length !== 1) {  // count 'true'
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

    constructor(gameHand: GameHand, whoAmI: number);
    constructor(ai: AI);
    constructor(gameHand: GameHand|AI, whoAmI?: number) {
        if (gameHand.hasOwnProperty("whoAmI")) {
            // copy constructor
            const ai = gameHand as AI;
            this.unknownCards = new CardGroup(ai.unknownCards);
            this.playerSeenVoidInSuits = ai.playerSeenVoidInSuits;
            this.cardsIPassed = [];
            ai.cardsIPassed.forEach((card) => {
                this.cardsIPassed.push(new Card(card));
            });
            this.gameHand = new GameHand(ai.gameHand);
            this.whoAmI = ai.whoAmI;
        }
        else {
            this.gameHand = gameHand as GameHand;
            this.whoAmI = whoAmI as number;
            this.resetHand();  // just to be safe
        }
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
    }

    public dealHands() {
        console.log("seeing my dealt hand:", this.whoAmI);
        this.gameHand.getHand(this.whoAmI).forEach((card) => {
            this.unknownCards.remove(card);
            console.log(card.str());
        });
    }

    public pass(fromPlayer: number, _toPlayer: number, cards: Card[]) {
        if (fromPlayer === this.whoAmI) {
            this.cardsIPassed = cards.slice();
        }
    }

    public receivePassedCards() {
        console.log("seeing my cards after passing", this.whoAmI);
        this.gameHand.getHand(this.whoAmI).forEach((card) => {
            this.unknownCards.remove(card);
            console.log(card.str());
        });
    }

    public resetTrick() {
    }

    public seeCardPlayed(card: Card, byPlayer: number, showingOnlyHearts: boolean = false) {
        // console.log("seeing a card played", this.whoAmI);
        // console.log(card.str());
        // console.log("see card unknown length before:", this.unknownCards.length());
        this.unknownCards.remove(card);
        // console.log("just removed because saw it played");
        // console.log("see card unknown length after:", this.unknownCards.length());

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
    }

    public staticPlayAI(): Card {
        const validChoices = this.gameHand.findValidChoices();

        if (this.gameHand.getPlayedCardCount() > 0) {  // I'm not leading the trick
            const leadCard = this.gameHand.getPlayedCards()[this.gameHand.getTrickLeader()];
            if (validChoices[0].suit === leadCard.suit) {  // I have to follow suit
                if (validChoices[0].value < leadCard.value) {  // I can play under, avoid taking it
                    // find highest card I can avoid taking it with
                    for (let i = validChoices.length - 1; i >= 0; --i) {
                        if (validChoices[i].value < leadCard.value) {  // this is highest card I can avoid taking it with
                            // Q of Spades instead of K of Spades
                            if (validChoices[i].value === 13 &&  // king
                                validChoices[i].suit === Card.SPADES &&  // of spades
                                i > 0 &&  // I have a lower spade
                                validChoices[i-1].value === 12  // and it's the queen
                            ) {
                                return validChoices[i-1];
                            }
                            else {  // not k and q of spades
                                return validChoices[i];  // highest card I can avoid taking it with
                            }
                        }
                    }
                    console.log("ERROR: should never get here");
                    return validChoices[0];  // just so compiler doesn't complain about not returning a card
                }
                else {  // I can't play under
                    if (this.gameHand.getPlayedCardCount() < 3) {  // someone else will play after me
                        if (leadCard.suit === Card.SPADES) {  // spades
                            if (validChoices[0].value === 12 &&  // queen
                                validChoices.length > 1) {  // and I have somethign else
                                return validChoices[1];
                            }
                            else {  // not queen or I don't have anything else
                                return validChoices[0];
                            }
                        }
                        else {  // not spades
                            return validChoices[0];
                        }
                    }
                    else {  // no one else plays after me
                        const highestCard = validChoices[validChoices.length -1];
                        if (leadCard.suit === Card.SPADES) {  // spades
                            if (highestCard.value === 12 &&  // queen
                                validChoices.length > 1  // and I have something else
                            ) {
                                return validChoices[validChoices.length - 2];  // highest except queen
                            }
                            else {  // not queen or I don't have anything else
                                return highestCard;
                            }
                        }
                        else {  // not spades
                            return highestCard;
                        }
                    }
                }
            }
            else {  // don't have to follow suit (and not leading)
                // GET RID OF THE QUEEN!!
                // (play lowest of high spades)
                const highSpades: Card[] = [];  // ordered from highest to lowest
                for (let i = validChoices.length - 1; i >= 0; --i) {
                    if (validChoices[i].suit !== Card.SPADES) {
                        continue;
                    }
                    if (validChoices[i].value > 11) {  // higher than jack
                        highSpades.push(validChoices[i]);
                    }
                    else {  // spade, lower than queen
                        break;
                    }
                }
                if (highSpades.length) {  // I have high spades
                    return highSpades[highSpades.length - 1];  // play lowest high spade
                }
                else {  // I don't have any high spades
                    // play the highest card in the suit of the highest lowest card of its suit
                    // (yes, you understood that)
                    // algorithm:
                    // look at the lowest card in each suit
                    // which one of those is the highest?
                    // what's the suit of that card?
                    // play the highest card in that suit

                    let currentSuit = validChoices[0].suit;
                    /** suit of the highest lowest card of its suit */
                    let sothlcois = currentSuit;
                    let lowestValue = validChoices[0].value;  // in that suit

                    for (let i = 1; i < validChoices.length; ++i) {
                        if (validChoices[i].suit !== currentSuit) {  // moved into new suit
                            currentSuit = validChoices[i].suit;

                            if (validChoices[i].value // lowest value in this suit
                                > lowestValue  // found one higher
                            ) {
                                sothlcois = currentSuit;
                                lowestValue = validChoices[i].value;
                            }
                        }
                    }
                    // now we know the suit of the highest lowest card of its suit
                    // since we don't have any high spades, any card of this suit should be a valid choice
                    // so we can pull it out of the hand (instead of the valid_choices)
                    const cardsInSuit = this.gameHand.getHand(this.gameHand.getWhoseTurn()).getSuit(sothlcois);
                    return cardsInSuit[cardsInSuit.length - 1];
                }
            }
        }
        else {  // I lead
            const nonHighSpades = validChoices.filter((card) => {
                return (card.value < 12 || card.suit !== Card.SPADES);
            });
            if (nonHighSpades.length) {
                // found something that's not high spade
                // random (without high spades)
                return nonHighSpades[Math.floor(Math.random() * nonHighSpades.length)];
            }
            // else only high spades available
            return validChoices[0];  // play lowest high spade
        }
/*
            let foundNonHighSpade = false;
            for (let i = 0; i < validChoices.length; --i) {
                if (validChoices[i].value < 12 || validChoices[i].suit !== Card.SPADES) {
                    // found something that's not high spade
                    foundNonHighSpade = true;
                    break;
                }
            }
            if (! foundNonHighSpade) {  // only high spades available
                return validChoices[0];  // play lowest high spade
            }
            // random, but not high spade
            let lengthWOHighSpades = validChoices.length;
            let randomIndex;
            while (true) {
                randomIndex = Math.floor(Math.random() * lengthWOHighSpades);
                if (validChoices[randomIndex].value > 11 && validChoices[randomIndex].suit === Card.SPADES) {  // high spade
                    // swap high spade into last spot
                    // I stopped here and decided to use filter instead
                }
            }
        }
        */
    }

    private simPlayCard(): Card {
        // TODO: I don't know a good way to tune these numbers
        // if shooting the moon is possible, higher probability of playing a random card
        /** out of 10 */
        const randomIfLessThan = this.gameHand.getShootMoonPossible() ? 5 : 2;

        if (Math.random() * 10 < randomIfLessThan) {
            const vc = this.gameHand.findValidChoices();
            return vc[Math.floor(Math.random() * vc.length)];
        }
        else {
            return this.staticPlayAI();
        }
    }

    public dynamicPlay(): Card {
        const validChoices = this.gameHand.findValidChoices();

        if (validChoices.length === 1) {
            return validChoices[0];
        }

        const scoreForEachVC: number[] = validChoices.map(() => { return 0; });
        // console.log("score array should be all 0s, one for each valid");
        // console.log(scoreForEachVC);
        const loopCount = Math.floor(
            (AI.LEVEL / validChoices.length) / this.gameHand.getHand(this.gameHand.getWhoseTurn()).length()
        ) + 1;

        for (let i = loopCount; i > 0; --i) {
            validChoices.forEach((card, index) => {
                const sim = new GameHand(this.gameHand);
                const simAI = new AI(sim, this.whoAmI);
                sim.setHands(this.speculateHands(sim.getPassingDirection()));

                // play the card we're checking now
                sim.playCard(card);

                do {
                    while (sim.turnsLeftInTrick()) {
                        sim.playCard(simAI.simPlayCard());
                    }
                    sim.endTrick();

                    if (sim.getHand(0).length()) {  // more tricks to play
                        sim.resetTrick();
                    }
                } while (sim.getHand(0).length());  // until there are no more tricks left to play
                sim.endHand();

                scoreForEachVC[index] += sim.getScore(this.whoAmI);
                // console.log("just added", sim.getScore(this.whoAmI), "now", scoreForEachVC[index]);
            });  // end valid choice loop
        }  // end loop according to AI.LEVEL

        // simple min function
        let indexOfMin = 0;
        console.log(validChoices[0].str(), scoreForEachVC[0] / loopCount);
        for (let i = 1; i < validChoices.length; ++i) {
            if (scoreForEachVC[i] < scoreForEachVC[indexOfMin]) {
                indexOfMin = i;
            }
            console.log(validChoices[i].str(), scoreForEachVC[i] / loopCount);
        }

        return validChoices[indexOfMin];
    }
}

export default AI;
