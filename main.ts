import GameHand from "./GameHand";

async function main() {

    const gh = new GameHand();

    gh.resetHand();
    gh.dealHands();
    console.log("hands dealt");
    gh.getHand(0).forEach((card) => { console.log(card.str()); });

}

main();
