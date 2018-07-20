class Gui {
    private context: CanvasRenderingContext2D;
    private assets: HTMLElement;

    constructor(context: CanvasRenderingContext2D, assets: HTMLElement) {
        this.context = context;
        this.assets = assets;
    }

    draw() {
        console.log("gui draw here");
    }
}

export default Gui;
