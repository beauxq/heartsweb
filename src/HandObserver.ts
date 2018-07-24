import Card from "./Card";

interface HandObserver {
    resetHand(): void;
    dealHands(): void;
    pass(fromPlayer: number, toPlayer: number, cards: Card[]): void;
    receivePassedCards(): void;
    resetTrick(): void;
    seeCardPlayed(card: Card, byPlayer: number, showingOnlyHearts: boolean): void;
}

export default HandObserver;
