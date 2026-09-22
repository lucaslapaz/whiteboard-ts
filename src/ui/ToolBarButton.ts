import { el } from "./dom";

export interface IToolBarButtonOptions {
    id: string;
    label: string;
    icon: string;
    shortcut?: string;
    onSelect: () => void;
}

/**
 * Um botao da barra. O rotulo vira a dica que aparece ao passar o mouse, e o
 * estado ativo e um atributo lido pelo CSS.
 */
export class ToolBarButton {
    public readonly id: string;
    public readonly interface: HTMLButtonElement;

    constructor(parent: HTMLElement, options: IToolBarButtonOptions) {
        this.id = options.id;

        const hint = options.shortcut ? options.label + "  (" + options.shortcut + ")" : options.label;

        this.interface = el("button", {
            class: "tool-button",
            attrs: {
                id: options.id,
                type: "button",
                "aria-label": options.label,
                "data-hint": hint,
            },
        });

        this.interface.appendChild(el("span", { class: "tool-icon", html: options.icon }));
        this.interface.addEventListener("click", options.onSelect);

        parent.appendChild(this.interface);
    }

    public focus(): void {
        this.interface.setAttribute("active", "true");
    }

    public loseFocus(): void {
        this.interface.removeAttribute("active");
    }
}
