export interface IPoint {
    x: number;
    y: number;
}

interface IElementBase {
    color: string;
    selected: boolean;
}

/**
 * Traco: rabisco a mao livre ou forma pronta. Os dois sao a mesma coisa, uma
 * lista de pontos; muda so como os pontos foram gerados e como sao ligados.
 */
export interface IStroke extends IElementBase {
    kind: "stroke";
    points: IPoint[];
    lineWidth: number;
    /** Traco a mao passa pelo suavizador; forma pronta ja vem com os pontos certos. */
    smooth: boolean;
    /** Liga o ultimo ponto ao primeiro para fechar o contorno. */
    closed: boolean;
}

/**
 * Texto. A largura e a altura sao medidas na hora de gravar e ficam guardadas
 * aqui, para o resto do programa calcular colisao e limites sem precisar de um
 * contexto de canvas.
 */
export interface IText extends IElementBase {
    kind: "text";
    /** Canto superior esquerdo da primeira linha. */
    position: IPoint;
    lines: string[];
    fontSize: number;
    width: number;
    height: number;
}

/** Tudo que existe no quadro. */
export type IDrawing = IStroke | IText;

export interface ISelectionArea {
    start: IPoint;
    end: IPoint;
    lineWidth: number;
}

export enum ETools {
    Pen = "pen",
    Shape = "shape",
    Text = "text",
    Eraser = "eraser",
    Cursor = "cursor",
    Hand = "hand",
}

/**
 * Posicao do ponteiro ja traduzida para os dois sistemas de coordenadas que
 * existem no quadro: `screen` e o pixel do canvas, `scene` e o ponto do quadro
 * (o mesmo ponto continua valendo depois de arrastar a tela).
 */
export interface IPointerInfo {
    screen: IPoint;
    scene: IPoint;
    button: number;
    /** Ctrl (ou Shift) segurado: soma a selecao em vez de trocar. */
    additive: boolean;
    /** Shift segurado: trava a forma em quadrado / circulo, ou o angulo da linha. */
    constrain: boolean;
}
