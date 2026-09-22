/**
 * Pilha de desfazer por instantaneos.
 *
 * O quadro nunca altera a lista de tracos no lugar: ele monta uma lista nova e
 * entrega a anterior para ca. Um "gesto" agrupa varias alteracoes seguidas num
 * unico passo, senao cada pixel arrastado com a borracha viraria um `Ctrl + Z`.
 */
export class History<T> {
    private past: T[] = [];
    private future: T[] = [];

    private gestureOpen = false;
    private gestureDirty = false;

    constructor(private readonly limit: number = 100) {}

    public beginGesture(): void {
        this.gestureOpen = true;
        this.gestureDirty = false;
    }

    public endGesture(): void {
        this.gestureOpen = false;
        this.gestureDirty = false;
    }

    /** Guarda o estado que estava valendo antes da alteracao que vem a seguir. */
    public record(previous: T): void {
        if (!this.gestureOpen || !this.gestureDirty) {
            this.past.push(previous);
            this.future = [];

            if (this.past.length > this.limit) {
                this.past.shift();
            }
        }

        this.gestureDirty = this.gestureOpen;
    }

    /** Devolve o estado anterior, ou `null` se nao houver o que desfazer. */
    public undo(current: T): T | null {
        const previous = this.past.pop();

        if (previous === undefined) {
            return null;
        }

        this.future.push(current);
        return previous;
    }

    public redo(current: T): T | null {
        const next = this.future.pop();

        if (next === undefined) {
            return null;
        }

        this.past.push(current);
        return next;
    }

    public get canUndo(): boolean {
        return this.past.length > 0;
    }

    public get canRedo(): boolean {
        return this.future.length > 0;
    }
}
