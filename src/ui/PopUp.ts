import { el } from "./dom";

/**
 * Painel que aparece ao lado da barra quando uma ferramenta tem ajustes.
 * A subclasse so precisa dizer o que vai dentro.
 */
export abstract class PopUp {
    public readonly interface: HTMLDivElement;

    protected readonly parent: HTMLElement;

    constructor(parent: HTMLElement, title: string) {
        this.parent = parent;
        this.interface = el("div", {
            class: "tool-popup",
            attrs: { role: "dialog", "aria-label": title },
        });
    }

    protected abstract createInterface(): void;

    /** Monta o conteudo. Chamado pela subclasse depois de criar seus campos. */
    protected build(): void {
        this.createInterface();
    }

    public showPopUp(): void {
        if (!this.interface.parentNode) {
            this.parent.appendChild(this.interface);
        }
    }

    public closePopUp(): void {
        this.interface.parentNode?.removeChild(this.interface);
    }

    public get isOpen(): boolean {
        return this.interface.parentNode !== null;
    }
}

/** Linha padrao do popup: um rotulo em cima, o controle embaixo. */
export function popUpField(label: string, control: HTMLElement): HTMLElement {
    return el("label", { class: "popup-field" }, [el("span", { class: "popup-label", text: label }), control]);
}

export function rangeInput(id: string, min: number, max: number, step: number): HTMLInputElement {
    return el("input", {
        class: "popup-range",
        attrs: {
            id,
            type: "range",
            min: String(min),
            max: String(max),
            step: String(step),
        },
    });
}
