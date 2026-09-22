import type { IDrawing, IPoint, ISelectionArea, IText } from "./types";

export interface IBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function distance(a: IPoint, b: IPoint): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Menor distancia entre um ponto e o segmento de reta que vai de `a` ate `b`. */
export function distanceToSegment(point: IPoint, a: IPoint, b: IPoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        return distance(point, a);
    }

    const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1);
    return distance(point, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Zero se o ponto esta dentro do retangulo, senao a distancia ate a borda. */
export function distanceToBounds(point: IPoint, bounds: IBounds): number {
    const dx = Math.max(bounds.minX - point.x, 0, point.x - bounds.maxX);
    const dy = Math.max(bounds.minY - point.y, 0, point.y - bounds.maxY);
    return Math.hypot(dx, dy);
}

export function textBounds(text: IText): IBounds {
    return {
        minX: text.position.x,
        minY: text.position.y,
        maxX: text.position.x + text.width,
        maxY: text.position.y + text.height,
    };
}

/**
 * O elemento encosta no ponto? No traco o raio cresce junto com a espessura da
 * linha, senao uma linha grossa so seria apagada bem no meio dela; no texto
 * vale a caixa que ele ocupa.
 */
export function isDrawingNearPoint(drawing: IDrawing, point: IPoint, radius: number): boolean {
    if (drawing.kind === "text") {
        return distanceToBounds(point, textBounds(drawing)) <= radius;
    }

    const { points } = drawing;
    const reach = radius + drawing.lineWidth / 2;

    if (points.length === 1) {
        return distance(points[0], point) <= reach;
    }

    for (let i = 0; i < points.length - 1; i++) {
        if (distanceToSegment(point, points[i], points[i + 1]) <= reach) {
            return true;
        }
    }

    // Forma fechada tem mais um lado, o que liga o ultimo ponto de volta ao primeiro.
    if (drawing.closed && points.length > 2) {
        return distanceToSegment(point, points[points.length - 1], points[0]) <= reach;
    }

    return false;
}

export function areaBounds(area: ISelectionArea): IBounds {
    return {
        minX: Math.min(area.start.x, area.end.x),
        minY: Math.min(area.start.y, area.end.y),
        maxX: Math.max(area.start.x, area.end.x),
        maxY: Math.max(area.start.y, area.end.y),
    };
}

/** Basta um ponto (ou um canto, no texto) dentro do retangulo para entrar na selecao. */
export function isDrawingInsideArea(drawing: IDrawing, area: ISelectionArea): boolean {
    const { minX, minY, maxX, maxY } = areaBounds(area);
    const inside = (point: IPoint): boolean =>
        point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;

    if (drawing.kind === "text") {
        const box = textBounds(drawing);
        return [
            { x: box.minX, y: box.minY },
            { x: box.maxX, y: box.minY },
            { x: box.maxX, y: box.maxY },
            { x: box.minX, y: box.maxY },
        ].some(inside);
    }

    return drawing.points.some(inside);
}

/** Desloca um elemento criando um novo, para nao estragar o historico. */
export function translateDrawing(drawing: IDrawing, deltaX: number, deltaY: number): IDrawing {
    if (drawing.kind === "text") {
        return {
            ...drawing,
            position: { x: drawing.position.x + deltaX, y: drawing.position.y + deltaY },
        };
    }

    return {
        ...drawing,
        points: drawing.points.map((point) => ({ x: point.x + deltaX, y: point.y + deltaY })),
    };
}

export function drawingBounds(drawing: IDrawing): IBounds | null {
    if (drawing.kind === "text") {
        return textBounds(drawing);
    }

    if (drawing.points.length === 0) {
        return null;
    }

    const xs = drawing.points.map((point) => point.x);
    const ys = drawing.points.map((point) => point.y);

    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    };
}

/** Retangulo que envolve tudo que esta no quadro, usado para centralizar a visao. */
export function drawingsBounds(drawings: readonly IDrawing[]): IBounds | null {
    let result: IBounds | null = null;

    for (const drawing of drawings) {
        const box = drawingBounds(drawing);

        if (!box) {
            continue;
        }

        result = result
            ? {
                  minX: Math.min(result.minX, box.minX),
                  minY: Math.min(result.minY, box.minY),
                  maxX: Math.max(result.maxX, box.maxX),
                  maxY: Math.max(result.maxY, box.maxY),
              }
            : box;
    }

    return result;
}
