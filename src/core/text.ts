/**
 * O texto e desenhado no canvas mas editado num `<textarea>` por cima dele.
 * Para os dois baterem, a fonte e a altura de linha ficam definidas aqui e sao
 * usadas pelos dois lados.
 */
export const TEXT_FONT_FAMILY = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

export const TEXT_LINE_HEIGHT = 1.25;

export function textFont(fontSize: number): string {
    return fontSize + "px " + TEXT_FONT_FAMILY;
}

export function textLineHeight(fontSize: number): number {
    return fontSize * TEXT_LINE_HEIGHT;
}

/**
 * Onde fica a linha de base da primeira linha, contando do topo da caixa.
 *
 * O `<textarea>` centraliza o glifo dentro da caixa de linha usando a altura
 * real da fonte (`ascent + descent`), que nao e o mesmo que o `font-size`. Sem
 * repetir essa conta, o texto desenhado no canvas sobe alguns pixels em relacao
 * ao que estava sendo digitado. As metricas vem do proprio canvas.
 */
export function textBaselineOffset(fontSize: number, ascent: number, descent: number): number {
    const halfLeading = (textLineHeight(fontSize) - (ascent + descent)) / 2;
    return halfLeading + ascent;
}

/**
 * Tira as linhas vazias das pontas e devolve `null` se nao sobrou nada, que e
 * como um texto em branco acaba descartado em vez de virar um elemento invisivel.
 */
export function cleanTextLines(raw: string): string[] | null {
    const lines = raw.replace(/\r/g, "").split("\n");

    while (lines.length > 0 && lines[0].trim() === "") {
        lines.shift();
    }

    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
    }

    return lines.length > 0 ? lines : null;
}
