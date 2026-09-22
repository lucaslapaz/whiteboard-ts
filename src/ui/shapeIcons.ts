import { EShape } from "../core/shapes";

const stroke = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

function icon(body: string): string {
    return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/** Miniatura de cada forma, no mesmo traco dos icones da barra. */
export const shapeIcons: Record<EShape, string> = {
    [EShape.Rectangle]: icon(`<rect x="3.5" y="5.5" width="17" height="13" ${stroke}/>`),
    [EShape.RoundedRectangle]: icon(`<rect x="3.5" y="5.5" width="17" height="13" rx="4" ${stroke}/>`),
    [EShape.Ellipse]: icon(`<ellipse cx="12" cy="12" rx="8.5" ry="6.5" ${stroke}/>`),
    [EShape.Triangle]: icon(`<path d="M12 5 20 19H4Z" ${stroke}/>`),
    [EShape.Diamond]: icon(`<path d="M12 4 20 12 12 20 4 12Z" ${stroke}/>`),
    [EShape.Bubble]: icon(`<path d="M20 5.5H4v9h3.5l-.5 4 5-4H20Z" ${stroke}/>`),
    [EShape.Line]: icon(`<path d="M5 19 19 5" ${stroke}/>`),
    [EShape.Arrow]: icon(`<path d="M5 19 19 5m0 0h-6m6 0v6" ${stroke}/>`),
};
