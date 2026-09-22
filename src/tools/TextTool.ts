import { ETools } from "../core/types";
import type { IPointerInfo } from "../core/types";
import { Tool } from "./Tool";

/**
 * Clique no vazio para escrever um texto novo, ou em cima de um texto que ja
 * existe para reabri-lo. O que digita e a caixa de edicao; esta ferramenta so
 * decide onde ela abre.
 */
export class TextTool extends Tool {
    public readonly id = ETools.Text;

    public override onPointerDown(pointer: IPointerInfo): void {
        if (pointer.button !== 0 || this.board.isEditingText) {
            return;
        }

        const hit = this.board.hitTest(pointer.scene);

        if (hit && hit.kind === "text") {
            this.board.editText(hit.position, hit);
        } else {
            this.board.editText(pointer.scene);
        }
    }
}
