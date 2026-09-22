# Whiteboard

Um quadro branco infinito para desenhar no navegador: caneta a mao livre, formas
prontas, texto, borracha, selecao e exportacao em PNG.

Sem framework. TypeScript puro, um `<canvas>` 2D e CSS, empacotados pelo
[Vite](https://vite.dev). O HTML tem so os containers vazios — a barra de
ferramentas, os paineis e o cartao de atalhos sao montados em codigo.

![Um fluxograma feito no quadro: caixas, losango, setas, um balao de fala com texto e um rabisco a mao livre, com o painel de texto aberto](preview.png)

## Comecando

```bash
npm install
npm start
```

O `npm start` sobe o servidor de desenvolvimento e abre o navegador. Nao e
preciso abrir o `index.html` na mao.

| Comando             | O que faz                                          |
| ------------------- | -------------------------------------------------- |
| `npm start`         | Servidor de desenvolvimento (igual a `npm run dev`) |
| `npm run build`     | Checa os tipos e gera a versao final em `dist/`     |
| `npm run preview`   | Serve o conteudo de `dist/` para conferir o build   |
| `npm run typecheck` | So a checagem de tipos                              |
| `npm test`          | Testes de unidade (Vitest)                          |
| `npm run test:e2e`  | Testes de ponta a ponta (Playwright)                |

## As ferramentas

**Caneta** desenha a mao livre. Os pontos capturados passam por um suavizador de
curvas quadraticas, entao o traco nao sai serrilhado.

**Formas** cria retangulo, retangulo arredondado, elipse, triangulo, losango,
balao de fala, linha e seta. Arraste a diagonal para definir o tamanho.

**Texto** abre uma caixa de digitacao no ponto clicado. Enter quebra a linha;
Esc, Ctrl + Enter ou um clique fora encerram e gravam. Texto em branco e
descartado. Com a ferramenta de selecao, dois cliques em cima de um texto
reabrem ele para editar.

**Borracha** apaga o traco inteiro que estiver debaixo do circulo — nao apaga
pedacinhos.

**Selecao** marca, move e apaga:

- clique num traco para seleciona-lo;
- arraste no vazio para abrir o retangulo de selecao;
- segure `Ctrl` (ou `Shift`) para somar a selecao, clicando ou arrastando. Um
  `Ctrl + clique` no que ja estava marcado tira ele da selecao;
- arraste a partir de qualquer traco selecionado e a selecao inteira vai junto;
- `Delete` apaga o que estiver marcado.

**Mao** arrasta o quadro. A roda do mouse e as setas do teclado fazem o mesmo.

### A tecla Shift

Segurando `Shift` durante o arrasto de uma forma:

- caixas e elipses ficam com os lados iguais (quadrado, circulo);
- linhas e setas travam no angulo de 45 graus mais proximo, o que inclui a
  horizontal e a vertical exatas.

## Atalhos

| Tecla      | Acao                     |
| ---------- | ------------------------ |
| `P`        | Caneta                   |
| `S`        | Formas                   |
| `T`        | Texto                    |
| `E`        | Borracha                 |
| `V`        | Selecao                  |
| `H`        | Mover o quadro           |
| `Ctrl + Z` | Desfazer                 |
| `Ctrl + Y` | Refazer                  |
| `Delete`   | Apagar a selecao         |
| `Esc`      | Limpar a selecao         |
| Setas      | Mover o quadro           |
| `F`        | Centralizar o desenho    |
| `Ctrl + S` | Exportar PNG             |
| `D`        | Tema claro / escuro      |
| `?`        | Mostrar todos os atalhos |

O tema acompanha o sistema ate voce escolher um, e a escolha fica salva no
`localStorage`.

![O mesmo tipo de quadro no tema escuro, com uma elipse e seu rotulo selecionados e o cartao de atalhos aberto](preview-dark.png)

## Como o codigo esta organizado

```
index.html              a pagina, so com os containers vazios
src/
  main.ts               liga as pecas e inicia o app
  core/
    types.ts            IStroke, IText, IDrawing, ETools, IPointerInfo
    Variable.ts         valor observavel que se liga a elementos da pagina
    SharedVariables.ts  estado compartilhado (ferramenta, forma, cor, tamanho)
    geometry.ts         colisao, area de selecao e deslocamento dos elementos
    shapes.ts           contorno das formas prontas
    text.ts             fonte e entrelinha, compartilhadas canvas / editor
    History.ts          pilha de desfazer por instantaneos
  board/
    WhiteBoard.ts       estado do quadro e roteamento dos eventos do ponteiro
    Renderer.ts         tudo que toca no contexto 2D
    Viewport.ts         deslocamento da visao e conversao de coordenadas
  tools/
    Tool.ts             classe base das ferramentas
    Pen.ts ShapeTool.ts TextTool.ts Eraser.ts Cursor.ts Hand.ts
  ui/
    ToolBar.ts          barra flutuante
    ToolBarButton.ts    botao da barra
    PopUp.ts            base dos paineis de ajuste
    PenPopUp.ts ShapePopUp.ts TextPopUp.ts EraserPopUp.ts
    ColorPalette.ts     amostras de cor, usadas pelos tres paineis
    InkControls.ts      espessura mais a paleta, para caneta e formas
    TextEditor.ts       a caixa de digitacao que fica sobre o canvas
    HintsPanel.ts       cartao de atalhos
    shortcuts.ts        teclado
    theme.ts            claro / escuro
    icons.ts shapeIcons.ts dom.ts
  styles/
    tokens.css          paleta e medidas
    main.css            layout e componentes
  assets/icons/         os SVG da barra, em currentColor
tests/
  unit/                 geometria, formas, texto, historico e Variable (Vitest)
  e2e/                  o quadro inteiro pelo navegador (Playwright)
```

### As quatro ideias que sustentam o resto

**Todo elemento do quadro e um `IDrawing`.** O tipo e uma uniao de duas formas
de existir: `IStroke`, uma lista de pontos, e `IText`. Um rabisco a mao e um
balao de fala sao os dois o mesmo `IStroke`; muda so como os pontos foram
gerados e como sao ligados (`smooth`, `closed`) — criar uma forma nova e
escrever uma funcao que devolve pontos em `core/shapes.ts`.

O que diferencia os dois tipos fica confinado em `core/geometry.ts`, em quatro
funcoes: colisao com um ponto, colisao com o retangulo de selecao, deslocamento
e limites. O quadro so chama essas funcoes, entao apagar, selecionar, mover,
desfazer e exportar funcionam igual para texto e para traco.

**`Variable<T>` e o observavel da casa.** Um valor que aparece na tela e que
outras partes precisam acompanhar vira um `Variable`: `associateElement` liga o
valor a um `<input>` (nos dois sentidos) ou a um texto, e `addListener` avisa
quem precisa reagir. A ferramenta ativa, a forma escolhida, a cor e a espessura
sao todas assim — e por isso a barra nao precisa conhecer o quadro.

**O quadro e dono do estado.** As ferramentas nao mexem na lista de tracos: elas
chamam `setCurrentStroke`, `eraseAt`, `moveSelected`, `selectWithinArea`. Cada
gesto do ponteiro abre e fecha um "gesto" no `History`, e e assim que um
arrastao inteiro da borracha, ou de uma selecao, volta com um unico `Ctrl + Z`.

**As cores do canvas vem do CSS.** O `Renderer` le as variaveis de
`styles/tokens.css` em tempo de execucao, entao o tema claro/escuro vale para o
desenho sem paleta duplicada no TypeScript.

### Detalhes que talvez surpreendam

- A caneta e a borracha escondem o cursor do sistema (`cursor: none`) e o proprio
  canvas desenha um circulo do tamanho exato do traco. Assim nada fica na frente
  do ponto onde se vai desenhar.
- O canvas respeita o `devicePixelRatio`, entao o traco continua nitido em telas
  com escala acima de 100%.
- A entrada e por eventos de ponteiro, nao de mouse, entao dedo e caneta
  funcionam do mesmo jeito.
- O PNG exportado sai sem a grade, sem o brilho de selecao e com o fundo
  preenchido — so o desenho.
- O texto e digitado num `<textarea>` de verdade posicionado sobre o canvas, e
  so vira desenho quando a edicao termina. Sai de graca cursor, selecao, colar e
  teclado virtual. Em troca, a fonte e a entrelinha precisam ser identicas dos
  dois lados: ficam em `core/text.ts`, e o canvas repete a conta de entrelinha
  que o CSS faz, senao o texto pularia alguns pixels ao ser gravado.

## Testes

```bash
npm test           # unidade
npm run test:e2e   # navegador
```

Os testes de unidade cobrem o que e logica pura: geometria, geracao das formas,
metricas de texto, a pilha de desfazer e o `Variable`.

Os de ponta a ponta sobem o servidor sozinhos e dirigem o quadro por mouse e
teclado de verdade. Eles leem o estado por `window.whiteboard`, que `src/main.ts`
publica **apenas** em modo de desenvolvimento, dentro de um
`if (import.meta.env.DEV)` — no pacote de producao o bloco inteiro desaparece.
