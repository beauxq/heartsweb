import readline from "readline-sync";
import GameHand from "./GameHand";
import AI from "./AI";
import Card from "./Card";

function showHandAndGetValid(gh: GameHand) {
    console.log("\n");
    gh.getHand(gh.getWhoseTurn()).forEach((card, index) => {
        process.stdout.write(card.str() + "  ");
    });
    const validChoices = gh.findValidChoices();
    console.log("\nvalid choices:")
    validChoices.forEach((card, index) => {
        console.log(index, card.str());
    });
    return validChoices;
}

async function main() {

    const gh = new GameHand();
    const ai1 = new AI(gh, 1);
    gh.registerObserver(ai1);
    const ai2 = new AI(gh, 2);
    gh.registerObserver(ai2);
    const ai3 = new AI(gh, 3);
    gh.registerObserver(ai3);
    const ais = [ai1, ai1, ai2, ai3];

    gh.resetHand(0);
    gh.dealHands();
    console.log("hands dealt");
    gh.setPassed();
    
    for (let trick = 13; trick > 0; --trick) {
        console.log("---------------------------------------------------\ntricks left:", trick);
        gh.resetTrick();
        for (let turn = 4; turn > 0; --turn) {
            console.log("turns left:", turn);
            const validChoices = showHandAndGetValid(gh);
            let answer = -1;
            let cardToPlay = new Card(0, 0);
            if (gh.getWhoseTurn() === 0) {  // human
                while (isNaN(answer) || answer < 0 || answer >= validChoices.length) {
                    const strAnswer = readline.question("pickone? ");
                    answer = Number.parseInt(strAnswer);
                }
                cardToPlay = validChoices[answer];
            }
            else {  // computer
                // answer = Math.floor(Math.random() * validChoices.length);
                cardToPlay = ais[gh.getWhoseTurn()].staticPlayAI();
            }
            console.log("\n*******************  -  playing", cardToPlay.str());
            gh.playCard(cardToPlay);
        }
        gh.endTrick();
    }

    gh.endHand();
}

main();
