import { el } from "./dom";
import type { IShortcut } from "./shortcuts";

/**
 * Cartao de ajuda no canto. A lista sai da mesma fonte que registra as teclas,
 * entao o que esta escrito aqui e sempre o que funciona de verdade.
 */
export class HintsPanel {
    private readonly card: HTMLElement;
    private readonly toggleButton: HTMLButtonElement;
    private open = false;

    constructor(container: HTMLElement, shortcuts: IShortcut[]) {
        this.card = el("section", {
            class: "hints-card",
            attrs: { "aria-label": "Atalhos do teclado", hidden: "" },
        });

        this.card.appendChild(el("h2", { class: "hints-title", text: "Atalhos" }));

        for (const [group, items] of this.groupShortcuts(shortcuts)) {
            const rows = items.map((shortcut) =>
                el("li", { class: "hints-row" }, [
                    el("span", { class: "hints-label", text: shortcut.label }),
                    el("kbd", { class: "hints-key", text: shortcut.display }),
                ]),
            );

            this.card.append(
                el("h3", { class: "hints-group", text: group }),
                el("ul", { class: "hints-list" }, rows),
            );
        }

        this.toggleButton = el("button", {
            class: "hints-toggle",
            text: "?",
            attrs: { type: "button", "aria-label": "Mostrar os atalhos" },
        });
        this.toggleButton.addEventListener("click", () => this.toggle());

        container.append(this.card, this.toggleButton);
    }

    public toggle(): void {
        this.open = !this.open;
        this.card.toggleAttribute("hidden", !this.open);
        this.toggleButton.toggleAttribute("data-active", this.open);
    }

    private groupShortcuts(shortcuts: IShortcut[]): Map<string, IShortcut[]> {
        const groups = new Map<string, IShortcut[]>();

        for (const shortcut of shortcuts) {
            if (shortcut.hidden) {
                continue;
            }

            const items = groups.get(shortcut.group) ?? [];
            items.push(shortcut);
            groups.set(shortcut.group, items);
        }

        return groups;
    }
}
