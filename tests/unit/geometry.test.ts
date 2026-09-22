import { describe, expect, it } from "vitest";
import {
    areaBounds,
    distanceToSegment,
    drawingsBounds,
    isDrawingInsideArea,
    isDrawingNearPoint,
    translateDrawing,
} from "../../src/core/geometry";
import type { IPoint, IStroke, IText } from "../../src/core/types";

function drawing(points: IPoint[], extra: Partial<IStroke> = {}): IStroke {
    return {
        kind: "stroke",
        points,
        color: "#000000",
        lineWidth: 2,
        selected: false,
        smooth: true,
        closed: false,
        ...extra,
    };
}

function text(position: IPoint, extra: Partial<IText> = {}): IText {
    return {
        kind: "text",
        position,
        lines: ["ola"],
        fontSize: 20,
        color: "#000000",
        selected: false,
        width: 60,
        height: 25,
        ...extra,
    };
}

describe("distanceToSegment", () => {
    it("devolve zero para um ponto em cima do segmento", () => {
        expect(distanceToSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
    });

    it("mede a perpendicular quando a projecao cai dentro do segmento", () => {
        expect(distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3);
    });

    it("usa a ponta mais proxima quando a projecao cai fora", () => {
        expect(distanceToSegment({ x: -4, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(4);
        expect(distanceToSegment({ x: 14, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(4);
    });

    it("aguenta um segmento degenerado, com os dois pontos no mesmo lugar", () => {
        expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
    });
});

describe("isDrawingNearPoint", () => {
    const line = drawing([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
    ]);

    it("encosta dentro do raio e nao encosta fora dele", () => {
        expect(isDrawingNearPoint(line, { x: 50, y: 5 }, 5)).toBe(true);
        expect(isDrawingNearPoint(line, { x: 50, y: 20 }, 5)).toBe(false);
    });

    it("cresce o alcance junto com a espessura da linha", () => {
        const thick = drawing(line.points, { lineWidth: 20 });
        expect(isDrawingNearPoint(thick, { x: 50, y: 14 }, 5)).toBe(true);
    });

    it("considera o lado que fecha uma forma", () => {
        const square = drawing(
            [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 10 },
                { x: 0, y: 10 },
            ],
            { closed: true, smooth: false },
        );

        // O lado esquerdo so existe porque a forma e fechada.
        expect(isDrawingNearPoint(square, { x: 0, y: 5 }, 1)).toBe(true);
        expect(isDrawingNearPoint({ ...square, closed: false }, { x: 0, y: 5 }, 1)).toBe(false);
    });

    it("trata um traco de um ponto so", () => {
        const dot = drawing([{ x: 10, y: 10 }]);
        expect(isDrawingNearPoint(dot, { x: 12, y: 10 }, 3)).toBe(true);
        expect(isDrawingNearPoint(dot, { x: 30, y: 10 }, 3)).toBe(false);
    });
});

describe("texto", () => {
    const label = text({ x: 100, y: 100 }); // caixa de 100,100 ate 160,125

    it("encosta quando o ponto cai dentro da caixa", () => {
        expect(isDrawingNearPoint(label, { x: 130, y: 110 }, 0)).toBe(true);
    });

    it("encosta quando o ponto esta perto da borda, dentro do raio", () => {
        expect(isDrawingNearPoint(label, { x: 165, y: 110 }, 6)).toBe(true);
        expect(isDrawingNearPoint(label, { x: 200, y: 110 }, 6)).toBe(false);
    });

    it("entra na selecao quando um canto cai no retangulo", () => {
        const area = { start: { x: 150, y: 118 }, end: { x: 400, y: 400 }, lineWidth: 1 };
        expect(isDrawingInsideArea(label, area)).toBe(true);
    });

    it("fica de fora quando o retangulo nao alcanca nenhum canto", () => {
        const area = { start: { x: 300, y: 300 }, end: { x: 400, y: 400 }, lineWidth: 1 };
        expect(isDrawingInsideArea(label, area)).toBe(false);
    });

    it("anda pela posicao, sem mexer no original", () => {
        const moved = translateDrawing(label, 10, -20);

        expect(moved.kind).toBe("text");
        expect((moved as IText).position).toEqual({ x: 110, y: 80 });
        expect(label.position).toEqual({ x: 100, y: 100 });
    });

    it("entra na conta dos limites do quadro junto com os tracos", () => {
        const bounds = drawingsBounds([
            drawing([
                { x: 0, y: 0 },
                { x: 10, y: 10 },
            ]),
            label,
        ]);

        expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 160, maxY: 125 });
    });
});

describe("area de selecao", () => {
    it("normaliza o retangulo desenhado de tras para frente", () => {
        expect(areaBounds({ start: { x: 10, y: 20 }, end: { x: 0, y: 5 }, lineWidth: 1 })).toEqual({
            minX: 0,
            minY: 5,
            maxX: 10,
            maxY: 20,
        });
    });

    it("basta um ponto dentro para o traco entrar na selecao", () => {
        const area = { start: { x: 0, y: 0 }, end: { x: 10, y: 10 }, lineWidth: 1 };

        const crossing = drawing([
            { x: 5, y: 5 },
            { x: 500, y: 500 },
        ]);
        const outside = drawing([
            { x: 50, y: 50 },
            { x: 60, y: 60 },
        ]);

        expect(isDrawingInsideArea(crossing, area)).toBe(true);
        expect(isDrawingInsideArea(outside, area)).toBe(false);
    });
});

describe("translateDrawing", () => {
    it("devolve um traco novo, sem mexer no original", () => {
        const original = drawing([
            { x: 0, y: 0 },
            { x: 10, y: 10 },
        ]);

        const moved = translateDrawing(original, 5, -5) as IStroke;

        expect(moved.points).toEqual([
            { x: 5, y: -5 },
            { x: 15, y: 5 },
        ]);
        expect(original.points[0]).toEqual({ x: 0, y: 0 });
        expect(moved.points[0]).not.toBe(original.points[0]);
    });
});

describe("drawingsBounds", () => {
    it("envolve todos os tracos", () => {
        const bounds = drawingsBounds([
            drawing([
                { x: 0, y: 0 },
                { x: 10, y: 4 },
            ]),
            drawing([
                { x: -5, y: 20 },
                { x: 3, y: 1 },
            ]),
        ]);

        expect(bounds).toEqual({ minX: -5, minY: 0, maxX: 10, maxY: 20 });
    });

    it("devolve null quando o quadro esta vazio", () => {
        expect(drawingsBounds([])).toBeNull();
    });
});
