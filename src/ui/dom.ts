export interface IElementProps {
    class?: string;
    text?: string;
    html?: string;
    attrs?: Record<string, string>;
}

/**
 * Acucar em cima de `document.createElement`. A interface do projeto e montada
 * em TypeScript, entao vale ter um jeito curto de descrever um elemento.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: IElementProps = {},
    children: HTMLElement[] = [],
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    if (props.class) {
        element.className = props.class;
    }

    if (props.text !== undefined) {
        element.textContent = props.text;
    }

    if (props.html !== undefined) {
        element.innerHTML = props.html;
    }

    for (const [name, value] of Object.entries(props.attrs ?? {})) {
        element.setAttribute(name, value);
    }

    for (const child of children) {
        element.appendChild(child);
    }

    return element;
}

export function requireElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error("Elemento nao encontrado na pagina: " + selector);
    }

    return element;
}
