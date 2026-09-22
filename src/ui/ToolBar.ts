import type { SharedVariables } from "../core/SharedVariables";
import { ETools } from "../core/types";
import { el } from "./dom";
import { EraserPopUp } from "./EraserPopUp";
import { icons } from "./icons";
import type { InkControls } from "./InkControls";
import { PenPopUp } from "./PenPopUp";
import type { PopUp } from "./PopUp";
import { ShapePopUp } from "./ShapePopUp";
import { ToolBarButton } from "./ToolBarButton";

export interface IToolBarActions {
    center: () => void;
    exportPNG: () => void;
    clear: () => void;
    toggleTheme: () => void;
}

/**
 * A barra flutuante. Ela nao conhece o quadro: escreve a ferramenta escolhida
 * em `SharedVariables` e chama as acoes que recebeu de fora.
 */
export class ToolBar {
    private readonly container: HTMLElement;
    private readonly sharedVariables: SharedVariables;
    private readonly actions: IToolBarActions;

    private readonly toolButtons = new Map<ETools, ToolBarButton>();

    private penPopUp: PenPopUp | null = null;
    private shapePopUp: ShapePopUp | null = null;
    private eraserPopUp: EraserPopUp | null = null;
    private actualPopUp: PopUp | null = null;

    /** O primeiro aviso do `Variable` e so para acender o botao inicial. */
    private booted = false;

    constructor(container: HTMLElement, sharedVariables: SharedVariables, actions: IToolBarActions) {
        this.container = container;
        this.sharedVariables = sharedVariables;
        this.actions = actions;

        this.createInterface();

        this.sharedVariables.activeTool.addListener((tool) => this.onToolChanged(tool));
        window.addEventListener("pointerdown", this.onWindowPointerDown);
    }

    private createInterface(): void {
        const tools: Array<{ tool: ETools; label: string; icon: string; shortcut: string }> = [
            { tool: ETools.Pen, label: "Caneta", icon: icons.pen, shortcut: "P" },
            { tool: ETools.Shape, label: "Formas", icon: icons.shapes, shortcut: "S" },
            { tool: ETools.Eraser, label: "Borracha", icon: icons.eraser, shortcut: "E" },
            { tool: ETools.Cursor, label: "Selecao", icon: icons.cursor, shortcut: "V" },
            { tool: ETools.Hand, label: "Mover o quadro", icon: icons.hand, shortcut: "H" },
        ];

        for (const item of tools) {
            const button = new ToolBarButton(this.container, {
                id: item.tool + "-button",
                label: item.label,
                icon: item.icon,
                shortcut: item.shortcut,
                onSelect: () => this.selectTool(item.tool),
            });

            this.toolButtons.set(item.tool, button);
        }

        this.container.appendChild(el("span", { class: "tool-divider" }));

        const extras: Array<{ id: string; label: string; icon: string; shortcut?: string; run: () => void }> = [
            { id: "center-button", label: "Centralizar", icon: icons.center, shortcut: "F", run: this.actions.center },
            {
                id: "export-button",
                label: "Exportar PNG",
                icon: icons.download,
                shortcut: "Ctrl + S",
                run: this.actions.exportPNG,
            },
            { id: "clear-button", label: "Limpar o quadro", icon: icons.trash, run: this.actions.clear },
            { id: "theme-button", label: "Tema claro / escuro", icon: icons.theme, run: this.actions.toggleTheme },
        ];

        for (const item of extras) {
            new ToolBarButton(this.container, {
                id: item.id,
                label: item.label,
                icon: item.icon,
                ...(item.shortcut ? { shortcut: item.shortcut } : {}),
                onSelect: () => {
                    this.closePopUp();
                    item.run();
                },
            });
        }
    }

    /** Clicar na ferramenta ja ativa abre e fecha o painel de ajustes dela. */
    private selectTool(tool: ETools): void {
        if (this.sharedVariables.activeTool.value === tool) {
            this.togglePopUp(tool);
            return;
        }

        // Trocar de ferramenta ja abre o painel dela, pelo ouvinte de `activeTool`.
        this.sharedVariables.activeTool.value = tool;
    }

    private onToolChanged(tool: ETools): void {
        for (const [id, button] of this.toolButtons) {
            if (id === tool) {
                button.focus();
            } else {
                button.loseFocus();
            }
        }

        if (this.booted) {
            this.openPopUp(tool);
        }

        this.booted = true;
    }

    private togglePopUp(tool: ETools): void {
        if (this.actualPopUp?.isOpen) {
            this.closePopUp();
        } else {
            this.openPopUp(tool);
        }
    }

    private openPopUp(tool: ETools): void {
        this.closePopUp();

        const popUp = this.popUpFor(tool);
        if (!popUp) {
            return;
        }

        this.actualPopUp = popUp;
        popUp.showPopUp();
    }

    public closePopUp(): void {
        this.actualPopUp?.closePopUp();
        this.actualPopUp = null;
    }

    /** Os paineis sao criados na primeira vez que a ferramenta e usada. */
    private popUpFor(tool: ETools): PopUp | null {
        if (tool === ETools.Pen) {
            this.penPopUp ??= this.createPenPopUp();
            return this.penPopUp;
        }

        if (tool === ETools.Shape) {
            this.shapePopUp ??= this.createShapePopUp();
            return this.shapePopUp;
        }

        if (tool === ETools.Eraser) {
            this.eraserPopUp ??= this.createEraserPopUp();
            return this.eraserPopUp;
        }

        return null;
    }

    private createPenPopUp(): PenPopUp {
        const popUp = new PenPopUp(this.container);
        this.connectInk(popUp.ink);
        return popUp;
    }

    private createShapePopUp(): ShapePopUp {
        const popUp = new ShapePopUp(this.container, this.sharedVariables.shape);
        this.connectInk(popUp.ink);
        return popUp;
    }

    /**
     * Liga os campos de espessura e cor as variaveis compartilhadas. A caneta e
     * as formas usam os mesmos valores, entao os dois paineis ficam em sincronia.
     */
    private connectInk(ink: InkControls): void {
        const { lineThickness, lineColor } = this.sharedVariables;

        lineThickness.associateElement(ink.thicknessRange);
        lineThickness.associateElement(ink.thicknessNumber);
        lineColor.associateElement(ink.colorInput);
        lineColor.addListener((color) => ink.highlightSelected(color));

        // A partir da primeira escolha manual, a cor para de seguir o tema.
        ink.colorInput.addEventListener("input", () => {
            this.sharedVariables.inkIsDefault = false;
        });
    }

    private createEraserPopUp(): EraserPopUp {
        const popUp = new EraserPopUp(this.container);
        const { eraserThickness } = this.sharedVariables;

        eraserThickness.associateElement(popUp.thicknessRange);
        eraserThickness.associateElement(popUp.thicknessNumber);

        return popUp;
    }

    private onWindowPointerDown = (event: PointerEvent): void => {
        const target = event.target as HTMLElement | null;

        if (!target?.closest("#tool-container")) {
            this.closePopUp();
        }
    };
}
