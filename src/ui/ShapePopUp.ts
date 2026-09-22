import { EShape } from "../core/shapes";
import type { Variable } from "../core/Variable";
import { el } from "./dom";
import { shapeIcons } from "./shapeIcons";
import { InkControls } from "./InkControls";
import { PopUp, popUpField } from "./PopUp";

const SHAPES: Array<{ kind: EShape; label: string }> = [
    { kind: EShape.Rectangle, label: "Retangulo" },
    { kind: EShape.RoundedRectangle, label: "Retangulo arredondado" },
    { kind: EShape.Ellipse, label: "Elipse" },
    { kind: EShape.Triangle, label: "Triangulo" },
    { kind: EShape.Diamond, label: "Losango" },
    { kind: EShape.Bubble, label: "Balao de fala" },
    { kind: EShape.Line, label: "Linha" },
    { kind: EShape.Arrow, label: "Seta" },
];

export class ShapePopUp extends PopUp {
    public readonly ink = new InkControls("shape");

    private readonly buttons = new Map<EShape, HTMLButtonElement>();

    constructor(parent: HTMLElement, private readonly shape: Variable<EShape>) {
        super(parent, "Formas");
        this.build();
    }

    protected createInterface(): void {
        for (const item of SHAPES) {
            const button = el("button", {
                class: "popup-shape",
                html: shapeIcons[item.kind],
                attrs: { type: "button", title: item.label, "aria-label": item.label },
            });

            button.addEventListener("click", () => {
                this.shape.value = item.kind;
            });

            this.buttons.set(item.kind, button);
        }

        this.interface.append(
            popUpField("Forma", el("div", { class: "popup-shapes" }, [...this.buttons.values()])),
            ...this.ink.fields(),
        );

        this.shape.addListener((kind) => this.highlightShape(kind));
    }

    private highlightShape(kind: EShape): void {
        for (const [current, button] of this.buttons) {
            button.toggleAttribute("data-active", current === kind);
        }
    }
}
