import {
    drawingsBounds,
    isDrawingInsideArea,
    isDrawingNearPoint,
    translateDrawing,
} from "../core/geometry";
import { History } from "../core/History";
import type { SharedVariables } from "../core/SharedVariables";
import { ETools } from "../core/types";
import type { IDrawing, IPoint, IPointerInfo, ISelectionArea } from "../core/types";
import { Cursor, Eraser, Hand, Pen, ShapeTool } from "../tools";
import type { Tool } from "../tools/Tool";
import { Renderer } from "./Renderer";
import type { IScene } from "./Renderer";
import { Viewport } from "./Viewport";

const CLICK_TOLERANCE = 6;

/**
 * O quadro em si: guarda os tracos, o historico e a visao, e reparte os eventos
 * do ponteiro para a ferramenta ativa. As ferramentas nunca mexem no estado
 * direto, elas pedem por estes metodos.
 */
export class WhiteBoard {
    public readonly sharedVariables: SharedVariables;
    public readonly viewport = new Viewport();

    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: Renderer;
    private readonly tools: Map<ETools, Tool>;

    private readonly history = new History<IDrawing[]>();

    private drawings: IDrawing[] = [];
    private currentDrawing: IDrawing | null = null;
    private selectionArea: ISelectionArea | null = null;
    private pointerScene: IPoint | null = null;
    private frameRequest = 0;

    constructor(canvas: HTMLCanvasElement, sharedVariables: SharedVariables) {
        this.canvas = canvas;
        this.sharedVariables = sharedVariables;
        this.renderer = new Renderer(canvas, this.viewport);

        this.tools = new Map<ETools, Tool>([
            [ETools.Pen, new Pen(this)],
            [ETools.Shape, new ShapeTool(this)],
            [ETools.Eraser, new Eraser(this)],
            [ETools.Cursor, new Cursor(this)],
            [ETools.Hand, new Hand(this)],
        ]);

        this.setupEventListeners();
        this.renderer.resize();
        this.requestRender();
    }

    // --- Leitura de estado -------------------------------------------------

    public get allDrawings(): readonly IDrawing[] {
        return this.drawings;
    }

    public get currentStroke(): IDrawing | null {
        return this.currentDrawing;
    }

    public get activeTool(): Tool | undefined {
        return this.tools.get(this.sharedVariables.activeTool.value);
    }

    public get selectedDrawings(): IDrawing[] {
        return this.drawings.filter((drawing) => drawing.selected);
    }

    /** O traco mais recente que encosta no ponto, ou `null` se o clique foi no vazio. */
    public hitTest(point: IPoint): IDrawing | null {
        for (let i = this.drawings.length - 1; i >= 0; i--) {
            if (isDrawingNearPoint(this.drawings[i], point, CLICK_TOLERANCE)) {
                return this.drawings[i];
            }
        }

        return null;
    }

    // --- Tracos ------------------------------------------------------------

    /** Define o traco em andamento, que aparece na tela mas ainda nao foi gravado. */
    public setCurrentStroke(drawing: IDrawing | null): void {
        this.currentDrawing = drawing;
        this.requestRender();
    }

    public extendStroke(point: IPoint): void {
        this.currentDrawing?.points.push(point);
        this.requestRender();
    }

    public cancelStroke(): void {
        this.currentDrawing = null;
        this.requestRender();
    }

    /** Descarta clique seco: um traco de um ponto so nao desenha nada. */
    public commitStroke(): void {
        const stroke = this.currentDrawing;
        this.currentDrawing = null;

        if (stroke && stroke.points.length >= 2) {
            this.applyChange([...this.drawings, stroke]);
        }

        this.requestRender();
    }

    public eraseAt(point: IPoint, radius: number): void {
        const remaining = this.drawings.filter((drawing) => !isDrawingNearPoint(drawing, point, radius));

        if (remaining.length !== this.drawings.length) {
            this.applyChange(remaining);
        }

        this.requestRender();
    }

    // --- Selecao -----------------------------------------------------------

    public setSelectionArea(area: ISelectionArea | null): void {
        this.selectionArea = area;
        this.requestRender();
    }

    /**
     * Marca o que esta dentro do retangulo. O que vier em `keep` continua
     * selecionado, que e como o Ctrl soma a uma selecao que ja existia.
     */
    public selectWithinArea(area: ISelectionArea, keep: readonly IDrawing[] = []): void {
        const kept = new Set(keep);

        for (const drawing of this.drawings) {
            drawing.selected = kept.has(drawing) || isDrawingInsideArea(drawing, area);
        }

        this.requestRender();
    }

    public selectOnly(target: IDrawing): void {
        for (const drawing of this.drawings) {
            drawing.selected = drawing === target;
        }

        this.requestRender();
    }

    /** Ctrl + clique: entra na selecao se estava fora, sai se ja estava dentro. */
    public toggleSelected(target: IDrawing): void {
        target.selected = !target.selected;
        this.requestRender();
    }

    public clearSelection(): void {
        for (const drawing of this.drawings) {
            drawing.selected = false;
        }

        this.requestRender();
    }

    /**
     * Arrasta o que esta selecionado. Os tracos movidos sao recriados em vez de
     * alterados no lugar, senao o instantaneo guardado no historico andaria junto.
     */
    public moveSelected(deltaX: number, deltaY: number): void {
        if (deltaX === 0 && deltaY === 0) {
            return;
        }

        let moved = false;
        const next = this.drawings.map((drawing) => {
            if (!drawing.selected) {
                return drawing;
            }

            moved = true;
            return translateDrawing(drawing, deltaX, deltaY);
        });

        if (moved) {
            this.applyChange(next);
            this.requestRender();
        }
    }

