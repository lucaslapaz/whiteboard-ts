import { describe, expect, it } from "vitest";
import { History } from "../../src/core/History";

describe("History", () => {
    it("comeca sem nada para desfazer", () => {
        const history = new History<string>();
        expect(history.canUndo).toBe(false);
        expect(history.undo("a")).toBeNull();
    });

    it("volta um passo de cada vez", () => {
        const history = new History<string>();

        history.record("a");
        history.record("b");

        expect(history.undo("c")).toBe("b");
        expect(history.undo("b")).toBe("a");
        expect(history.undo("a")).toBeNull();
    });

    it("refaz o que foi desfeito", () => {
        const history = new History<string>();
        history.record("a");

        expect(history.undo("b")).toBe("a");
        expect(history.canRedo).toBe(true);
        expect(history.redo("a")).toBe("b");
        expect(history.canRedo).toBe(false);
    });

    it("descarta o refazer quando surge um passo novo", () => {
        const history = new History<string>();
        history.record("a");
        history.undo("b");

        history.record("a");

        expect(history.canRedo).toBe(false);
    });

    it("agrupa num passo so tudo que acontece dentro de um gesto", () => {
        const history = new History<string>();

        history.beginGesture();
        history.record("a");
        history.record("b");
        history.record("c");
        history.endGesture();

        expect(history.undo("d")).toBe("a");
        expect(history.canUndo).toBe(false);
    });

    it("cada gesto novo vira um passo proprio", () => {
        const history = new History<string>();

        history.beginGesture();
        history.record("a");
        history.record("b");
        history.endGesture();

        history.beginGesture();
        history.record("c");
        history.endGesture();

        expect(history.undo("d")).toBe("c");
        expect(history.undo("c")).toBe("a");
    });

    it("respeita o limite de passos guardados", () => {
        const history = new History<number>(3);

        for (let i = 0; i < 10; i++) {
            history.record(i);
        }

        let steps = 0;
        let current = 10;
        while (history.canUndo) {
            current = history.undo(current) as number;
            steps++;
        }

        expect(steps).toBe(3);
        expect(current).toBe(7);
    });
});
