import AI from "./AI";

addEventListener('message', (message) => {
    console.log('in webworker', message);
    if (message.data.length) {
        // AI array
        const ai1 = new AI(message.data[1]);
        console.log(ai1.staticPlayAI());
    }
    // postMessage('this is the response ', "");
});
