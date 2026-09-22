import type { IPoint } from "./types";

export enum EShape {
    Rectangle = "rectangle",
    RoundedRectangle = "rounded-rectangle",
    Ellipse = "ellipse",
    Triangle = "triangle",
    Diamond = "diamond",
    Bubble = "bubble",
    Line = "line",
    Arrow = "arrow",
}

export interface IShapeOutline {
    points: IPoint[];
    closed: boolean;
}

/** Quantos pontos usamos para desenhar uma volta inteira de elipse. */
const ELLIPSE_STEPS = 64;
const ARC_STEPS = 6;
const CORNER_RATIO = 0.22;
const MAX_CORNER = 26;

/**
 * Monta o contorno de uma forma a partir do retangulo que o usuario arrastou.
 * Devolve sempre uma lista de pontos, que e o unico formato que o quadro conhece.
 */
export function buildShape(kind: EShape, start: IPoint, end: IPoint, constrain = false): IShapeOutline {
    const corners = constrain ? constrainDrag(kind, start, end) : { start, end };
    const minX = Math.min(corners.start.x, corners.end.x);
    const maxX = Math.max(corners.start.x, corners.end.x);
    const minY = Math.min(corners.start.y, corners.end.y);
    const maxY = Math.max(corners.start.y, corners.end.y);

    switch (kind) {
        case EShape.Rectangle:
            return {
                closed: true,
                points: [
                    { x: minX, y: minY },
                    { x: maxX, y: minY },
                    { x: maxX, y: maxY },
                    { x: minX, y: maxY },
                ],
            };

        case EShape.RoundedRectangle:
            return { closed: true, points: roundedRect(minX, minY, maxX, maxY) };

        case EShape.Ellipse:
            return { closed: true, points: ellipse(minX, minY, maxX, maxY) };

        case EShape.Triangle:
            return {
                closed: true,
                points: [
                    { x: (minX + maxX) / 2, y: minY },
                    { x: maxX, y: maxY },
                    { x: minX, y: maxY },
                ],
            };

        case EShape.Diamond:
            return {
                closed: true,
                points: [
                    { x: (minX + maxX) / 2, y: minY },
                    { x: maxX, y: (minY + maxY) / 2 },
                    { x: (minX + maxX) / 2, y: maxY },
                    { x: minX, y: (minY + maxY) / 2 },
                ],
            };

        case EShape.Bubble:
            return { closed: true, points: bubble(minX, minY, maxX, maxY) };

        case EShape.Line:
            return { closed: false, points: [corners.start, corners.end] };

        case EShape.Arrow:
            return { closed: false, points: arrow(corners.start, corners.end) };
    }
}

/**
 * O que a tecla Shift faz depende da forma: numa caixa ela iguala os lados,
 * numa linha ou seta ela trava o angulo. Travar o angulo de uma linha com a
 * regra do quadrado so daria diagonais, nunca uma reta na horizontal.
 */
function constrainDrag(kind: EShape, start: IPoint, end: IPoint): { start: IPoint; end: IPoint } {
    if (kind === EShape.Line || kind === EShape.Arrow) {
        return { start, end: snapToAngle(start, end) };
    }

    return squared(start, end);
}

/** As oito direcoes do Shift: horizontal, vertical e as quatro diagonais. */
const SNAP_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
];

/** Mantem o comprimento do arrasto, mas gira a ponta para o angulo de 45 mais perto. */
function snapToAngle(start: IPoint, end: IPoint): IPoint {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.hypot(deltaX, deltaY);

    if (length === 0) {
        return end;
    }

    const step = Math.PI / 4;
    const index = ((Math.round(Math.atan2(deltaY, deltaX) / step) % 8) + 8) % 8;
    const [dirX, dirY] = SNAP_DIRECTIONS[index];
    const norm = Math.hypot(dirX, dirY);

    return {
        x: start.x + (dirX / norm) * length,
        y: start.y + (dirY / norm) * length,
    };
}

