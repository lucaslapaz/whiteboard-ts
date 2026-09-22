import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Testes de ponta a ponta do quadro.
 *
 * O estado e lido pelo hook `window.whiteboard`, que `src/main.ts` so cria em
 * modo de desenvolvimento. Tudo mais passa por mouse e teclado de verdade.
 */

interface IBoardProbe {
    total: number;
    selected: number;
    offsetX: number;
    offsetY: number;
    tool: string;
}

declare global {
    interface Window {
        whiteboard: {
            board: {
                allDrawings: Array<{
                    kind: "stroke" | "text";
                    color: string;
                    selected: boolean;
                    points: Array<{ x: number; y: number }>;
                    lines: string[];
                    position: { x: number; y: number };
                }>;
                viewport: { offsetX: number; offsetY: number };
            };
            sharedVariables: { activeTool: { value: string } };
        };
    }
}

async function probe(page: Page): Promise<IBoardProbe> {
    return page.evaluate(() => {
        const { board, sharedVariables } = window.whiteboard;

        return {
            total: board.allDrawings.length,
            selected: board.allDrawings.filter((drawing) => drawing.selected).length,
            offsetX: Math.round(board.viewport.offsetX),
            offsetY: Math.round(board.viewport.offsetY),
            tool: sharedVariables.activeTool.value,
        };
    });
}

async function firstPointOf(page: Page, index: number): Promise<{ x: number; y: number }> {
    return page.evaluate((i) => window.whiteboard.board.allDrawings[i].points[0], index);
}

async function drag(
    page: Page,
    from: [number, number],
    to: [number, number],
    modifiers: string[] = [],
): Promise<void> {
    for (const key of modifiers) {
        await page.keyboard.down(key);
    }

    await page.mouse.move(from[0], from[1]);
    await page.mouse.down();
    await page.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 5 });
    await page.mouse.move(to[0], to[1], { steps: 5 });
    await page.mouse.up();

    for (const key of modifiers) {
        await page.keyboard.up(key);
    }
}

/**
 * Clique no canvas. `page.mouse.click` nao aceita modificadores, entao as
 * teclas sao seguradas na mao em volta do clique.
 */
async function clickAt(page: Page, x: number, y: number, modifiers: string[] = []): Promise<void> {
    for (const key of modifiers) {
        await page.keyboard.down(key);
    }

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();

    for (const key of modifiers) {
        await page.keyboard.up(key);
    }
}

/** O painel fecha ao desenhar no quadro, entao reabrimos antes de escolher a forma. */
async function pickShape(page: Page, label: string): Promise<void> {
    if (!(await page.locator(".popup-shape").first().isVisible())) {
        await page.click("#shape-button");
    }

    await page.click(`.popup-shape[aria-label="${label}"]`);
}

test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.whiteboard));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.keyboard.press("Escape");
});

test("abre com o quadro vazio e a caneta ativa", async ({ page }) => {
    const state = await probe(page);

    expect(state.total).toBe(0);
    expect(state.tool).toBe("pen");
    await expect(page.locator("#pen-button")).toHaveAttribute("active", "true");
});

test("a caneta desenha e o clique seco nao cria traco", async ({ page }) => {
    await drag(page, [400, 300], [600, 400]);
    expect((await probe(page)).total).toBe(1);

    await page.mouse.move(700, 500);
    await page.mouse.down();
    await page.mouse.up();
    expect((await probe(page)).total).toBe(1);
});

test("desfaz e refaz o traco da caneta", async ({ page }) => {
    await drag(page, [400, 300], [600, 400]);

    await page.keyboard.press("Control+z");
    expect((await probe(page)).total).toBe(0);

    await page.keyboard.press("Control+y");
    expect((await probe(page)).total).toBe(1);
});

test("a borracha apaga um arrasto inteiro num unico passo de desfazer", async ({ page }) => {
    await drag(page, [300, 300], [300, 500]);
    await drag(page, [400, 300], [400, 500]);
    expect((await probe(page)).total).toBe(2);

    await page.keyboard.press("e");
    await drag(page, [300, 400], [400, 400]);
    expect((await probe(page)).total).toBe(0);

    await page.keyboard.press("Control+z");
    expect((await probe(page)).total).toBe(2);
});

