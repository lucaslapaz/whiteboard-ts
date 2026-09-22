import { distance } from "../core/geometry";
import { ETools } from "../core/types";
import type { IPoint, IPointerInfo } from "../core/types";
import { Tool } from "./Tool";

/** Distancia minima entre dois pontos gravados, para nao encher o traco de ruido. */
const MIN_POINT_DISTANCE = 2;

export class Pen extends Tool {
    public readonly id = ETools.Pen;

    private last: IPoint | null = null;

    public override onPointerDown(pointer: IPointerInfo): void {
        if (pointer.button !== 0) {
            return;
        }

        const { lineColor, lineThickness } = this.board.sharedVariables;

        this.board.setCurrentStroke({
            kind: "stroke",
            points: [pointer.scene],
            color: lineColor.value,
            lineWidth: lineThickness.value,
            selected: false,
            smooth: true,
            closed: false,
        });

        this.last = pointer.scene;
    }

    public override onPointerMove(pointer: IPointerInfo): void {
        const stroke = this.board.currentStroke;

        if (!stroke || !this.last) {
            return;
        }

        // Os primeiros pontos entram sempre, senao um traco curto nem aparece.
        if (stroke.points.length < 3 || distance(pointer.scene, this.last) > MIN_POINT_DISTANCE) {
            this.board.extendStroke(pointer.scene);
            this.last = pointer.scene;
        }
    }

    public override onPointerUp(): void {
        this.board.commitStroke();
        this.last = null;
    }

    public override onDeactivate(): void {
        if (this.board.currentStroke) {
            this.board.commitStroke();
        }

        this.last = null;
    }

    public override brushRadius(): number {
        return this.board.sharedVariables.lineThickness.value / 2;
    }
}
