import GameHand from "./GameHand";

class Game {
    static passingDirections: number[] = [1, 3, 2, 0];  // left, right, across, keep

    public hand: GameHand = new GameHand();
    public scores: number[] = [0, 0, 0, 0];
    public winners: number[] = [];  // empty if game is not finished
    private passingIndex: number = 0;

    public constructor();
    public constructor(game: Game);
    public constructor(game?: Game|undefined) {
        if (game) {
            // copy constructor
            this.hand = new GameHand(game.hand);
            this.scores = game.scores;
            this.winners = game.winners;
            this.passingIndex = game.passingIndex;
        }
    }

    public reset() {
        this.winners.length = 0;
        this.passingIndex = 0;
        this.scores[0] = 0;
        this.scores[1] = 0;
        this.scores[2] = 0;
        this.scores[3] = 0;
    }

    public endHand() {
        let gameOver = false;
        for (let player = 0; player < 4; ++player) {
            this.scores[player] += this.hand.getScore(player);
            if (this.scores[player] > 99) {
                gameOver = true;
            }
        }
        if (gameOver) {
            this.winners.push(0);
            for (let player = 1; player < 4; ++player) {
                if (this.scores[player] < this.scores[this.winners[0]]) {  // better
                    this.winners.length = 0;
                    this.winners.push(player);
                }
                else if (this.scores[player] === this.scores[this.winners[0]]) {  // tie
                    this.winners.push(player);
                }
            }
        }
        else {
            this.changePassing();
        }
    }

    public changePassing() {
        this.passingIndex = (this.passingIndex + 1) % 4;
    }

    public getPassingDirection() {
        return Game.passingDirections[this.passingIndex];
    }
}

export default Game;
