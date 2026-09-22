import { describe, expect, it } from "vitest";
import { cleanTextLines, textBaselineOffset, textFont, textLineHeight } from "../../src/core/text";

describe("cleanTextLines", () => {
    it("devolve null para texto vazio ou so com espaco", () => {
        expect(cleanTextLines("")).toBeNull();
        expect(cleanTextLines("   ")).toBeNull();
        expect(cleanTextLines("\n\n  \n")).toBeNull();
    });

    it("tira as linhas em branco das pontas", () => {
        expect(cleanTextLines("\n\nola\n\n")).toEqual(["ola"]);
    });

    it("preserva as linhas em branco do meio", () => {
        expect(cleanTextLines("um\n\ndois")).toEqual(["um", "", "dois"]);
    });

    it("preserva o recuo dentro da linha", () => {
        expect(cleanTextLines("  com recuo")).toEqual(["  com recuo"]);
    });

    it("normaliza a quebra de linha do Windows", () => {
        expect(cleanTextLines("um\r\ndois")).toEqual(["um", "dois"]);
    });
});

describe("metricas da fonte", () => {
    it("monta a string de fonte do canvas com o tamanho pedido", () => {
        expect(textFont(24)).toContain("24px");
    });

    it("a altura de linha cresce junto com o tamanho", () => {
        expect(textLineHeight(20)).toBeGreaterThan(20);
        expect(textLineHeight(40)).toBeCloseTo(textLineHeight(20) * 2);
    });
});

describe("textBaselineOffset", () => {
    it("soma metade da entrelinha ao ascent", () => {
        // fonte 20 -> caixa de linha 25; com ascent 16 e descent 4 sobram 5 de
        // entrelinha, 2.5 acima do glifo.
        expect(textBaselineOffset(20, 16, 4)).toBeCloseTo(18.5);
    });

    it("sem entrelinha sobrando, a base fica no proprio ascent", () => {
        expect(textBaselineOffset(20, 20, 5)).toBeCloseTo(20);
    });

    it("mantem o glifo centrado na caixa de linha", () => {
        const fontSize = 40;
        const ascent = 32;
        const descent = 8;
        const baseline = textBaselineOffset(fontSize, ascent, descent);

        const acima = baseline - ascent;
        const abaixo = textLineHeight(fontSize) - (baseline + descent);
        expect(acima).toBeCloseTo(abaixo);
    });
});