/** Com Shift, o retangulo vira quadrado mantendo o canto de origem. */
function squared(start: IPoint, end: IPoint): { start: IPoint; end: IPoint } {
    const side = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));

    return {
        start,
        end: {
            x: start.x + Math.sign(end.x - start.x || 1) * side,
            y: start.y + Math.sign(end.y - start.y || 1) * side,
        },
    };
}

function cornerRadius(width: number, height: number): number {
    return Math.min(MAX_CORNER, width * CORNER_RATIO, height * CORNER_RATIO);
}

/** Um pedaco de circunferencia amostrado em pontos, no sentido horario da tela. */
function arc(centerX: number, centerY: number, radius: number, from: number, to: number): IPoint[] {
    const points: IPoint[] = [];

    for (let step = 0; step <= ARC_STEPS; step++) {
        const angle = from + ((to - from) * step) / ARC_STEPS;
        points.push({ x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
    }

    return points;
}

function roundedRect(minX: number, minY: number, maxX: number, maxY: number): IPoint[] {
    const radius = cornerRadius(maxX - minX, maxY - minY);

    if (radius <= 0.5) {
        return [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
        ];
    }

    return [
        ...arc(minX + radius, minY + radius, radius, Math.PI, Math.PI * 1.5),
        ...arc(maxX - radius, minY + radius, radius, Math.PI * 1.5, Math.PI * 2),
        ...arc(maxX - radius, maxY - radius, radius, 0, Math.PI * 0.5),
        ...arc(minX + radius, maxY - radius, radius, Math.PI * 0.5, Math.PI),
    ];
}

function ellipse(minX: number, minY: number, maxX: number, maxY: number): IPoint[] {
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = (maxX - minX) / 2;
    const radiusY = (maxY - minY) / 2;
    const points: IPoint[] = [];

    for (let step = 0; step < ELLIPSE_STEPS; step++) {
        const angle = (Math.PI * 2 * step) / ELLIPSE_STEPS;
        points.push({ x: centerX + Math.cos(angle) * radiusX, y: centerY + Math.sin(angle) * radiusY });
    }

    return points;
}

/** Retangulo arredondado com um rabinho apontando para baixo e para a esquerda. */
function bubble(minX: number, minY: number, maxX: number, maxY: number): IPoint[] {
    const width = maxX - minX;
    const height = maxY - minY;
    const bodyBottom = maxY - height * 0.24;
    const radius = cornerRadius(width, bodyBottom - minY);

    const tailRight = minX + width * 0.42;
    const tailLeft = minX + width * 0.26;
    const tailTip = minX + width * 0.2;

    return [
        ...arc(minX + radius, minY + radius, radius, Math.PI, Math.PI * 1.5),
        ...arc(maxX - radius, minY + radius, radius, Math.PI * 1.5, Math.PI * 2),
        ...arc(maxX - radius, bodyBottom - radius, radius, 0, Math.PI * 0.5),
        { x: Math.max(tailRight, minX + radius), y: bodyBottom },
        { x: tailTip, y: maxY },
        { x: Math.max(tailLeft, minX + radius), y: bodyBottom },
        ...arc(minX + radius, bodyBottom - radius, radius, Math.PI * 0.5, Math.PI),
    ];
}

/**
 * Seta desenhada como um traco unico: vai ate a ponta, volta um pouco para uma
 * aba, retorna a ponta e sai para a outra. Assim continua sendo uma polilinha.
 */
function arrow(start: IPoint, end: IPoint): IPoint[] {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const head = Math.min(18, length * 0.3);
    const spread = Math.PI / 7;

    const wing = (direction: number): IPoint => ({
        x: end.x - Math.cos(angle + direction * spread) * head,
        y: end.y - Math.sin(angle + direction * spread) * head,
    });

    return [start, end, wing(1), end, wing(-1)];
}
