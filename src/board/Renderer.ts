import { textBaselineOffset, textFont, textLineHeight } from "../core/text";
import type { IDrawing, IPoint, ISelectionArea, IStroke, IText } from "../core/types";
import type { Viewport } from "./Viewport";

export interface IBrushPreview {
    center: IPoint;
    radius: number;
}

export interface IScene {
    drawings: IDrawing[];
    currentDrawing: IDrawing | null;
    selectionArea: ISelectionArea | null;
    brush: IBrushPreview | null;
}

interface ITheme {
    background: string;
    grid: string;
    selectionStroke: string;
    selectionFill: string;
    selectionGlow: string;
    brush: string;
}

const GRID_SPACING = 28;
const GRID_DOT_RADIUS = 1;

/**
 * Tudo que toca no contexto 2D mora aqui. As cores vem das variaveis CSS, entao
 * o tema claro/escuro vale para o canvas sem duplicar paleta no TypeScript.
 */
export class Renderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly viewport: Viewport;

    private theme: ITheme;
    private width = 0;
    private height = 0;

    constructor(canvas: HTMLCanvasElement, viewport: Viewport) {
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Nao foi possivel obter o contexto 2D do canvas.");
        }

        this.canvas = canvas;
        this.ctx = ctx;
        this.viewport = viewport;
        this.theme = this.readTheme();
    }

    public get size(): { width: number; height: number } {
        return { width: this.width, height: this.height };
    }

    /** Reajusta o buffer do canvas ao tamanho real, respeitando a densidade da tela. */
    public resize(): void {
        const ratio = window.devicePixelRatio || 1;
        const bounding = this.canvas.getBoundingClientRect();

        this.width = bounding.width;
        this.height = bounding.height;
        this.canvas.width = Math.round(bounding.width * ratio);
        this.canvas.height = Math.round(bounding.height * ratio);
    }

    public refreshTheme(): void {
        this.theme = this.readTheme();
    }

    public render(scene: IScene): void {
        this.applyTransform();
        this.clear();
        this.drawGrid();

        for (const drawing of scene.drawings) {
            this.drawElement(drawing);
        }

        if (scene.currentDrawing) {
            this.drawElement(scene.currentDrawing);
        }

        if (scene.selectionArea) {
            this.drawSelectionArea(scene.selectionArea);
        }

        if (scene.brush) {
            this.drawBrushPreview(scene.brush);
        }
    }

    /**
     * Exporta o pedaco visivel do quadro como PNG. Redesenha so os tracos, sem
     * grade, selecao nem circulo do pincel, e achata tudo sobre o fundo para a
     * imagem nao sair transparente. Quem chamar precisa pedir um `render` depois.
     */
    public toDataURL(scene: IScene): string {
        this.applyTransform();
        this.clear();

        for (const drawing of scene.drawings) {
            this.drawElement(drawing, false);
        }

        const target = document.createElement("canvas");
        target.width = this.canvas.width;
        target.height = this.canvas.height;

        const ctx = target.getContext("2d");
        if (!ctx) {
            return this.canvas.toDataURL("image/png");
        }

        ctx.fillStyle = this.theme.background;
        ctx.fillRect(0, 0, target.width, target.height);
        ctx.drawImage(this.canvas, 0, 0);

        return target.toDataURL("image/png");
    }

    private applyTransform(): void {
        const ratio = window.devicePixelRatio || 1;
        this.ctx.setTransform(
            ratio,
            0,
            0,
            ratio,
            this.viewport.offsetX * ratio,
            this.viewport.offsetY * ratio,
        );
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
    }

    private clear(): void {
        const origin = this.viewport.toScene({ x: 0, y: 0 });
        this.ctx.clearRect(origin.x, origin.y, this.width, this.height);
    }

    private drawGrid(): void {
        const origin = this.viewport.toScene({ x: 0, y: 0 });
        const startX = Math.floor(origin.x / GRID_SPACING) * GRID_SPACING;
        const startY = Math.floor(origin.y / GRID_SPACING) * GRID_SPACING;

        this.ctx.fillStyle = this.theme.grid;

        for (let x = startX; x <= origin.x + this.width; x += GRID_SPACING) {
            for (let y = startY; y <= origin.y + this.height; y += GRID_SPACING) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, GRID_DOT_RADIUS, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    private drawSelectionArea(area: ISelectionArea): void {
        const width = area.end.x - area.start.x;
        const height = area.end.y - area.start.y;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(area.start.x, area.start.y, width, height);
        this.ctx.fillStyle = this.theme.selectionFill;
        this.ctx.fill();
        this.ctx.strokeStyle = this.theme.selectionStroke;
        this.ctx.lineWidth = area.lineWidth;
        this.ctx.setLineDash([6, 4]);
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawBrushPreview(brush: IBrushPreview): void {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(brush.center.x, brush.center.y, Math.max(brush.radius, 3), 0, Math.PI * 2);
        this.ctx.strokeStyle = this.theme.brush;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
    }

    private drawElement(drawing: IDrawing, withGlow = true): void {
        if (drawing.kind === "text") {
            this.drawText(drawing, withGlow);
        } else {
            this.drawStroke(drawing, withGlow);
        }
    }

    /** Mede o texto com a mesma fonte que vai desenhar, para gravar a caixa dele. */
    public measureText(lines: string[], fontSize: number): { width: number; height: number } {
        this.ctx.save();
        this.ctx.font = textFont(fontSize);
        const width = lines.reduce((widest, line) => Math.max(widest, this.ctx.measureText(line).width), 0);
        this.ctx.restore();

        return { width, height: lines.length * textLineHeight(fontSize) };
    }

    private drawText(text: IText, withGlow: boolean): void {
        this.ctx.save();
        this.ctx.font = textFont(text.fontSize);
        this.ctx.textBaseline = "alphabetic";
        this.ctx.fillStyle = text.color;

        if (text.selected && withGlow) {
            this.ctx.shadowColor = this.theme.selectionGlow;
            this.ctx.shadowBlur = 8;
        }

        // `position` e o topo da caixa de linha, igual ao `<textarea>`. A linha
        // de base sai da mesma conta que o CSS faz para centralizar o glifo.
        const { ascent, descent } = this.fontMetrics(text.fontSize);
        const lineHeight = textLineHeight(text.fontSize);
        const baseline = text.position.y + textBaselineOffset(text.fontSize, ascent, descent);

        text.lines.forEach((line, index) => {
            this.ctx.fillText(line, text.position.x, baseline + index * lineHeight);
        });

        this.ctx.restore();
    }

    /** Altura real da fonte, que e o que o CSS usa para montar a caixa de linha. */
    private fontMetrics(fontSize: number): { ascent: number; descent: number } {
        this.ctx.save();
        this.ctx.font = textFont(fontSize);
        const metrics = this.ctx.measureText("Mg");
        this.ctx.restore();

        return {
            ascent: metrics.fontBoundingBoxAscent ?? fontSize * 0.8,
            descent: metrics.fontBoundingBoxDescent ?? fontSize * 0.2,
        };
    }

    private drawStroke(drawing: IStroke, withGlow: boolean): void {
        const { points } = drawing;

        if (points.length < 2) {
            return; // Nao e possivel desenhar uma linha com menos de 2 pontos.
        }

        this.ctx.save();
        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.lineWidth;

        if (drawing.selected && withGlow) {
            this.ctx.shadowColor = this.theme.selectionGlow;
            this.ctx.shadowBlur = 8;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        if (drawing.smooth) {
            this.traceSmooth(points);
        } else {
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
        }

        if (drawing.closed) {
            this.ctx.closePath();
        }

        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * Liga os pontos com curvas quadraticas passando pelo meio de cada par, que
     * e o jeito barato de tirar o serrilhado do traco feito a mao.
     */
    private traceSmooth(points: IPoint[]): void {
        for (let i = 1; i < points.length - 2; i++) {
            const controlX = (points[i].x + points[i + 1].x) / 2;
            const controlY = (points[i].y + points[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(points[i].x, points[i].y, controlX, controlY);
        }

        const last = points.length - 1;
        this.ctx.quadraticCurveTo(points[last - 1].x, points[last - 1].y, points[last].x, points[last].y);
    }

    private readTheme(): ITheme {
        const styles = getComputedStyle(this.canvas);
        const read = (name: string, fallback: string): string => {
            const value = styles.getPropertyValue(name).trim();
            return value.length > 0 ? value : fallback;
        };

        return {
            background: read("--board-bg", "#f2fcfc"),
            grid: read("--board-grid", "rgba(56, 49, 109, 0.14)"),
            selectionStroke: read("--selection-stroke", "darkcyan"),
            selectionFill: read("--selection-fill", "rgba(222, 222, 222, 0.3)"),
            selectionGlow: read("--selection-glow", "rgba(255, 0, 0, 1)"),
            brush: read("--brush-outline", "rgba(56, 49, 109, 0.55)"),
        };
    }
}
