import { distance } from "../core/geometry";
import { ETools } from "../core/types";
import type { IDrawing, IPoint, IPointerInfo, ISelectionArea } from "../core/types";
import { Tool } from "./Tool";

/** Abaixo disso o gesto conta como clique, acima vira arrasto. */
const DRAG_THRESHOLD = 4;

type Gesture = "idle" | "band" | "move";

/**
 * Ferramenta de selecao.
 *
 * - Clique no vazio e arrasta: retangulo de selecao.
 * - Clique em cima de um traco: seleciona ele e ja permite arrastar.
 * - Arrastar um traco que ja estava selecionado leva a selecao inteira junto.
 * - Com Ctrl (ou Shift), soma a selecao em vez de trocar.
 */
export class Cursor extends Tool {
    public readonly id = ETools.Cursor;

    private gesture: Gesture = "idle";
    private origin: IPoint | null = null;
    private last: IPoint | null = null;
    private additive = false;
    private kept: IDrawing[] = [];

    public override onPointerDown(pointer: IPointerInfo): void {
        if (pointer.button !== 0) {
            return;
        }

        this.origin = pointer.scene;
        this.last = pointer.scene;
        this.additive = pointer.additive;

        const hit = this.board.hitTest(pointer.scene);

        if (!hit) {
            if (!this.additive) {
                this.board.clearSelection();
            }

            this.kept = this.additive ? this.board.selectedDrawings : [];
            this.gesture = "band";
            return;
        }

        if (this.additive) {
            this.board.toggleSelected(hit);
            // Tirar da selecao nao deve comecar um arrasto.
            this.gesture = hit.selected ? "move" : "idle";
            return;
        }

        // Clicar num traco fora da selecao troca a selecao por ele; se ja estava
        // dentro, a selecao inteira e preservada para andar junto.
        if (!hit.selected) {
            this.board.selectOnly(hit);
        }

        this.gesture = "move";
    }

    public override onPointerMove(pointer: IPointerInfo): void {
        if (!this.origin || !this.last) {
            return;
        }

        if (this.gesture === "move") {
            this.board.moveSelected(pointer.scene.x - this.last.x, pointer.scene.y - this.last.y);
            this.last = pointer.scene;
            return;
        }

        if (this.gesture !== "band" || distance(pointer.scene, this.origin) < DRAG_THRESHOLD) {
            return;
        }

        const area: ISelectionArea = { start: this.origin, end: pointer.scene, lineWidth: 1 };
        this.board.setSelectionArea(area);
        this.board.selectWithinArea(area, this.kept);
    }

    public override onPointerUp(): void {
        this.reset();
    }

    public override onDeactivate(): void {
        this.reset();
    }

    private reset(): void {
        this.gesture = "idle";
        this.origin = null;
        this.last = null;
        this.kept = [];
        this.board.setSelectionArea(null);
    }
}
