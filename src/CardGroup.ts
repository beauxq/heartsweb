import Card from './Card';

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/** Card container
 * 
 *  maintains cards in order by suit and then by value
 */
class CardGroup {
    private cards: Card[][] = [
        [], [], [], []  // one for each suit
    ];

    /** construct an empty CardGroup */
    constructor();
    /** copy constructor */
    constructor(cardGroup: CardGroup);
    constructor(cardGroup?: CardGroup) {
        if (cardGroup) {
            // copy constructor
            cardGroup.cards.forEach((suitArray, suitIndex) => {
                suitArray.forEach((card) => {
                    this.cards[suitIndex].push(new Card(card));
                });
            });
        }
    }

    /**
     * the number of cards in given suit
     *  - if no suit given, the number of cards in the CardGroup
     * @param suit 
     */
    public length(suit = -1) {
        if (suit === -1) {
            return this.cards[0].length + this.cards[1].length + this.cards[2].length + this.cards[3].length;
        }
        return this.cards[suit].length;
    }

    /** convert fullIndex, which is the index to the CardGroup,
     *  to a suit and index within that suit
     */
    private getSuitAndIndex(fullIndex: number) {
        let suit = 0;
        while (suit < 4 && fullIndex >= this.cards[suit].length) {
            fullIndex -= this.cards[suit].length;
            suit += 1;
        }
        if (suit < 4) {
            return {
                suit: suit,
                index: fullIndex
            };
        }
        return null;

    }

    public at(index: number): Card|null {
        const suitAndIndex = this.getSuitAndIndex(index);
        if (suitAndIndex)
            return this.cards[suitAndIndex.suit][suitAndIndex.index];
        return null;
    }

    public forEach(callback: (card: Card, index: number) => void) {
        let index = 0;
        this.cards.forEach((suit) => {
            suit.forEach((card) => {
                callback(card, index);
                ++index;
            });
        });
    }

    /**
     * returns index, -1 if not present
     * @param card 
     */
    public find(card: Card): number {
        let indexToReturn = Card.find(this.cards[card.suit], card);
        if (indexToReturn === -1) {
            return -1;
        }
        for (let suit = 0; suit < card.suit; ++suit) {
            indexToReturn += this.cards[suit].length;
        }
        return indexToReturn;
    }

    public remove(index: number): void;
    public remove(card: Card): void;
    public remove(cardOrIndex: Card|number) {
        let indexInSuitArray: number, arrayToRemoveFrom: Card[];

        if (cardOrIndex.hasOwnProperty("suit")) {
            const card = cardOrIndex as Card;
            arrayToRemoveFrom = this.cards[card.suit];

            indexInSuitArray = Card.find(arrayToRemoveFrom, card);

            if (indexInSuitArray === -1) {
                return;
            }
        }
        else {  // cardOrIndex is index
            const suitAndIndex = this.getSuitAndIndex(cardOrIndex as number);
            if (! suitAndIndex) {
                return;
            }

            arrayToRemoveFrom = this.cards[suitAndIndex.suit];
            indexInSuitArray = suitAndIndex.index;
        }

        arrayToRemoveFrom.splice(indexInSuitArray, 1);
    }

    public insert(card: Card) {
        const arrayToInsertTo = this.cards[card.suit];

        let i = 0;
        for ( ; i < arrayToInsertTo.length; ++i) {
            if (arrayToInsertTo[i].value > card.value) {
                break;
            }
        }

        arrayToInsertTo.splice(i, 0, card);
    }

    /** removes all the cards from this CardGroup */
    public clear() {
        this.cards.forEach((suitArray) => {
            suitArray.length = 0;
        });
    }

    /**
     * fill with 52 cards
     *  - ace is high
     */
    public fill() {
        this.cards.forEach((suitArray, suitNumber) => {
            suitArray.length = 0;
            for (let i = 2; i < 15; ++i) {
                suitArray.push(new Card(i, suitNumber));
            }
        });
    }

    /** choose a random Card out of the CardGroup,
     *  remove it, and return it
     */
    public dealOne(): Card {
        const index = Math.floor(Math.random() * this.length());
        const toReturn = this.at(index);
        this.remove(index);
        // @ts-ignore trust me, it will not be null
        return toReturn;
    }

    /** from hand of 13 cards
     *
     *  precondition: `length() === 13`
     */
    public pickRandom(n: number): Card[] {
        const toReturn: Card[] = [];
        const indexes: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        shuffleArray(indexes);
        for (let i = 0; i < n; ++i) {
            toReturn.push(this.at(indexes[i]) as Card);
        }
        return toReturn;
    }

    /** returns a reference to an array of the cards in one suit
     */
    public getSuit(suit: number): readonly Card[] {
        return this.cards[suit];
    }

    /** returns an array with all the cards in this CardGroup */
    public slice(): Card[] {
        return this.cards[0].concat(this.cards[1], this.cards[2], this.cards[3]);
    }
}

export default CardGroup;