    public deleteSelected(): void {
        const remaining = this.drawings.filter((drawing) => !drawing.selected);

        if (remaining.length !== this.drawings.length) {
            this.applyChange(remaining);
            this.requestRender();
        }
    }

    // --- Historico ---------------------------------------------------------

    /**
     * Abre um gesto: tudo que mudar ate `endGesture` vira um unico passo de
     * desfazer, senao cada pixel arrastado com a borracha viraria um passo.
     */
    public beginGesture(): void {
        this.history.beginGesture();
    }

    public endGesture(): void {
        this.history.endGesture();
    }

    public undo(): void {
        const previous = this.history.undo(this.drawings);

        if (previous) {
            this.drawings = previous;
            this.requestRender();
        }
    }

    public redo(): void {
        const next = this.history.redo(this.drawings);

        if (next) {
            this.drawings = next;
            this.requestRender();
        }
    }

    public clear(): void {
        if (this.drawings.length > 0) {
            this.applyChange([]);
            this.requestRender();
        }
    }

    // --- Visao -------------------------------------------------------------

    public pan(deltaX: number, deltaY: number): void {
        this.viewport.panBy(deltaX, deltaY);
        this.requestRender();
    }

    /** Traz o desenho de volta para o meio da tela (ou para a origem, se vazio). */
    public centerView(): void {
        const bounds = drawingsBounds(this.drawings);
        const { width, height } = this.renderer.size;

        if (bounds) {
            this.viewport.panTo(
                width / 2 - (bounds.minX + bounds.maxX) / 2,
                height / 2 - (bounds.minY + bounds.maxY) / 2,
            );
        } else {
            this.viewport.panTo(0, 0);
        }

        this.requestRender();
    }

    public exportPNG(): void {
        const link = document.createElement("a");
        link.href = this.renderer.toDataURL(this.scene());
        link.download = "whiteboard-" + new Date().toISOString().slice(0, 10) + ".png";
        link.click();

        // O canvas ficou com a versao "limpa" da exportacao, entao voltamos a vista normal.
        this.requestRender();
    }

    // --- Renderizacao ------------------------------------------------------

    /** Junta varios pedidos de redesenho no mesmo quadro de animacao. */
    public requestRender(): void {
        if (this.frameRequest !== 0) {
            return;
        }

        this.frameRequest = requestAnimationFrame(() => {
            this.frameRequest = 0;
            this.render();
        });
    }

    public refreshTheme(): void {
        this.renderer.refreshTheme();
        this.requestRender();
    }

    private render(): void {
        this.renderer.render(this.scene());
    }

    private scene(): IScene {
        const radius = this.activeTool?.brushRadius() ?? null;

        return {
            drawings: this.drawings,
            currentDrawing: this.currentDrawing,
            selectionArea: this.selectionArea,
            brush: radius !== null && this.pointerScene ? { center: this.pointerScene, radius } : null,
        };
    }

    // --- Estado interno ----------------------------------------------------

    /** Troca a lista de tracos guardando a anterior no historico. */
    private applyChange(next: IDrawing[]): void {
        this.history.record(this.drawings);
        this.drawings = next;
    }

    // --- Eventos -----------------------------------------------------------

    private setupEventListeners(): void {
        this.canvas.addEventListener("pointerdown", this.onPointerDown);
        this.canvas.addEventListener("pointermove", this.onPointerMove);
        this.canvas.addEventListener("pointerup", this.onPointerUp);
        this.canvas.addEventListener("pointercancel", this.onPointerUp);
        this.canvas.addEventListener("pointerleave", this.onPointerLeave);
        this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
        this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

        new ResizeObserver(() => {
            this.renderer.resize();
            this.requestRender();
        }).observe(this.canvas);

        this.sharedVariables.activeTool.addListener((tool) => {
            for (const [id, instance] of this.tools) {
                if (id !== tool) {
                    instance.onDeactivate();
                }
            }

            this.canvas.dataset.tool = tool;
            this.requestRender();
        });
    }

    private onPointerDown = (event: PointerEvent): void => {
        this.canvas.setPointerCapture(event.pointerId);
        this.beginGesture();
        this.activeTool?.onPointerDown(this.describePointer(event));
    };

    private onPointerMove = (event: PointerEvent): void => {
        const pointer = this.describePointer(event);
        this.pointerScene = pointer.scene;
        this.activeTool?.onPointerMove(pointer);

        if ((this.activeTool?.brushRadius() ?? null) !== null) {
            this.requestRender();
        }
    };

    private onPointerUp = (event: PointerEvent): void => {
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }

        this.activeTool?.onPointerUp(this.describePointer(event));
        this.endGesture();
    };

    private onPointerLeave = (): void => {
        this.pointerScene = null;
        this.requestRender();
    };

    /** Roda do mouse (ou dois dedos no trackpad) arrasta o quadro. */
    private onWheel = (event: WheelEvent): void => {
        event.preventDefault();
        this.pan(-event.deltaX, -event.deltaY);
    };

    private describePointer(event: PointerEvent): IPointerInfo {
        const bounding = this.canvas.getBoundingClientRect();
        const screen = { x: event.clientX - bounding.left, y: event.clientY - bounding.top };

        return {
            screen,
            scene: this.viewport.toScene(screen),
            button: event.button,
            additive: event.ctrlKey || event.metaKey || event.shiftKey,
            constrain: event.shiftKey,
            originalEvent: event,
        };
    }
}