test("cada forma do painel vira um desenho", async ({ page }) => {
    const labels = [
        "Retangulo",
        "Retangulo arredondado",
        "Elipse",
        "Triangulo",
        "Losango",
        "Balao de fala",
        "Linha",
        "Seta",
    ];

    await page.keyboard.press("s");

    for (const [index, label] of labels.entries()) {
        await pickShape(page, label);
        await drag(page, [500, 500], [640, 620]);
        expect((await probe(page)).total, label).toBe(index + 1);
    }
});

test("com Shift a forma fica travada em quadrado", async ({ page }) => {
    await page.keyboard.press("s");
    await pickShape(page, "Retangulo");
    await drag(page, [400, 200], [700, 380], ["Shift"]);

    const size = await page.evaluate(() => {
        const points = window.whiteboard.board.allDrawings[0].points;
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        return {
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
        };
    });

    expect(size.width).toBeCloseTo(size.height, 1);
});

test("com Shift a linha trava na horizontal, na vertical e na diagonal", async ({ page }) => {
    await page.keyboard.press("s");
    await pickShape(page, "Linha");
    await page.keyboard.press("Escape"); // fecha o painel, que cobre a esquerda do quadro

    await drag(page, [400, 200], [700, 214], ["Shift"]);
    await drag(page, [400, 260], [412, 520], ["Shift"]);
    await drag(page, [800, 200], [1040, 445], ["Shift"]);

    const lines = await page.evaluate(() =>
        window.whiteboard.board.allDrawings.map((drawing) => ({
            from: drawing.points[0],
            to: drawing.points[1],
        })),
    );

    // Horizontal e vertical saem exatas, nao viram diagonal de 45 graus.
    expect(lines[0].to.y).toBe(lines[0].from.y);
    expect(lines[1].to.x).toBe(lines[1].from.x);

    const diagonal = lines[2];
    expect(Math.abs(diagonal.to.x - diagonal.from.x)).toBeCloseTo(
        Math.abs(diagonal.to.y - diagonal.from.y),
        5,
    );
});

/** Escreve na caixa de texto aberta e encerra a edicao. */
async function typeText(page: Page, value: string): Promise<void> {
    const editor = page.locator(".text-editor");
    await editor.waitFor();
    await editor.fill(value);
    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);
}

test("a ferramenta de texto escreve no quadro", async ({ page }) => {
    await page.keyboard.press("t");
    await page.keyboard.press("Escape");

    await clickAt(page, 600, 300);
    await typeText(page, "Aprovado\nsegunda linha");

    const texts = await page.evaluate(() =>
        window.whiteboard.board.allDrawings
            .filter((drawing) => drawing.kind === "text")
            .map((drawing) => ({ lines: drawing.lines, position: drawing.position })),
    );

    expect(texts).toHaveLength(1);
    expect(texts[0].lines).toEqual(["Aprovado", "segunda linha"]);
    expect(texts[0].position).toEqual({ x: 600, y: 300 });
});

test("o texto e gravado onde foi digitado, sem subir", async ({ page }) => {
    await page.keyboard.press("t");
    await page.keyboard.press("Escape");
    await clickAt(page, 600, 300);

    const editor = page.locator(".text-editor");
    await editor.waitFor();
    await editor.fill("Hxyg");

    // A caixa de digitacao e o texto gravado precisam pintar na mesma altura.
    const clip = { x: 560, y: 270, width: 300, height: 120 };
    const editing = await page.screenshot({ clip, scale: "css" });
    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);
    const committed = await page.screenshot({ clip, scale: "css" });

    const rows = await page.evaluate(async ([a, b]) => {
        const firstInkRow = async (base64: string): Promise<number | null> => {
            const image = new Image();
            image.src = "data:image/png;base64," + base64;
            await image.decode();

            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;

            const context = canvas.getContext("2d")!;
            context.drawImage(image, 0, 0);
            const data = context.getImageData(0, 0, canvas.width, canvas.height).data;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    if (data[i] < 120 && data[i + 1] < 120 && data[i + 2] < 140) {
                        return y;
                    }
                }
            }

            return null;
        };

        return { editing: await firstInkRow(a), committed: await firstInkRow(b) };
    }, [editing.toString("base64"), committed.toString("base64")]);

    expect(rows.editing).not.toBeNull();
    expect(rows.committed).toBeCloseTo(rows.editing as number, -0.4);
});

