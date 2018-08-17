class Waiter {
    private waiting: boolean = false;
    private waitingTime: boolean = false;
    private clickSkips: boolean = true;
    private currentWait: any = null;
    private needMessage: boolean = false;
    private haveMessage: boolean = false;
    private messageData: any = undefined;
    private resolve: Function = () => {};

    /** returns whether this click canceled a wait */
    public click() : boolean {
        if (this.waitingTime && this.clickSkips) {
            clearTimeout(this.currentWait);
            this.waitingTime = false;
            this.checkFinish();
            return true;
        }
        return false;
    }

    /**
     * returns a promise resolved when were done waiting
     * @param seconds 
     * @param allowSkipWithClick clicking the mouse skips the time requirement
     * @param requireMessage gotMessage must be called for the promise to resolve
     */
    public wait(seconds: number, allowSkipWithClick: boolean, requireMessage: boolean) {
        this.waiting = true;
        this.waitingTime = true;
        this.clickSkips = allowSkipWithClick;
        this.needMessage = requireMessage;
        this.haveMessage = false;
        console.log("need in middle of wait:", this.needMessage);

        this.currentWait = setTimeout(() => {
            this.waitingTime = false;
            this.checkFinish();
        }, seconds * 1000);
        
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.checkFinish();
        });
    }

    public gotMessage(messageData: any) {
        console.log("waiter got message");
        if (this.needMessage) {
            console.log("waiter found needMessage true");
            this.haveMessage = true;
            this.messageData = messageData;
            this.checkFinish();
        }
    }

    private checkFinish() {
        console.log("checking for wait finish")
        if (this.waiting &&
            ((! this.waitingTime) && ((! this.needMessage) || this.haveMessage))
        ) {
            this.waiting = false;
            this.needMessage = false;
            this.haveMessage = false;
            this.resolve(this.messageData);
            this.messageData = undefined;
            this.resolve = () => {};
        }
    }
}

export default Waiter;
