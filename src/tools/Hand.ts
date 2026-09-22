import { ETools } from "../core/types";
import type { IPoint, IPointerInfo } from "../core/types";
import { Tool } from "./Tool";

export class Hand extends Tool {
    public readonly id = ETools.Hand;

    private last: IPoint | null = null;

    public override onPointerDown(pointer: IPointerInfo): void {
        this.last = pointer.screen;
    }

    public override onPointerMove(pointer: IPointerInfo): void {
        if (!this.last) {
            return;
        }

        this.board.pan(pointer.screen.x - this.last.x, pointer.screen.y - this.last.y);
        this.last = pointer.screen;
    }

    public override onPointerUp(): void {
        this.last = null;
    }

    public override onDeactivate(): void {
        this.last = null;
    }
}
