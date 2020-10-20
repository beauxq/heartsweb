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
    public static find(sortedArray: Card[], card: Card): number {
        let beginIndex = 0;
        let endIndexPlus1 = sortedArray.length;
        let looking = endIndexPlus1 >> 1;  // middle
        while (looking < endIndexPlus1) {
            if (sortedArray[looking].value === card.value) {
                return looking;
            }
            if (sortedArray[looking].value > card.value) {
                endIndexPlus1 = looking;
            }
            else {
                beginIndex = looking + 1;
            }
            looking = (beginIndex + endIndexPlus1) >> 1;  // new middle
        }
        return -1;
    }

    public value: number;
    public suit: number;

    constructor(card: Card);
    constructor(value: number, suit: number);
    constructor(value: number|Card, suit?: number) {
        if (value.hasOwnProperty("suit")) {
            // copy constructor
            const card = value as Card;
            this.value = card.value;
            this.suit = card.suit;
        }
        else {
            this.value = value as number;
            this.suit = suit as number;
        }
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

    public hash() {
        return (this.value << 2) + this.suit;
    }
}

export default Card;
