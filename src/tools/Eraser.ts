import { ETools } from "../core/types";
import type { IPointerInfo } from "../core/types";
import { Tool } from "./Tool";

export class Eraser extends Tool {
    public readonly id = ETools.Eraser;

    private erasing = false;

    public override onPointerDown(pointer: IPointerInfo): void {
        if (pointer.button !== 0) {
            return;
        }

        this.erasing = true;
        this.board.eraseAt(pointer.scene, this.brushRadius());
    }

    public override onPointerMove(pointer: IPointerInfo): void {
        if (this.erasing) {
            this.board.eraseAt(pointer.scene, this.brushRadius());
        }
    }

    public override onPointerUp(): void {
        this.erasing = false;
    }

    public override onDeactivate(): void {
        this.erasing = false;
    }

    public override brushRadius(): number {
        return this.board.sharedVariables.eraserThickness.value / 2;
    }
}
