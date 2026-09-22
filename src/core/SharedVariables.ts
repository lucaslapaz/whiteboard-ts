import { EShape } from "./shapes";
import { Variable } from "./Variable";
import { ETools } from "./types";

/** Cor padrao da caneta em cada tema. A escura e a original do projeto. */
export const DEFAULT_INK = {
    light: "#38316d",
    dark: "#a9a2ff",
} as const;

/** Paleta rapida oferecida no popup da caneta. */
export const INK_PALETTE = [
    "#38316d",
    "#0f766e",
    "#b91c1c",
    "#b45309",
    "#15803d",
    "#1d4ed8",
    "#9333ea",
    "#111827",
] as const;

/**
 * Estado que a barra de ferramentas escreve e o quadro le. Tudo que precisa
 * avisar alguem quando muda e um `Variable`.
 */
export class SharedVariables {
    public readonly activeTool = new Variable<ETools>(ETools.Pen);
    public readonly shape = new Variable<EShape>(EShape.Rectangle);
    public readonly lineThickness = new Variable<number>(2);
    public readonly lineColor = new Variable<string>(DEFAULT_INK.light);
    public readonly eraserThickness = new Variable<number>(10);

    /**
     * Enquanto o usuario nao escolher uma cor na mao, a caneta acompanha o tema.
     */
    public inkIsDefault = true;
}
