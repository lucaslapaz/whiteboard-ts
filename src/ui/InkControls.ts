import { ColorPalette } from "./ColorPalette";
import { el } from "./dom";
import { popUpField, rangeInput } from "./PopUp";

/** Espessura do traco mais a paleta, usados pela caneta e pelas formas. */
export class InkControls {
    public readonly thicknessRange: HTMLInputElement;
    public readonly thicknessNumber = el("p", { class: "popup-value" });
    public readonly palette: ColorPalette;

    constructor(prefix: string) {
        this.thicknessRange = rangeInput(prefix + "-thickness", 1, 24, 1);
        this.palette = new ColorPalette(prefix);
    }

    public fields(): HTMLElement[] {
        return [
            popUpField("Espessura", el("div", { class: "popup-row" }, [this.thicknessRange, this.thicknessNumber])),
            ...this.palette.fields(),
        ];
    }
}
