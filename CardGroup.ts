import Card from './Card';

class CardGroup {
    private cards: Card[][] = [
        [], [], [], []  // one for each suit
    ];

    /**
     * the number of cards in given suit
     *  - if no suit given, the number of cards in all suits
     * @param suit 
     */
    public length(suit = -1) {
        if (suit === -1) {
            return this.cards[0].length + this.cards[1].length + this.cards[2].length + this.cards[3].length;
        }
        return this.cards[suit].length;
    }

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

    public remove(cardOrIndex: Card|number) {
        let indexInSuitArray: number, arrayToRemoveFrom: Card[];

        if (cardOrIndex instanceof Card) {
            arrayToRemoveFrom = this.cards[cardOrIndex.suit];

            indexInSuitArray = Card.find(arrayToRemoveFrom, cardOrIndex);

            if (indexInSuitArray === -1) {
                return;
            }
        }
        else {  // cardOrIndex is index
            const suitAndIndex = this.getSuitAndIndex(cardOrIndex);
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

    public clear() {
        this.cards.forEach((suitArray) => {
            suitArray.length = 0;
        });
    }

    /**
     * fill with 52 cards
     */
    public fill() {
        this.cards.forEach((suitArray, suitNumber) => {
            suitArray.length = 0;
            for (let i = 2; i < 15; ++i) {
                suitArray.push(new Card(i, suitNumber));
            }
        });
    }

    public dealOne(): Card {
        const index = Math.floor(Math.random() * this.length());
        const toReturn = this.at(index);
        this.remove(index);
        // @ts-ignore trust me, it will not be null
        return toReturn;
    }

    public getSuit(suit: number) {
        return this.cards[suit];
    }

    public slice(): Card[] {
        return this.cards[0].concat(this.cards[1], this.cards[2], this.cards[3]);
    }
}

export default CardGroup;
