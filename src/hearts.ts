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
    console.log("browserZoomLevel: " + window.devicePixelRatio);

    canvas.width = window.innerWidth;
    // I've looked at a lot of google search results and still can't find a good solution to this problem
    // (how to get the height without the address bar on mobile)
    // window.screen.availHeight - 20 (20 for android status bar) works on android but messes it up on windows
    canvas.height = Math.max(window.innerHeight, document.documentElement.clientHeight /*, window.screen.availHeight - 20*/);

    gui.resize(Math.min(window.devicePixelRatio, 2));  // cards don't fit on the screen if zoom past 200%

    gui.draw();
}
// nwindow.onload = resizeCanvas;

function click(e: MouseEvent) {
    gui.click(e);
}

async function installServiceWorkerAsync() {
    if ('serviceWorker' in navigator) {
        try {
            let serviceWorker = await navigator.serviceWorker.register('/sw.js')
            console.log(`Service worker registered ${serviceWorker}`)
        } catch (err) {
            console.error(`Failed to register service worker: ${err}`)
        }
    }
}

window.onload = function() {
    resizeCanvas();
    installServiceWorkerAsync();
};
