import { distance } from "../core/geometry";
import { buildShape } from "../core/shapes";
import { ETools } from "../core/types";
import type { IPoint, IPointerInfo } from "../core/types";
import { Tool } from "./Tool";

/** Arrasto menor que isso foi clique sem querer: nao cria forma. */
const MIN_SIZE = 5;

/**
 * Formas prontas. O usuario arrasta a diagonal e a forma escolhida em
 * `SharedVariables.shape` e gerada como uma lista de pontos, igual a um traco
 * a mao livre: assim ela ja nasce apagavel, selecionavel e movivel.
 */
export class ShapeTool extends Tool {
    public readonly id = ETools.Shape;

    private origin: IPoint | null = null;

    public override onPointerDown(pointer: IPointerInfo): void {
        if (pointer.button !== 0) {
            return;
        }

        this.origin = pointer.scene;
    }

    public override onPointerMove(pointer: IPointerInfo): void {
        if (!this.origin) {
            return;
        }

        const { shape, lineColor, lineThickness } = this.board.sharedVariables;
        const outline = buildShape(shape.value, this.origin, pointer.scene, pointer.constrain);

        this.board.setCurrentStroke({
            points: outline.points,
            color: lineColor.value,
            lineWidth: lineThickness.value,
            selected: false,
            smooth: false,
            closed: outline.closed,
        });
    }

    public override onPointerUp(pointer: IPointerInfo): void {
        if (this.origin && distance(pointer.scene, this.origin) >= MIN_SIZE) {
            this.board.commitStroke();
        } else {
            this.board.cancelStroke();
        }

        this.origin = null;
    }

    public override onDeactivate(): void {
        this.board.cancelStroke();
        this.origin = null;
    }
}
