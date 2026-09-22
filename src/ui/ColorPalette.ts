import { INK_PALETTE } from "../core/SharedVariables";
import { el } from "./dom";
import { popUpField } from "./PopUp";

/**
 * As amostras de cor mais o seletor livre. A caneta, as formas e o texto usam
 * a mesma cor, entao os tres paineis montam este mesmo bloco.
 */
export class ColorPalette {
    public readonly colorInput: HTMLInputElement;

    private readonly swatches: HTMLButtonElement[] = [];

    constructor(prefix: string) {
        this.colorInput = el("input", {
            class: "popup-color",
            attrs: { id: prefix + "-color", type: "color" },
        });

        for (const color of INK_PALETTE) {
            const swatch = el("button", {
                class: "popup-swatch",
                attrs: { type: "button", title: color, "aria-label": "Cor " + color },
            });

            swatch.style.setProperty("--swatch", color);
            swatch.addEventListener("click", () => this.pick(color));
            this.swatches.push(swatch);
        }
    }

    public fields(): HTMLElement[] {
        return [
            popUpField("Cor", el("div", { class: "popup-palette" }, this.swatches)),
            popUpField("Personalizada", this.colorInput),
        ];
    }

    public highlightSelected(color: string): void {
        for (const swatch of this.swatches) {
            swatch.toggleAttribute("data-active", swatch.style.getPropertyValue("--swatch") === color);
        }
    }

    /** Clicar numa amostra faz o mesmo que mexer no seletor de cor. */
    private pick(color: string): void {
        this.colorInput.value = color;
        this.colorInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
}
