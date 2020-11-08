/** can check to see if coordinates are here
 *  and run an onClick function
 */
export interface Clickable {
    readonly onClick: Function;
    contains(x: number, y:number): boolean;
}

/** a rectangle location and size,
 *  and a function for what to do when the user clicks there
 */
export class RectClickable implements Clickable {
    public readonly x: number;
    public readonly y: number;
    public readonly w: number;
    public readonly h: number;
    public readonly onClick: Function;

    constructor(x: number, y: number, w: number, h: number, onClick: Function) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.onClick = onClick;
    }

    public contains(x: number, y:number): boolean {
        return (x >= this.x && y >= this.y && x < this.x + this.w && y < this.y + this.h);
    }
}

/** a circle location and size,
 *  and a function for what to do when the user clicks there
 */
export class CircleClickable implements Clickable {
    public readonly x: number;
    public readonly y: number;
    public readonly r: number;
    public readonly onClick: Function;

    constructor(x: number, y: number, r: number, onClick: Function) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.onClick = onClick;
    }

    public contains(x: number, y:number): boolean {
        const r2 = Math.pow(this.r, 2);
        const d2 = Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2);

        return d2 <= r2;
    }
}
