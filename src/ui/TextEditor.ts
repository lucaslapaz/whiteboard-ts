import { textFont, textLineHeight } from "../core/text";
import type { ITextEditor, ITextEditorRequest } from "../board/WhiteBoard";
import { el } from "./dom";

/**
 * Caixa de digitacao que aparece por cima do canvas.
 *
 * Desenhar texto direto no canvas obrigaria a reimplementar cursor, selecao e
 * teclado virtual. Em vez disso o texto e editado num `<textarea>` de verdade,
 * com a mesma fonte do canvas, e so vira desenho quando a edicao termina.
 */
export class TextEditor implements ITextEditor {
    private readonly parent: HTMLElement;
    private readonly element: HTMLTextAreaElement;

    private request: ITextEditorRequest | null = null;
    /** Evita que o `blur` disparado pelo proprio fechamento reentre no commit. */
    private closing = false;

    constructor(parent: HTMLElement) {
        this.parent = parent;
        this.element = el("textarea", {
            class: "text-editor",
            attrs: {
                spellcheck: "false",
                autocomplete: "off",
                "aria-label": "Texto do quadro",
            },
        });

        this.element.addEventListener("input", () => this.fitToContent());
        this.element.addEventListener("blur", () => this.commit());
        this.element.addEventListener("keydown", this.onKeyDown);
        // O quadro nao deve reagir ao ponteiro enquanto o texto esta sendo escrito.
        this.element.addEventListener("pointerdown", (event) => event.stopPropagation());
    }

    public get isOpen(): boolean {
        return this.request !== null;
    }

    public open(request: ITextEditorRequest): void {
        this.close();
        this.request = request;

        this.element.value = request.lines.join("\n");
        this.element.style.left = request.screen.x + "px";
        this.element.style.top = request.screen.y + "px";
        this.element.style.font = textFont(request.fontSize);
        this.element.style.lineHeight = textLineHeight(request.fontSize) + "px";
        this.element.style.color = request.color;

        this.parent.appendChild(this.element);
        this.fitToContent();

        // O foco espera o quadro seguinte: o comportamento padrao do clique que
        // abriu a caixa ainda vai mexer no foco, e roubaria o nosso.
        requestAnimationFrame(() => {
            if (this.request !== request) {
                return;
            }

            this.element.focus();
            this.element.setSelectionRange(this.element.value.length, this.element.value.length);
        });
    }

    /** Fecha sem gravar. Quem grava e o `commit`, chamado pelo `blur` ou pelo Esc. */
    public close(): void {
        if (!this.request) {
            return;
        }

        const request = this.request;
        this.request = null;
        this.closing = true;
        this.element.remove();
        this.closing = false;

        request.onCancel();
    }

    private commit(): void {
        if (!this.request || this.closing) {
            return;
        }

        const request = this.request;
        const value = this.element.value;

        this.request = null;
        this.closing = true;
        this.element.remove();
        this.closing = false;

        request.onCommit(value);
    }

    private onKeyDown = (event: KeyboardEvent): void => {
        // Esc e Ctrl + Enter encerram a edicao; Enter sozinho quebra a linha.
        if (event.key === "Escape" || (event.key === "Enter" && (event.ctrlKey || event.metaKey))) {
            event.preventDefault();
            event.stopPropagation();
            this.commit();
            return;
        }

        // As demais teclas sao texto, nao atalho do quadro.
        event.stopPropagation();
    };

    /** Cresce com o conteudo, para a caixa nunca ter barra de rolagem. */
    private fitToContent(): void {
        this.element.style.width = "0px";
        this.element.style.width = this.element.scrollWidth + 2 + "px";
        this.element.style.height = "0px";
        this.element.style.height = this.element.scrollHeight + "px";
    }
}
