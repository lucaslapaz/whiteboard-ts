import { InkControls } from "./InkControls";
import { PopUp } from "./PopUp";

export class PenPopUp extends PopUp {
    public readonly ink = new InkControls("pen");

    constructor(parent: HTMLElement) {
        super(parent, "Ajustes da caneta");
        this.build();
    }

    protected createInterface(): void {
        this.interface.append(...this.ink.fields());
    }
}
