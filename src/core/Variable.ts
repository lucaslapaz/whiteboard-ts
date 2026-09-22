export type VariableListener<T> = (value: T) => void;

/**
 * Um valor observavel que sabe se manter em sincronia com elementos da pagina.
 *
 * - `associateElement` liga o valor a um elemento: `<input>` vira via de mao
 *   dupla (digitou, o valor muda; mudou o valor, o input acompanha) e qualquer
 *   outro elemento so exibe o valor como texto.
 * - `addListener` avisa quem precisa reagir a mudanca, ja com o valor atual.
 */
export class Variable<T extends string | number> {
    private _value: T;
    private associates: HTMLElement[] = [];
    private listeners: VariableListener<T>[] = [];

    constructor(value: T) {
        this._value = value;
    }

    public associateElement(element: HTMLElement): void {
        this.associates.push(element);

        if (element instanceof HTMLInputElement) {
            element.addEventListener("input", () => {
                this.value = this.parse(element.value);
            });
        }

        this.render(element, this._value);
    }

    /** Registra um observador e devolve a funcao que o remove. */
    public addListener(listener: VariableListener<T>): () => void {
        this.listeners.push(listener);
        listener(this._value);

        return () => {
            this.listeners = this.listeners.filter((current) => current !== listener);
        };
    }

    public get value(): T {
        return this._value;
    }

    public set value(value: T) {
        if (value === this._value) {
            return;
        }

        this._value = value;

        for (const element of this.associates) {
            this.render(element, value);
        }

        for (const listener of this.listeners) {
            listener(value);
        }
    }

    /** Um `<input>` sempre devolve string, entao mantemos o tipo do valor inicial. */
    private parse(raw: string): T {
        return (typeof this._value === "number" ? Number(raw) : raw) as T;
    }

    private render(element: HTMLElement, value: T): void {
        if (element instanceof HTMLInputElement) {
            element.value = String(value);
        } else {
            element.textContent = String(value);
        }
    }
}
