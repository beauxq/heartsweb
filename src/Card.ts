const valueToCode: ReadonlyMap<number, string> = new Map([
    [2, "2"],
    [3, "3"],
    [4, "4"],
    [5, "5"],
    [6, "6"],
    [7, "7"],
    [8, "8"],
    [9, "9"],
    [10, "0"],
    [11, "j"],
    [12, "q"],
    [13, "k"],
    [14, "a"],
    [0, ""]
]);

const suitToCode: ReadonlyMap<number, string> = new Map([
    [0, "c"],
    [1, "d"],
    [2, "s"],
    [3, "h"]
]);

class Card {
    public static readonly CLUBS = 0;
    public static readonly DIAMONDS = 1;
    public static readonly SPADES = 2;
    public static readonly HEARTS = 3;
    public static readonly SUIT_COUNT = 4;

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

    public readonly value: number;
    public readonly suit: number;

    /** copy constructor */
    constructor(card: Card);
    /** construct a card from value and suit */
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

    public str(): string {
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

    public hash(): number {
        return (this.value << 2) + this.suit;
    }

    public code(): string {
        const v = valueToCode.get(this.value);
        const s = suitToCode.get(this.suit);
        if (! (v && s)) {
            console.error("ERROR: failed to get a code from card", this);
            return "";
        }
        return v + s;
    }
}

export default Card;
