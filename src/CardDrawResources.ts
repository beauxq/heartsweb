import Card from "./Card";

class CardDrawResources {
    // coordinates from image file
    static readonly suitAssetYs: number[] = [0, 528, 352, 176];
    static readonly assetHeight: number = 156;
    static readonly valueXMult: number = 131.5834;
    static readonly assetWidth: number = 112;

    static _assets: HTMLImageElement;

    public static getAssetCoords(card: Card) {
        const assetX = (((card.value === 14) ? 1 : card.value) - 1) * CardDrawResources.valueXMult;
        const assetY = CardDrawResources.suitAssetYs[card.suit];

        return { assetX, assetY };
    }

    static get assets() {
        if (! CardDrawResources._assets) {
            CardDrawResources._assets = document.getElementById("a") as HTMLImageElement;
        }
        return CardDrawResources._assets;
    }
}

export default CardDrawResources;
