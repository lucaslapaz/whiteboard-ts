import type { IPoint } from "../core/types";

/**
 * Guarda o deslocamento do quadro em relacao a janela. E a unica fonte da
 * verdade sobre "onde estamos olhando": o renderizador aplica essa translacao
 * no contexto e as ferramentas usam `toScene` para converter o ponteiro.
 */
export class Viewport {
    public offsetX = 0;
    public offsetY = 0;

    public panBy(deltaX: number, deltaY: number): void {
        this.offsetX += deltaX;
        this.offsetY += deltaY;
    }

    public panTo(x: number, y: number): void {
        this.offsetX = x;
        this.offsetY = y;
    }

    public toScene(screen: IPoint): IPoint {
        return { x: screen.x - this.offsetX, y: screen.y - this.offsetY };
    }

    public toScreen(scene: IPoint): IPoint {
        return { x: scene.x + this.offsetX, y: scene.y + this.offsetY };
    }
}