test("texto em branco nao vira elemento", async ({ page }) => {
    await page.keyboard.press("t");
    await page.keyboard.press("Escape");

    await clickAt(page, 600, 300);
    await typeText(page, "   ");

    expect((await probe(page)).total).toBe(0);
});

test("dois cliques na selecao reabrem o texto para editar", async ({ page }) => {
    await page.keyboard.press("t");
    await page.keyboard.press("Escape");
    await clickAt(page, 600, 300);
    await typeText(page, "antes");

    await page.keyboard.press("v");
    await page.mouse.dblclick(620, 315);
    await typeText(page, "depois");

    const texts = await page.evaluate(() =>
        window.whiteboard.board.allDrawings.filter((drawing) => drawing.kind === "text").map((d) => d.lines),
    );

    // O texto foi substituido, nao duplicado.
    expect(texts).toEqual([["depois"]]);
});

test("o texto e apagavel, movivel e reversivel como qualquer traco", async ({ page }) => {
    await page.keyboard.press("t");
    await page.keyboard.press("Escape");
    await clickAt(page, 600, 300);
    await typeText(page, "rotulo");

    // move junto com a selecao
    await page.keyboard.press("v");
    await clickAt(page, 620, 315);
    expect((await probe(page)).selected).toBe(1);

    await drag(page, [620, 315], [700, 415]);
    const moved = await page.evaluate(
        () => window.whiteboard.board.allDrawings.find((d) => d.kind === "text")!.position,
    );
    expect(moved.x).toBeCloseTo(680, 0);
    expect(moved.y).toBeCloseTo(400, 0);

    // a borracha apaga
    await page.keyboard.press("e");
    await drag(page, [700, 415], [710, 415]);
    expect((await probe(page)).total).toBe(0);

    // e o Ctrl + Z traz de volta
    await page.keyboard.press("Control+z");
    expect((await probe(page)).total).toBe(1);
});

test("clique seleciona um traco e Ctrl + clique soma outros", async ({ page }) => {
    await drag(page, [300, 300], [300, 500]);
    await drag(page, [400, 300], [400, 500]);
    await drag(page, [500, 300], [500, 500]);

    await page.keyboard.press("v");

    await clickAt(page, 300, 400);
    expect((await probe(page)).selected).toBe(1);

    await clickAt(page, 400, 400, ["Control"]);
    expect((await probe(page)).selected).toBe(2);

    await clickAt(page, 500, 400, ["Control"]);
    expect((await probe(page)).selected).toBe(3);

    // Ctrl no que ja estava dentro tira da selecao.
    await clickAt(page, 400, 400, ["Control"]);
    expect((await probe(page)).selected).toBe(2);
});

test("o retangulo de selecao pega varios tracos e o Ctrl soma uma segunda passada", async ({ page }) => {
    await drag(page, [300, 300], [300, 400]);
    await drag(page, [400, 300], [400, 400]);
    await drag(page, [600, 300], [600, 400]);

    await page.keyboard.press("v");

    await drag(page, [250, 250], [450, 450]);
    expect((await probe(page)).selected).toBe(2);

    await drag(page, [550, 250], [650, 450], ["Control"]);
    expect((await probe(page)).selected).toBe(3);
});

test("arrastar um traco selecionado leva a selecao inteira junto", async ({ page }) => {
    await drag(page, [300, 300], [300, 400]);
    await drag(page, [400, 300], [400, 400]);

    await page.keyboard.press("v");
    await drag(page, [250, 250], [450, 450]);
    expect((await probe(page)).selected).toBe(2);

    const before = [await firstPointOf(page, 0), await firstPointOf(page, 1)];
    await drag(page, [300, 350], [360, 450]);
    const after = [await firstPointOf(page, 0), await firstPointOf(page, 1)];

    for (let i = 0; i < 2; i++) {
        expect(after[i].x - before[i].x).toBeCloseTo(60, 0);
        expect(after[i].y - before[i].y).toBeCloseTo(100, 0);
    }
});

