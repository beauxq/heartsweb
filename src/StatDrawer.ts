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
        const lineSize = (this.menuHeight - 45) / 15;  // 15 lines, 40 for buttons + 5 padding
        this.context.font = `${Math.trunc(lineSize - 1)}px Arial`;
        this.context.textBaseline = "top";
        this.context.fillStyle = menuTextColor;
        const leftX = this.menuRightX - this.menuWidth;

        let line = this.menuTopY + lineSize;

        this.draw4columns("", leftX, line, names);

        const indexes = [0, 1, 2, 3];
    
        line += lineSize;
        if (this.stats.gameCount) {
            this.context.fillText(`games: ${this.stats.gameCount}`,
                                  leftX,
                                  line,
                                  this.menuWidth);

            line += lineSize;
            this.draw4columns("avg:", leftX, line,
                              indexes.map((i) => `${(this.stats.scoreTotals[i]
                              / this.stats.gameCount).toFixed(0)}`));
            
            line += lineSize;
            this.draw4columns("best:", leftX, line,
                              indexes.map((i) => `${this.stats.bestScores[i]}`));
            
            line += lineSize;
            this.draw4columns("worst:", leftX, line,
                              indexes.map((i) => `${this.stats.worstScores[i]}`));

            // place counts
            line += lineSize;
            this.draw4columns("1st:", leftX, line,
                              indexes.map((i) => `${(this.stats.placeCounts[0][i] * 100
                              / this.stats.gameCount).toFixed(0)}%`));
            line += lineSize;
            this.draw4columns("2nd:", leftX, line,
                              indexes.map((i) => `${(this.stats.placeCounts[1][i] * 100
                              / this.stats.gameCount).toFixed(0)}%`));
            line += lineSize;
            this.draw4columns("3rd:", leftX, line,
                              indexes.map((i) => `${(this.stats.placeCounts[2][i] * 100
                              / this.stats.gameCount).toFixed(0)}%`));
            line += lineSize;
            this.draw4columns("4th:", leftX, line,
                              indexes.map((i) => `${(this.stats.placeCounts[3][i] * 100
                              / this.stats.gameCount).toFixed(0)}%`));
        }

        line += lineSize;
        if (this.stats.handCount) {
            line += lineSize;
            this.context.fillText(`hands: ${this.stats.handCount}`,
                                  leftX,
                                  line,
                                  this.menuWidth);
                                
            line += lineSize;
            this.draw4columns("avg:", leftX, line,
                              indexes.map((i) => `${(this.stats.scoreTotals[i]
                              / this.stats.handCount).toFixed(1)}`));

            line += lineSize;
            this.draw4columns("queen:", leftX, line,
                              indexes.map((i) => `${(this.stats.queenCount[i] * 100
                              / this.stats.handCount).toFixed(0)}%`));

            line += lineSize;
            this.draw4columns("moon:", leftX, line,
                              indexes.map((i) => `${(this.stats.moonCount[i] * 100
                              / this.stats.handCount).toFixed(0)}%`));
        }
    }
}

export default StatDrawer;
