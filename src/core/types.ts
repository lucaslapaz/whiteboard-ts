export interface IPoint {
    x: number;
    y: number;
}

/**
 * Tudo que existe no quadro e uma lista de pontos. Traco a mao livre, quadrado
 * ou balao de fala: muda so como os pontos foram gerados e como sao ligados.
 * Com um modelo so, apagar, selecionar, mover e desfazer valem para todos.
 */
export interface IDrawing {
    points: IPoint[];
    color: string;
    lineWidth: number;
    selected: boolean;
    /** Traco a mao passa pelo suavizador; forma pronta ja vem com os pontos certos. */
    smooth: boolean;
    /** Liga o ultimo ponto ao primeiro para fechar o contorno. */
    closed: boolean;
}

export interface ISelectionArea {
    start: IPoint;
    end: IPoint;
    lineWidth: number;
}

export enum ETools {
    Pen = "pen",
    Shape = "shape",
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
    /** Shift segurado: trava a forma em quadrado / circulo. */
    constrain: boolean;
    originalEvent: PointerEvent;
}
