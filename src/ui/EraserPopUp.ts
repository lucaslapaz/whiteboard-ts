import { el } from "./dom";
import { PopUp, popUpField, rangeInput } from "./PopUp";

export class EraserPopUp extends PopUp {
    public readonly thicknessRange = rangeInput("eraser-thickness", 4, 100, 2);
    public readonly thicknessNumber = el("p", { class: "popup-value" });

    constructor(parent: HTMLElement) {
        super(parent, "Ajustes da borracha");
        this.build();
    }

    protected createInterface(): void {
        const thickness = el("div", { class: "popup-row" }, [this.thicknessRange, this.thicknessNumber]);
        this.interface.append(popUpField("Tamanho", thickness));
    }
}
