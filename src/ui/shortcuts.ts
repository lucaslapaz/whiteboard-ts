import type { WhiteBoard } from "../board/WhiteBoard";
import type { SharedVariables } from "../core/SharedVariables";
import { ETools } from "../core/types";
import type { ThemeController } from "./theme";
import type { ToolBar } from "./ToolBar";

const PAN_STEP = 40;

export interface IShortcut {
    /** Combinacoes aceitas, no formato `ctrl+shift+tecla`. */
    combos: string[];
    /** Como a combinacao aparece no painel de ajuda. */
    display: string;
    label: string;
    group: string;
    run: () => void;
    /** Variacoes da mesma linha da ajuda (as outras setas), que nao se repetem no painel. */
    hidden?: boolean;
}

export interface IShortcutContext {
    board: WhiteBoard;
    sharedVariables: SharedVariables;
    toolBar: ToolBar;
    theme: ThemeController;
    toggleHints: () => void;
}

export function createShortcuts(context: IShortcutContext): IShortcut[] {
    const { board, sharedVariables, toolBar, theme, toggleHints } = context;
    const selectTool = (tool: ETools) => () => {
        sharedVariables.activeTool.value = tool;
    };

    return [
        { combos: ["p"], display: "P", label: "Caneta", group: "Ferramentas", run: selectTool(ETools.Pen) },
        { combos: ["s"], display: "S", label: "Formas", group: "Ferramentas", run: selectTool(ETools.Shape) },
        { combos: ["t"], display: "T", label: "Texto", group: "Ferramentas", run: selectTool(ETools.Text) },
        { combos: ["e"], display: "E", label: "Borracha", group: "Ferramentas", run: selectTool(ETools.Eraser) },
        { combos: ["v"], display: "V", label: "Selecao", group: "Ferramentas", run: selectTool(ETools.Cursor) },
        { combos: ["h"], display: "H", label: "Mover o quadro", group: "Ferramentas", run: selectTool(ETools.Hand) },

        { combos: ["ctrl+z"], display: "Ctrl + Z", label: "Desfazer", group: "Edicao", run: () => board.undo() },
        {
            combos: ["ctrl+y", "ctrl+shift+z"],
            display: "Ctrl + Y",
            label: "Refazer",
            group: "Edicao",
            run: () => board.redo(),
        },
        {
            combos: ["delete", "backspace"],
            display: "Delete",
            label: "Apagar a selecao",
            group: "Edicao",
            run: () => board.deleteSelected(),
        },
        {
            combos: ["escape"],
            display: "Esc",
            label: "Limpar a selecao",
            group: "Edicao",
            run: () => {
                board.clearSelection();
                toolBar.closePopUp();
            },
        },

        // As letras viraram atalho de ferramenta, entao sobraram as setas
        // (mais a roda do mouse e a ferramenta mao).
        {
            combos: ["arrowleft"],
            display: "Setas",
            label: "Mover o quadro",
            group: "Visao",
            run: () => board.pan(PAN_STEP, 0),
        },
        { combos: ["arrowright"], display: "", label: "", group: "Visao", hidden: true, run: () => board.pan(-PAN_STEP, 0) },
        { combos: ["arrowup"], display: "", label: "", group: "Visao", hidden: true, run: () => board.pan(0, PAN_STEP) },
        { combos: ["arrowdown"], display: "", label: "", group: "Visao", hidden: true, run: () => board.pan(0, -PAN_STEP) },
        { combos: ["f"], display: "F", label: "Centralizar o desenho", group: "Visao", run: () => board.centerView() },

        {
            combos: ["ctrl+s"],
            display: "Ctrl + S",
            label: "Exportar PNG",
            group: "Quadro",
            run: () => board.exportPNG(),
        },
        { combos: ["d"], display: "D", label: "Tema claro / escuro", group: "Quadro", run: () => theme.toggle() },
        { combos: ["?", "shift+?"], display: "?", label: "Mostrar os atalhos", group: "Quadro", run: toggleHints },
    ];
}

/** Liga a lista de atalhos ao teclado. Um atalho so consome a tecla se existir. */
export function bindShortcuts(shortcuts: IShortcut[]): void {
    const index = new Map<string, IShortcut>();

    for (const shortcut of shortcuts) {
        for (const combo of shortcut.combos) {
            index.set(combo, shortcut);
        }
    }

    window.addEventListener("keydown", (event) => {
        if (isTyping(event.target) && event.key !== "Escape") {
            return;
        }

        const shortcut = index.get(describeCombo(event));
        if (!shortcut) {
            return;
        }

        event.preventDefault();
        shortcut.run();
    });
}

function describeCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) {
        parts.push("ctrl");
    }

    if (event.altKey) {
        parts.push("alt");
    }

    if (event.shiftKey) {
        parts.push("shift");
    }

    parts.push(event.key.toLowerCase());
    return parts.join("+");
}

function isTyping(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
    );
}
