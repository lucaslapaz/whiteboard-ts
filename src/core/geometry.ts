import type { IDrawing, IPoint, ISelectionArea } from "./types";

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

/**
 * O traco encosta no ponto? O raio informado cresce com a espessura da linha,
 * senao uma linha grossa so seria apagada bem no meio dela.
 */
export function isDrawingNearPoint(drawing: IDrawing, point: IPoint, radius: number): boolean {
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

/** Desloca um traco criando pontos novos, para nao estragar o historico. */
export function translateDrawing(drawing: IDrawing, deltaX: number, deltaY: number): IDrawing {
    return {
        ...drawing,
        points: drawing.points.map((point) => ({ x: point.x + deltaX, y: point.y + deltaY })),
    };
}

export function areaBounds(area: ISelectionArea): IBounds {
    return {
        minX: Math.min(area.start.x, area.end.x),
        minY: Math.min(area.start.y, area.end.y),
        maxX: Math.max(area.start.x, area.end.x),
        maxY: Math.max(area.start.y, area.end.y),
    };
}

/** Basta um ponto do traco dentro do retangulo para ele entrar na selecao. */
export function isDrawingInsideArea(drawing: IDrawing, area: ISelectionArea): boolean {
    const { minX, minY, maxX, maxY } = areaBounds(area);

    return drawing.points.some(
        (point) => point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY,
    );
}

/** Retangulo que envolve todos os tracos, usado para centralizar a visao. */
export function drawingsBounds(drawings: IDrawing[]): IBounds | null {
    let bounds: IBounds | null = null;

    for (const drawing of drawings) {
        for (const point of drawing.points) {
            if (!bounds) {
                bounds = { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y };
                continue;
            }
            bounds.minX = Math.min(bounds.minX, point.x);
            bounds.minY = Math.min(bounds.minY, point.y);
            bounds.maxX = Math.max(bounds.maxX, point.x);
            bounds.maxY = Math.max(bounds.maxY, point.y);
        }
    }

    return bounds;
}
