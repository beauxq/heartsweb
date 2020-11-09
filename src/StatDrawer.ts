import MenuItemDrawer from "./MenuItemDrawer";
import { StatData } from "./Stats";
import { Clickable } from "./Clickable";
import { menuTextColor } from "./drawResources";
import { names } from "./resources";

class StatDrawer extends MenuItemDrawer {
    private columns: number[];

    constructor(context: CanvasRenderingContext2D,
                private readonly stats: StatData) {
        super(context);

        this.columns = [0, 0, 0, 0];
    }

    public resize(...args: number[]) {
        // @ts-expect-error
        super.resize(...args);

        this.columns = [this.menuWidth * 0.24, this.menuWidth * 0.43, this.menuWidth * 0.62, this.menuWidth * 0.81];
    }

    private draw4columns(label: string, leftX: number, y: number, entries: string[]) {
        this.context.fillText(label, leftX, y);
        for (let i = 0; i < 4; ++i) {
            this.context.fillText(entries[i], leftX + this.columns[i], y);
        }
    }

    public draw(_clickables: Clickable[]) {
        this.context.font = "15px Arial";
        const line = 17;
        this.context.textBaseline = "top";
        this.context.fillStyle = menuTextColor;
        const leftX = this.menuRightX - this.menuWidth;

        this.draw4columns("", leftX, this.menuTopY + line, names);

        const indexes = [0, 1, 2, 3];
        if (this.stats.gameCount) {
            this.context.fillText(`games: ${this.stats.gameCount}`,
                                leftX,
                                this.menuTopY + line * 2,
                                this.menuWidth);

            this.draw4columns("avg:", leftX, this.menuTopY + line * 3,
                              indexes.map((i) => `${(this.stats.scoreTotals[i]
                              / this.stats.gameCount).toFixed(0)}`));
            
            this.draw4columns("best:", leftX, this.menuTopY + line * 4,
                              indexes.map((i) => `${this.stats.bestScores[i]}`));

            this.draw4columns("worst:", leftX, this.menuTopY + line * 5,
                              indexes.map((i) => `${this.stats.worstScores[i]}`));

            // TODO: place counts
        }

        if (this.stats.handCount) {
            this.context.fillText(`hands: ${this.stats.handCount}`,
                                leftX,
                                this.menuTopY + line * 7,
                                this.menuWidth);
            
            this.draw4columns("avg:", leftX, this.menuTopY + line * 8,
                              indexes.map((i) => `${(this.stats.scoreTotals[i]
                              / this.stats.handCount).toFixed(0)}`));

            this.draw4columns("queen:", leftX, this.menuTopY + line * 9,
                              indexes.map((i) => `${(this.stats.queenCount[i] * 100
                              / this.stats.handCount).toFixed(0)}%`));

            this.draw4columns("moon:", leftX, this.menuTopY + line * 10,
                              indexes.map((i) => `${(this.stats.moonCount[i] * 100
                              / this.stats.handCount).toFixed(0)}%`));
        }
    }
}

export default StatDrawer;
