import { beforeEach, describe, expect, it, vi } from "vitest";
import { Variable } from "../../src/core/Variable";

describe("Variable", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("guarda e devolve o valor", () => {
        expect(new Variable<string>("azul").value).toBe("azul");
    });

    it("avisa o ouvinte na hora em que ele entra e a cada mudanca", () => {
        const variable = new Variable<number>(1);
        const seen: number[] = [];

        variable.addListener((value) => seen.push(value));
        variable.value = 2;
        variable.value = 3;

        expect(seen).toEqual([1, 2, 3]);
    });

    it("nao avisa quando o valor e o mesmo", () => {
        const variable = new Variable<string>("a");
        const listener = vi.fn();

        variable.addListener(listener);
        variable.value = "a";

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("remove o ouvinte quando a funcao devolvida e chamada", () => {
        const variable = new Variable<number>(0);
        const listener = vi.fn();

        const unsubscribe = variable.addListener(listener);
        unsubscribe();
        variable.value = 5;

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("escreve o valor no texto de um elemento comum", () => {
        const variable = new Variable<number>(7);
        const paragraph = document.createElement("p");

        variable.associateElement(paragraph);
        expect(paragraph.textContent).toBe("7");

        variable.value = 9;
        expect(paragraph.textContent).toBe("9");
    });

    it("liga um input nos dois sentidos", () => {
        const variable = new Variable<string>("#ff0000");
        const input = document.createElement("input");

        variable.associateElement(input);
        expect(input.value).toBe("#ff0000");

        input.value = "#00ff00";
        input.dispatchEvent(new Event("input"));
        expect(variable.value).toBe("#00ff00");

        variable.value = "#0000ff";
        expect(input.value).toBe("#0000ff");
    });

    it("mantem numero como numero ao ler o input, que sempre devolve texto", () => {
        const variable = new Variable<number>(2);
        const input = document.createElement("input");

        variable.associateElement(input);
        input.value = "12";
        input.dispatchEvent(new Event("input"));

        expect(variable.value).toBe(12);
        expect(typeof variable.value).toBe("number");
    });

    it("mantem varios elementos em sincronia", () => {
        const variable = new Variable<number>(3);
        const input = document.createElement("input");
        const label = document.createElement("span");

        variable.associateElement(input);
        variable.associateElement(label);

        input.value = "8";
        input.dispatchEvent(new Event("input"));

        expect(label.textContent).toBe("8");
    });
});
