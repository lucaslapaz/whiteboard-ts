import { describe, expect, it } from "vitest";
import { buildShape, EShape } from "../../src/core/shapes";
import type { IPoint } from "../../src/core/types";

const start: IPoint = { x: 100, y: 50 };
const end: IPoint = { x: 300, y: 150 };

function bounds(points: IPoint[]) {
    return {
        minX: Math.min(...points.map((p) => p.x)),
        minY: Math.min(...points.map((p) => p.y)),
        maxX: Math.max(...points.map((p) => p.x)),
        maxY: Math.max(...points.map((p) => p.y)),
    };
}

describe("buildShape", () => {
    it("gera todas as formas do painel", () => {
        for (const kind of Object.values(EShape)) {
            const outline = buildShape(kind, start, end);
            expect(outline.points.length, kind).toBeGreaterThanOrEqual(2);
        }
    });

    it("mantem a forma dentro do retangulo arrastado", () => {
        for (const kind of [
            EShape.Rectangle,
            EShape.RoundedRectangle,
            EShape.Ellipse,
            EShape.Triangle,
            EShape.Diamond,
            EShape.Bubble,
        ]) {
            const box = bounds(buildShape(kind, start, end).points);

            expect(box.minX, kind).toBeGreaterThanOrEqual(start.x - 0.001);
            expect(box.minY, kind).toBeGreaterThanOrEqual(start.y - 0.001);
            expect(box.maxX, kind).toBeLessThanOrEqual(end.x + 0.001);
            expect(box.maxY, kind).toBeLessThanOrEqual(end.y + 0.001);
        }
    });

    it("funciona com o arrasto feito de tras para frente", () => {
        const box = bounds(buildShape(EShape.Rectangle, end, start).points);
        expect(box).toEqual({ minX: 100, minY: 50, maxX: 300, maxY: 150 });
    });

    it("fecha o contorno das formas fechadas e deixa linha e seta abertas", () => {
        expect(buildShape(EShape.Rectangle, start, end).closed).toBe(true);
        expect(buildShape(EShape.Ellipse, start, end).closed).toBe(true);
        expect(buildShape(EShape.Line, start, end).closed).toBe(false);
        expect(buildShape(EShape.Arrow, start, end).closed).toBe(false);
    });

    it("o retangulo tem exatamente quatro cantos", () => {
        expect(buildShape(EShape.Rectangle, start, end).points).toEqual([
            { x: 100, y: 50 },
            { x: 300, y: 50 },
            { x: 300, y: 150 },
            { x: 100, y: 150 },
        ]);
    });

    it("com Shift o retangulo vira quadrado", () => {
        const box = bounds(buildShape(EShape.Rectangle, start, end, true).points);
        expect(box.maxX - box.minX).toBeCloseTo(box.maxY - box.minY);
    });

    it("o quadrado travado respeita o sentido do arrasto", () => {
        const box = bounds(buildShape(EShape.Rectangle, { x: 300, y: 150 }, { x: 100, y: 50 }, true).points);
        expect(box.maxX).toBe(300);
        expect(box.maxY).toBe(150);
        expect(box.maxX - box.minX).toBeCloseTo(box.maxY - box.minY);
    });

    it("a linha usa os dois pontos do arrasto", () => {
        expect(buildShape(EShape.Line, start, end).points).toEqual([start, end]);
    });

    describe("com Shift, a linha trava no angulo de 45 mais perto", () => {
        const origin: IPoint = { x: 100, y: 100 };

        const cases: Array<[string, IPoint, IPoint]> = [
            ["horizontal para a direita", { x: 200, y: 108 }, { x: 200.32, y: 100 }],
            ["horizontal para a esquerda", { x: 10, y: 95 }, { x: 9.86, y: 100 }],
            ["vertical para baixo", { x: 104, y: 260 }, { x: 100, y: 260.05 }],
            ["vertical para cima", { x: 97, y: 20 }, { x: 100, y: 19.94 }],
            ["diagonal", { x: 200, y: 205 }, { x: 202.5, y: 202.5 }],
        ];

        for (const [name, dragged, expected] of cases) {
            it(name, () => {
                const [, tip] = buildShape(EShape.Line, origin, dragged, true).points;
                expect(tip.x).toBeCloseTo(expected.x, 1);
                expect(tip.y).toBeCloseTo(expected.y, 1);
            });
        }

        it("a horizontal e a vertical saem exatas, sem sobra de arredondamento", () => {
            const horizontal = buildShape(EShape.Line, origin, { x: 300, y: 112 }, true).points[1];
            const vertical = buildShape(EShape.Line, origin, { x: 92, y: 300 }, true).points[1];

            expect(horizontal.y).toBe(100);
            expect(vertical.x).toBe(100);
        });

        it("mantem o comprimento do arrasto", () => {
            const dragged = { x: 240, y: 190 };
            const [, tip] = buildShape(EShape.Line, origin, dragged, true).points;

            expect(Math.hypot(tip.x - origin.x, tip.y - origin.y)).toBeCloseTo(
                Math.hypot(dragged.x - origin.x, dragged.y - origin.y),
                5,
            );
        });

        it("vale tambem para a seta", () => {
            const points = buildShape(EShape.Arrow, origin, { x: 300, y: 108 }, true).points;
            expect(points[1].y).toBe(100);
        });
    });

    it("a seta comeca na origem e passa pela ponta", () => {
        const points = buildShape(EShape.Arrow, start, end).points;
        expect(points[0]).toEqual(start);
        expect(points[1]).toEqual(end);
        expect(points.length).toBe(5);
    });

    it("o balao desce abaixo do corpo por causa do rabinho", () => {
        const points = buildShape(EShape.Bubble, start, end).points;
        const tail = points.filter((point) => point.y > 140);
        expect(tail.length).toBe(1);
    });
});
