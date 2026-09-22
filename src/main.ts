import { WhiteBoard } from "./board/WhiteBoard";
import { DEFAULT_INK, SharedVariables } from "./core/SharedVariables";
import "./styles/tokens.css";
import "./styles/main.css";
import { requireElement } from "./ui/dom";
import { HintsPanel } from "./ui/HintsPanel";
import { bindShortcuts, createShortcuts } from "./ui/shortcuts";
import { ThemeController } from "./ui/theme";
import { ToolBar } from "./ui/ToolBar";

function start(): void {
    const canvas = requireElement<HTMLCanvasElement>("#whiteboard");
    const toolContainer = requireElement("#tool-container");
    const hintContainer = requireElement("#hint-container");

    const theme = new ThemeController();
    const sharedVariables = new SharedVariables();
    const board = new WhiteBoard(canvas, sharedVariables);

    const toolBar = new ToolBar(toolContainer, sharedVariables, {
        center: () => board.centerView(),
        exportPNG: () => board.exportPNG(),
        clear: () => board.clear(),
        toggleTheme: () => theme.toggle(),
    });

    const shortcuts = createShortcuts({
        board,
        sharedVariables,
        toolBar,
        theme,
        toggleHints: () => hints.toggle(),
    });

    const hints = new HintsPanel(hintContainer, shortcuts);
    bindShortcuts(shortcuts);

    theme.onChange((resolved) => {
        if (sharedVariables.inkIsDefault) {
            sharedVariables.lineColor.value = DEFAULT_INK[resolved];
        }

        board.refreshTheme();
    });

    // O tema ja foi aplicado antes do quadro existir, entao acertamos a cor agora.
    if (sharedVariables.inkIsDefault) {
        sharedVariables.lineColor.value = DEFAULT_INK[theme.resolved];
    }

    // So em desenvolvimento: os testes de ponta a ponta leem o estado por aqui.
    // O `if` some do pacote de producao junto com o conteudo.
    if (import.meta.env.DEV) {
        (window as unknown as Record<string, unknown>).whiteboard = { board, sharedVariables, theme };
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
} else {
    start();
}
