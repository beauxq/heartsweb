import Card from "./Card";

interface HandObserver {
    resetHand();
    dealHands();
    pass(fromPlayer: number, toPlayer: number, cards: Card[]);
    receivePassedCards();
    resetTrick();
    seeCardPlayed(card: Card, byPlayer: number, showingOnlyHearts: boolean);
}

export default HandObserver;
