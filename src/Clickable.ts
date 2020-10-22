class Clickable {
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

export default Clickable;
