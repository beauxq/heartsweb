import Gui from "./Gui" ;

var canvas = document.getElementById('c') as HTMLCanvasElement;
var assets = document.getElementById('a');

const gui = new Gui(canvas.getContext('2d') as CanvasRenderingContext2D,
                    assets as HTMLImageElement)

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);
canvas.addEventListener('click', click, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gui.resize();

    gui.draw();
}
window.onload = resizeCanvas;

function click(e: MouseEvent) {
    gui.click(e);
}
