import type { WhiteBoard } from "../board/WhiteBoard";
import type { ETools, IPointerInfo } from "../core/types";

/**
 * Contrato de uma ferramenta. Cada uma so reage aos eventos que lhe interessam
 * e conversa com o quadro pelos metodos publicos dele.
 */
export abstract class Tool {
    public abstract readonly id: ETools;

    protected readonly board: WhiteBoard;

    constructor(board: WhiteBoard) {
        this.board = board;
    }

    public onPointerDown(_pointer: IPointerInfo): void {}

    public onPointerMove(_pointer: IPointerInfo): void {}

    public onPointerUp(_pointer: IPointerInfo): void {}

    /** Chamado quando outra ferramenta assume, para largar qualquer gesto pela metade. */
    public onDeactivate(): void {}

    /** Raio do circulo que segue o ponteiro, ou `null` se a ferramenta nao usa. */
    public brushRadius(): number | null {
        return null;
    }
}
