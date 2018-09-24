import Gui from "./Gui" ;

var canvas = document.getElementById('c') as HTMLCanvasElement;
var assets = document.getElementById('a');
var storage = window.localStorage;

const gui = new Gui(canvas.getContext('2d') as CanvasRenderingContext2D,
                    assets as HTMLImageElement,
                    storage);

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);
canvas.addEventListener('click', click, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    // I've looked at a lot of google search results and still can't find a good solution to this problem
    // (how to get the height without the address bar on mobile)
    // window.screen.availHeight - 20 (20 for android status bar) works on android but messes it up on windows
    canvas.height = Math.max(window.innerHeight, document.documentElement.clientHeight /*, window.screen.availHeight - 20*/);

    gui.resize();

    gui.draw();
}
window.onload = resizeCanvas;

function click(e: MouseEvent) {
    gui.click(e);
}
