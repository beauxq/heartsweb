import AI from "./AI";

// when I follow examples for web workers online, typescript complains
// so I found this solution:
// https://stackoverflow.com/questions/50402004/error-ts2554-expected-2-3-arguments-but-got-1
const ctx: Worker = self as any;

ctx.addEventListener('message', (message) => {
    console.log('in webworker', message);
    if (message.data.length) {
        // AI array
        const ai1 = new AI(message.data[1]);
        const ai2 = new AI(message.data[2]);
        const ai3 = new AI(message.data[3]);
        // console.log(ai1.staticPlayAI());

        ai1.observeSelf();
        ai2.observeSelf();
        ai3.observeSelf();

        const ai1Cards = ai1.choosePassingCards();
        const ai2Cards = ai2.choosePassingCards();
        const ai3Cards = ai3.choosePassingCards();

        ctx.postMessage([null, ai1Cards, ai2Cards, ai3Cards]);
    }
    else {
        // single AI
        // pick a card to play
        const ai = new AI(message.data);
        ai.observeSelf();

        // TODO: AI
        ctx.postMessage(ai.staticPlayAI());
    }
});
