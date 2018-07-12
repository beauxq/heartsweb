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

    public forEach(callback: Function) {
        this.cards.forEach((suit) => {
            suit.forEach((card) => {callback(card)});
        });
    }

    public remove(card: Card) {
        const arrayToRemoveFrom = this.cards[card.suit];

        const index = Card.find(arrayToRemoveFrom, card);

        if (index === -1) {
            return;
        }

        arrayToRemoveFrom.splice(index, 1);
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
}

export default CardGroup;