test("o arrasto inteiro da selecao volta com um unico Ctrl + Z", async ({ page }) => {
    await drag(page, [300, 300], [300, 400]);

    await page.keyboard.press("v");
    await clickAt(page, 300, 350);

    const before = await firstPointOf(page, 0);
    await drag(page, [300, 350], [420, 470]);
    expect((await firstPointOf(page, 0)).x).not.toBeCloseTo(before.x, 0);

    await page.keyboard.press("Control+z");
    const restored = await firstPointOf(page, 0);
    expect(restored.x).toBeCloseTo(before.x, 0);
    expect(restored.y).toBeCloseTo(before.y, 0);
});

test("clicar no vazio limpa a selecao e Delete apaga o que estava marcado", async ({ page }) => {
    await drag(page, [300, 300], [300, 400]);
    await drag(page, [500, 300], [500, 400]);

    await page.keyboard.press("v");
    await clickAt(page, 300, 350);
    expect((await probe(page)).selected).toBe(1);

    await clickAt(page, 900, 650);
    expect((await probe(page)).selected).toBe(0);

    await clickAt(page, 500, 350);
    await page.keyboard.press("Delete");

    const state = await probe(page);
    expect(state.total).toBe(1);
    expect(state.selected).toBe(0);
});

test("a mao, as setas e a roda arrastam a visao, e o F recentraliza", async ({ page }) => {
    await drag(page, [400, 300], [500, 400]);

    await page.keyboard.press("h");
    await drag(page, [600, 600], [500, 500]);

    let state = await probe(page);
    expect(state.offsetX).toBeCloseTo(-100, -1);
    expect(state.offsetY).toBeCloseTo(-100, -1);

    await page.keyboard.press("ArrowLeft");
    expect((await probe(page)).offsetX).toBeGreaterThan(state.offsetX);

    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 120);
    expect((await probe(page)).offsetY).toBeLessThan(0);

    await page.keyboard.press("f");
    state = await probe(page);
    // O traco fica no meio da tela depois de centralizar.
    expect(state.offsetX).toBeCloseTo(190, -1);
});

test("a barra troca de ferramenta e o painel abre e fecha no mesmo botao", async ({ page }) => {
    await page.click("#eraser-button");
    expect((await probe(page)).tool).toBe("eraser");
    await expect(page.locator(".tool-popup")).toBeVisible();

    await page.click("#eraser-button");
    await expect(page.locator(".tool-popup")).toHaveCount(0);

    await page.click("#hand-button");
    expect((await probe(page)).tool).toBe("hand");
    await expect(page.locator(".tool-popup")).toHaveCount(0);
});

test("a cor escolhida na paleta e usada no traco seguinte", async ({ page }) => {
    await page.click("#pen-button");
    await page.click('.popup-swatch[title="#b91c1c"]');
    await drag(page, [400, 300], [600, 400]);

    const color = await page.evaluate(() => window.whiteboard.board.allDrawings[0].color);
    expect(color).toBe("#b91c1c");
});

test("o botao de tema alterna claro e escuro e o quadro continua desenhando", async ({ page }) => {
    const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
    const before = await theme();

    await page.click("#theme-button");
    expect(await theme()).not.toBe(before);

    await drag(page, [400, 300], [600, 400]);
    expect((await probe(page)).total).toBe(1);
});

test("limpar o quadro apaga tudo e pode ser desfeito", async ({ page }) => {
    await drag(page, [300, 300], [400, 400]);
    await drag(page, [500, 300], [600, 400]);

    await page.click("#clear-button");
    expect((await probe(page)).total).toBe(0);

    await page.keyboard.press("Control+z");
    expect((await probe(page)).total).toBe(2);
});

test("o painel de atalhos abre pela tecla ? e pelo botao", async ({ page }) => {
    const card = page.locator(".hints-card");
    await expect(card).toBeHidden();

    await page.keyboard.press("?");
    await expect(card).toBeVisible();
    await expect(card.locator(".hints-row")).not.toHaveCount(0);

    await page.click(".hints-toggle");
    await expect(card).toBeHidden();
});

test("exportar gera um PNG para download", async ({ page }) => {
    await drag(page, [400, 300], [600, 400]);

    const download = page.waitForEvent("download");
    await page.click("#export-button");

    expect((await download).suggestedFilename()).toMatch(/^whiteboard-\d{4}-\d{2}-\d{2}\.png$/);
});
