export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "whiteboard:theme";

/**
 * Decide entre claro e escuro. Sem escolha salva, segue o sistema; o botao da
 * barra fixa uma preferencia no `localStorage`.
 */
export class ThemeController {
    private mode: ThemeMode;
    private listeners: Array<(theme: ResolvedTheme) => void> = [];
    private readonly query = window.matchMedia("(prefers-color-scheme: dark)");

    constructor() {
        this.mode = this.readStoredMode();
        this.apply();

        this.query.addEventListener("change", () => {
            if (this.mode === "system") {
                this.apply();
            }
        });
    }

    public get resolved(): ResolvedTheme {
        if (this.mode !== "system") {
            return this.mode;
        }

        return this.query.matches ? "dark" : "light";
    }

    public toggle(): void {
        this.mode = this.resolved === "dark" ? "light" : "dark";
        this.store();
        this.apply();
    }

    public onChange(listener: (theme: ResolvedTheme) => void): void {
        this.listeners.push(listener);
    }

    private apply(): void {
        const theme = this.resolved;
        document.documentElement.dataset.theme = theme;

        for (const listener of this.listeners) {
            listener(theme);
        }
    }

    private readStoredMode(): ThemeMode {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored === "light" || stored === "dark" ? stored : "system";
        } catch {
            return "system";
        }
    }

    private store(): void {
        try {
            localStorage.setItem(STORAGE_KEY, this.mode);
        } catch {
            // Navegacao anonima ou armazenamento bloqueado: segue sem salvar.
        }
    }
}
