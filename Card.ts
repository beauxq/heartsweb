class Card {
    public static CLUBS = 0;
    public static DIAMONDS = 1;
    public static SPADES = 2;
    public static HEARTS = 3;
    public static SUIT_COUNT = 4;

    /**
     * binary search a sorted Card array for a card
     * @param sortedArray 
     * @param card 
     * @param beginIndex 
     * @param endIndexPlus1 
     */
    public static find(sortedArray: Card[], card: Card, beginIndex=0, endIndexPlus1=sortedArray.length): number {
        const looking = Math.floor((beginIndex + endIndexPlus1) / 2);
        if (looking >= endIndexPlus1) {
            return -1;
        }
        if (sortedArray[looking].value === card.value) {
            return looking;
        }
        if (sortedArray[looking].value > card.value) {
            return Card.find(sortedArray, card, beginIndex, looking);
        }
        // else looking < card
        return Card.find(sortedArray, card, looking + 1, endIndexPlus1);
    }

    public value: number;
    public suit: number;

    constructor(value: number, suit: number) {
        this.value = value;
        this.suit = suit;
    }
}

export default Card;
