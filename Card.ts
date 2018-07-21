class Card {
    public static CLUBS = 0;
    public static DIAMONDS = 1;
    public static SPADES = 2;
    public static HEARTS = 3;
    public static SUIT_COUNT = 4;

    /**
     * binary search a sorted Card array for a card,
     * return index, -1 if not found
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

    public str() {
        let to_return: string;
        switch (this.value)
        {
        case 1:
        case 14:
            to_return = "Ace of ";
            break;
        case 11:
            to_return = "Jack of ";
            break;
        case 12:
            to_return = "Queen of ";
            break;
        case 13:
            to_return = "King of ";
            break;
        default:
            to_return = this.value.toString();
            to_return += " of ";
        }

        switch (this.suit)
        {
        case Card.CLUBS:
            to_return += "Clubs";
            break;
        case Card.DIAMONDS:
            to_return += "Diamonds";
            break;
        case Card.SPADES:
            to_return += "Spades";
            break;
        case Card.HEARTS:
            to_return += "Hearts";
            break;
        default:
            to_return += "UNKNOWN SUIT";
        }

        return to_return;
    }
}

export default Card;
