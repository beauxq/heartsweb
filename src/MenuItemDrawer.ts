import { Clickable } from "./Clickable";

/** Abstract Base Class for things that take the space in the menu */
abstract class MenuItemDrawer {
    protected menuWidth: number = 128;
    protected menuHeight: number = 128;
    protected menuRightX: number = 295;
    protected menuTopY: number = 25;

    constructor(protected context: CanvasRenderingContext2D) {

    }

    public resize(menuWidth: number, menuHeight: number, menuRightX: number, menuTopY: number) {
        this.menuWidth = menuWidth;
        this.menuHeight = menuHeight;
        this.menuRightX = menuRightX;
        this.menuTopY = menuTopY;
    }

    public abstract draw(clickables: Clickable[]): void;
}

export default MenuItemDrawer;
