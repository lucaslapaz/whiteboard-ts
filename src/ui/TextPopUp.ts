import { ColorPalette } from "./ColorPalette";
import { el } from "./dom";
import { PopUp, popUpField, rangeInput } from "./PopUp";

export class TextPopUp extends PopUp {
    public readonly fontSizeRange = rangeInput("text-size", 12, 96, 2);
    public readonly fontSizeNumber = el("p", { class: "popup-value" });
    public readonly palette = new ColorPalette("text");

    constructor(parent: HTMLElement) {
        super(parent, "Ajustes do texto");
        this.build();
    }

    protected createInterface(): void {
        this.interface.append(
            popUpField("Tamanho", el("div", { class: "popup-row" }, [this.fontSizeRange, this.fontSizeNumber])),
            ...this.palette.fields(),
        );
    }
}
