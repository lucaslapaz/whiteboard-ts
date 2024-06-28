"use strict";
class Variable {
    constructor(value) {
        this.associates = [];
        this.listeners = [];
        this._value = value;
    }
    associateElement(element) {
        this.associates.push(element);
        if (element.tagName.toLowerCase() === "input") {
            element.addEventListener("input", (event) => {
                this.value = event.target.value;
            });
        }
        ;
        this.value = this._value;
    }
    addListener(func) {
        this.listeners.push(func);
        func(this._value);
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        if (this.associates.length > 0) {
            for (let element of this.associates) {
                if (element.tagName.toLowerCase() === "input") {
                    element.value = value;
                }
                else {
                    element.textContent = value;
                }
            }
        }
        if (this.listeners.length > 0) {
            for (let func of this.listeners) {
                func(value);
            }
        }
    }
}
var ETools;
(function (ETools) {
    ETools["Pen"] = "pen";
    ETools["Add"] = "add";
    ETools["Eraser"] = "eraser";
    ETools["Cursor"] = "cursor";
    ETools["Hand"] = "hand";
    ETools["Center"] = "center";
})(ETools || (ETools = {}));
class SharedVariables {
    constructor() {
        this.actualTool = null;
        this.lineThickness = new Variable(2);
        this.lineColor = new Variable("#38316d");
        this.eraserThickness = new Variable(10);
        this.selectedColor = "rgba(255, 0, 0, 1)";
        this.selectionLineColor = "darkcyan";
        this.selectionLineWidth = 2;
    }
}
class PopUp {
    constructor(parent) {
        this.parent = parent;
    }
    closePopUp() {
        var _a;
        if ((_a = this.interface) === null || _a === void 0 ? void 0 : _a.parentNode) {
            this.interface.parentNode.removeChild(this.interface);
        }
    }
    showPopUp() {
        if (this.parent && this.interface && !this.interface.parentNode) {
            this.parent.appendChild(this.interface);
        }
    }
}
class PenPopUp extends PopUp {
    constructor(parent) {
        super(parent);
        this.interface = document.createElement("div");
        this.spanThickness = document.createElement("span");
        this.thicknessRange = document.createElement("input");
        this.thicknessNumber = document.createElement("p");
        this.spanColor = document.createElement("span");
        this.colorInput = document.createElement("input");
        this.createInterface();
    }
    createInterface() {
        this.interface.classList.add("tool-popup");
        this.thicknessRange.setAttribute("id", "thickness-range");
        this.thicknessRange.setAttribute("type", "range");
        this.thicknessRange.setAttribute("min", "1");
        this.thicknessRange.setAttribute("max", "10");
        this.thicknessRange.setAttribute("step", "1");
        this.thicknessRange.setAttribute("value", "5");
        this.thicknessNumber.setAttribute("id", "thickness-number");
        this.thicknessNumber.textContent = this.thicknessRange.value;
        this.spanThickness.appendChild(this.thicknessRange);
        this.spanThickness.appendChild(this.thicknessNumber);
        this.colorInput.setAttribute("id", "color-input");
        this.colorInput.setAttribute("type", "color");
        this.colorInput.setAttribute("value", "#12cec2");
        this.spanColor.appendChild(this.colorInput);
        this.interface.appendChild(this.spanThickness);
        this.interface.appendChild(this.spanColor);
    }
}
class AddPopUp extends PopUp {
    constructor(parent) {
        super(parent);
        this.interface = document.createElement("div");
        this.createInterface();
    }
    createInterface() {
        this.interface.classList.add("tool-popup");
    }
}
class EraserPopUp extends PopUp {
    constructor(parent) {
        super(parent);
        this.interface = document.createElement("div");
        this.spanThickness = document.createElement("span");
        this.thicknessRange = document.createElement("input");
        this.thicknessNumber = document.createElement("p");
        this.createInterface();
    }
    createInterface() {
        console.log('ljsadkfjasdkfj');
        this.interface.classList.add("tool-popup");
        this.thicknessRange.setAttribute("id", "thickness-range");
        this.thicknessRange.setAttribute("type", "range");
        this.thicknessRange.setAttribute("min", "1");
        this.thicknessRange.setAttribute("max", "100");
        this.thicknessRange.setAttribute("step", "9");
        this.thicknessRange.setAttribute("value", "10");
        this.thicknessNumber.setAttribute("id", "thickness-number");
        this.thicknessNumber.textContent = this.thicknessRange.value;
        this.spanThickness.appendChild(this.thicknessRange);
        this.spanThickness.appendChild(this.thicknessNumber);
        this.interface.appendChild(this.spanThickness);
    }
}
var EToolBarButtonStatus;
(function (EToolBarButtonStatus) {
    EToolBarButtonStatus["Active"] = "active";
    EToolBarButtonStatus["Normal"] = "normal";
    EToolBarButtonStatus["Hover"] = "active";
})(EToolBarButtonStatus || (EToolBarButtonStatus = {}));
class IToolBarButton {
    constructor(parent) {
        this.parent = parent;
    }
}
class ToolBarButton extends IToolBarButton {
    constructor(toolContainer, id, imgPath, func) {
        super(toolContainer);
        this.status = EToolBarButtonStatus.Normal;
        this.interface = document.createElement("span");
        this.image = document.createElement("img");
        this.id = id;
        this.imgPath = imgPath;
        this.func = func;
        this.createInterface();
    }
    createInterface() {
        this.interface.classList.add("tool-button");
        this.interface.setAttribute("id", this.id);
        this.image.src = this.imgPath;
        this.image.alt = "Tool button";
        this.interface.appendChild(this.image);
        if (this.parent) {
            this.parent.appendChild(this.interface);
        }
        else {
            console.log("Impossible to add button to the toolbar menu. The parent container is null or undefined.");
        }
    }
    focus() {
        this.interface.setAttribute("active", "true");
    }
    loseFocus() {
        this.interface.removeAttribute("active");
    }
}
class ToolBar {
    constructor(sharedVariables) {
        this.toolContainer = document.getElementById("tool-container");
        this.penButton = new ToolBarButton(this.toolContainer, "pen-button", "./images/pen-ico.svg", this.selectPen);
        //private addButton = new ToolBarButton(this.toolContainer,"add-button", "./images/add-ico.svg", this.selectAdd);
        this.eraserButton = new ToolBarButton(this.toolContainer, "eraser-button", "./images/eraser-ico.svg", this.selectEraser);
        this.cursorButton = new ToolBarButton(this.toolContainer, "cursor-button", "./images/cursor-ico.svg", this.selectCursor);
        this.handButton = new ToolBarButton(this.toolContainer, "hand-button", "./images/hand-ico.svg", this.selectHand);
        this.centerButton = new ToolBarButton(this.toolContainer, "center-button", "./images/center-focus-ico.svg", this.selectHand);
        this.buttons = [this.penButton, /*this.addButton,*/ this.eraserButton, this.cursorButton, this.handButton, this.centerButton];
        this.penPopUp = null;
        this.addPopUp = null;
        this.eraserPopUp = null;
        this.actualPopUp = null;
        this.sharedVariables = sharedVariables;
        if (!this.toolContainer) {
            return;
        }
        this.toolContainer.addEventListener("mousedown", this.toolMouseEvents.bind(this));
        window.addEventListener("mousedown", this.windowMouseEvent.bind(this));
    }
    //ToolBar functions
    windowMouseEvent(event) {
        let target = event.target;
        let alvo = target.closest("#tool-container");
        if (!alvo && this.actualPopUp != null) {
            this.actualPopUp.closePopUp();
        }
    }
    toolMouseEvents(event) {
        let target = event.target;
        let alvo = target.closest(".tool-button");
        if (target.closest(".tool-popup") === null) {
            this.closePopUp();
        }
        if (alvo) {
            event.preventDefault();
            this.buttons.forEach((button, index) => {
                if (button.id === alvo.getAttribute('id')) {
                    button.focus();
                    if (button.func && typeof button.func === "function") {
                        button.func.bind(this)();
                    }
                }
                else {
                    button.loseFocus();
                }
            });
        }
    }
    dispatchToolChangeEvent(tool) {
        this.sharedVariables.actualTool = tool;
        window.dispatchEvent(new CustomEvent("toolchanged", { detail: {
                actualTool: this.sharedVariables.actualTool
            } }));
    }
    closePopUp() {
        var _a;
        (_a = this.actualPopUp) === null || _a === void 0 ? void 0 : _a.closePopUp();
    }
    //ToolBar Buttons functions
    selectPen(objeto) {
        if (!this.penPopUp) {
            this.penPopUp = new PenPopUp(this.toolContainer);
            let { lineThickness, lineColor } = this.sharedVariables;
            lineThickness.associateElement(this.penPopUp.thicknessRange);
            lineThickness.associateElement(this.penPopUp.thicknessNumber);
            lineColor.associateElement(this.penPopUp.colorInput);
            // lineColor.addListener((value: string ) => {
            //     if(this.penButton){
            //         if(this.penButton.interface){
            //             //this.penButton.interface.style.backgroundColor = value;
            //         }
            //     }
            // })
        }
        this.dispatchToolChangeEvent(ETools.Pen);
        this.actualPopUp = this.penPopUp;
        this.actualPopUp.showPopUp();
    }
    selectAdd() {
        if (!this.addPopUp) {
            this.addPopUp = new AddPopUp(this.toolContainer);
        }
        this.dispatchToolChangeEvent(ETools.Add);
        this.actualPopUp = this.addPopUp;
        this.actualPopUp.showPopUp();
    }
    selectEraser() {
        if (!this.eraserPopUp) {
            this.eraserPopUp = new EraserPopUp(this.toolContainer);
            this.sharedVariables.eraserThickness.associateElement(this.eraserPopUp.thicknessRange);
            this.sharedVariables.eraserThickness.associateElement(this.eraserPopUp.thicknessNumber);
        }
        this.dispatchToolChangeEvent(ETools.Eraser);
        this.actualPopUp = this.eraserPopUp;
        this.actualPopUp.showPopUp();
    }
    selectCursor() {
        this.dispatchToolChangeEvent(ETools.Cursor);
    }
    selectHand() {
        this.dispatchToolChangeEvent(ETools.Hand);
    }
    selectCenter() {
        this.dispatchToolChangeEvent(ETools.Center);
    }
}
class Tool {
    constructor(whiteboard) {
        this.whiteboard = whiteboard;
    }
}
class Pen extends Tool {
    constructor(whiteboard) {
        super(whiteboard);
    }
    startDrawing(event) {
        if (event.button === 0) {
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
            this.whiteboard.currentDrawing = {
                points: [{ x, y }],
                color: this.whiteboard.sharedVariables.lineColor.value,
                lineWidth: this.whiteboard.sharedVariables.lineThickness.value,
                selected: false
            };
            this.whiteboard.lastX = x;
            this.whiteboard.lastY = y;
        }
    }
    continueDrawing(event) {
        if (this.whiteboard.currentDrawing && this.whiteboard.lastX !== null && this.whiteboard.lastY !== null) {
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
            let dx = x - this.whiteboard.lastX;
            let dy = y - this.whiteboard.lastY;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 2 || this.whiteboard.currentDrawing.points.length < 3) {
                this.whiteboard.currentDrawing.points.push({ x, y });
                this.whiteboard.lastX = x;
                this.whiteboard.lastY = y;
                this.whiteboard.redraw();
            }
        }
    }
    finishDrawing(event) {
        if (this.whiteboard.currentDrawing) {
            this.whiteboard.drawings.push(this.whiteboard.currentDrawing);
            this.whiteboard.currentDrawing = null;
        }
        this.whiteboard.lastX = null;
        this.whiteboard.lastY = null;
    }
}
class Eraser extends Tool {
    constructor(whiteboard) {
        super(whiteboard);
        this.erasing = false;
    }
    startErasing(event) {
        if (!this.whiteboard.currentDrawing) {
            let radius = 10;
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
            this.erasing = true;
            this.whiteboard.drawings = this.whiteboard.drawings.filter((draw) => {
                return !this.isDrawingInEraseRadius(draw, x, y, radius);
            });
            this.whiteboard.drawings.forEach((draw, index) => {
            });
            this.whiteboard.redraw();
        }
    }
    isDrawingInEraseRadius(drawing, x, y, radius) {
        for (let i = 0; i < drawing.points.length - 1; i++) {
            let point1 = drawing.points[i];
            let point2 = drawing.points[i + 1];
            if (this.isPointNearLine(drawing.lineWidth, point1, point2, { x, y }, radius)) {
                return true;
            }
        }
        return false;
    }
    isPointNearLine(lineWidth, point1, point2, point, radius) {
        let A = point.x - point1.x;
        let B = point.y - point1.y;
        let C = point2.x - point1.x;
        let D = point2.y - point1.y;
        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = dot / len_sq;
        let xx, yy;
        if (param < 0) {
            xx = point1.x;
            yy = point1.y;
        }
        else if (param > 1) {
            xx = point2.x;
            yy = point2.y;
        }
        else {
            xx = point1.x + param * C;
            yy = point1.y + param * D;
        }
        let dx = point.x - xx;
        let dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy) <= (lineWidth / 2) + (this.whiteboard.sharedVariables.eraserThickness.value / 2);
    }
    continueErasing(event) {
        if (this.erasing) {
            this.startErasing(event);
        }
    }
    finishErasing(event) {
        if (this.erasing) {
            this.erasing = false;
        }
    }
}
class Cursor extends Tool {
    constructor(whiteboard) {
        super(whiteboard);
        this.selecting = false;
    }
    startSelection(event) {
        if (!this.whiteboard.currentDrawing) {
            this.selecting = true;
        }
    }
    isDrawingInEraseRadius(drawing, x, y, radius) {
        for (let i = 0; i < drawing.points.length - 1; i++) {
            let point1 = drawing.points[i];
            let point2 = drawing.points[i + 1];
            if (this.isPointNearLine(drawing.lineWidth, point1, point2, { x, y }, radius)) {
                return true;
            }
        }
        return false;
    }
    isPointNearLine(lineWidth, point1, point2, point, radius) {
        let A = point.x - point1.x;
        let B = point.y - point1.y;
        let C = point2.x - point1.x;
        let D = point2.y - point1.y;
        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = dot / len_sq;
        let xx, yy;
        if (param < 0) {
            xx = point1.x;
            yy = point1.y;
        }
        else if (param > 1) {
            xx = point2.x;
            yy = point2.y;
        }
        else {
            xx = point1.x + param * C;
            yy = point1.y + param * D;
        }
        let dx = point.x - xx;
        let dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy) <= (lineWidth / 2) + (this.whiteboard.sharedVariables.eraserThickness.value / 2);
    }
    continueSelection(event) {
        if (this.selecting) {
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
            if (!this.whiteboard.currentSelectionArea) {
                this.whiteboard.currentSelectionArea = {
                    start: { x, y },
                    color: this.whiteboard.sharedVariables.selectionLineColor,
                    end: { x, y },
                    lineWidth: this.whiteboard.sharedVariables.selectionLineWidth
                };
            }
            else {
                this.whiteboard.currentSelectionArea.end = { x, y };
            }
            this.whiteboard.redraw();
        }
    }
    finishSelection(event) {
        if (this.selecting) {
            this.selecting = false;
            if (this.whiteboard.currentSelectionArea) {
                this.whiteboard.currentSelectionArea = null;
            }
            else {
                let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
                let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
                this.whiteboard.drawings.forEach((draw) => {
                    if (this.isDrawingInEraseRadius(draw, x, y, 1)) {
                        draw.selected = true;
                    }
                    else {
                        draw.selected = false;
                    }
                    ;
                });
            }
            this.whiteboard.redraw();
        }
    }
}
class Hand extends Tool {
    constructor(whiteboard) {
        super(whiteboard);
        this.dragging = false;
    }
    startDragging(event) {
        this.dragging = true;
        let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
        let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
        console.log('started to dragging');
    }
    continueDragging(event) {
    }
    finishDragging(event) {
        if (this.dragging) {
            this.dragging = false;
        }
    }
}
class WhiteBoard {
    constructor(sharedVariables) {
        this.pen = new Pen(this);
        this.eraser = new Eraser(this);
        this.cursor = new Cursor(this);
        this.hand = new Hand(this);
        this.drawings = [];
        this.redoDrawings = [];
        this.currentDrawing = null;
        this.currentSelectionArea = {
            start: { x: 100, y: 100 },
            color: "darkcyan",
            end: { x: 400, y: 400 },
            lineWidth: 2
        };
        this.canvas = document.getElementById("whiteboard");
        this.lastX = null;
        this.lastY = null;
        this.ctx = this.canvas.getContext('2d');
        this.sharedVariables = sharedVariables;
        this.resizeCanvas();
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.canvas.addEventListener("mousedown", this.mouseDownEventListener.bind(this));
        this.canvas.addEventListener("mousemove", this.mouseMoveEventListener.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseUpEventListener.bind(this));
        this.canvas.addEventListener("mouseleave", this.mouseLeaveEventListener.bind(this));
        window.addEventListener("resize", this.resizeCanvas.bind(this));
        window.addEventListener("keydown", this.keyDown.bind(this));
        window.addEventListener("toolchanged", this.toolChangedEventListener.bind(this));
    }
    mouseDownEventListener(event) {
        if (this.sharedVariables.actualTool === ETools.Pen) {
            this.pen.startDrawing.bind(this.pen)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Eraser) {
            this.eraser.startErasing.bind(this.eraser)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Cursor) {
            this.cursor.startSelection.bind(this.cursor)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Hand) {
            this.hand.startDragging.bind(this.hand)(event);
        }
    }
    mouseMoveEventListener(event) {
        if (this.sharedVariables.actualTool === ETools.Pen) {
            this.pen.continueDrawing.bind(this.pen)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Eraser) {
            this.eraser.continueErasing.bind(this.eraser)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Cursor) {
            this.cursor.continueSelection.bind(this.cursor)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Hand) {
            this.hand.continueDragging.bind(this.hand)(event);
        }
    }
    mouseUpEventListener(event) {
        if (this.sharedVariables.actualTool === ETools.Pen) {
            this.pen.finishDrawing.bind(this.pen)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Eraser) {
            this.eraser.finishErasing.bind(this.eraser)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Cursor) {
            this.cursor.finishSelection.bind(this.cursor)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Hand) {
            this.hand.finishDragging.bind(this.hand)(event);
        }
    }
    mouseLeaveEventListener(event) {
        if (this.sharedVariables.actualTool === ETools.Pen) {
            this.pen.finishDrawing.bind(this.pen)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Eraser) {
            this.eraser.finishErasing.bind(this.eraser)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Cursor) {
            this.cursor.finishSelection.bind(this.cursor)(event);
        }
        else if (this.sharedVariables.actualTool === ETools.Hand) {
            this.hand.finishDragging.bind(this.hand)(event);
        }
    }
    toolChangedEventListener(event) {
        let value = event.detail;
        if (value) {
            switch (this.sharedVariables.actualTool) {
                case ETools.Pen:
                    //this.canvas.style.cursor = 'url("./images/cursor-style.svg") 1111 1111, pointer'
                    break;
                case ETools.Add:
                    break;
                case ETools.Eraser:
                    break;
                case ETools.Cursor:
                    break;
                case ETools.Hand:
                    break;
                default:
                    break;
            }
        }
    }
    keyDown(event) {
        event.preventDefault();
        let key = event.key.toLowerCase();
        if (event.ctrlKey) {
            if (key === "z") {
                let undo = this.drawings.pop();
                if (undo) {
                    this.redoDrawings.push(undo);
                    this.redraw();
                }
            }
            else if (key === "y") {
                let redo = this.redoDrawings.pop();
                if (redo) {
                    this.drawings.push(redo);
                    this.redraw();
                }
            }
            else if (key === "c") {
                this.drawings = [];
                this.redoDrawings = [];
                this.redraw();
            }
        }
        if (key === "arrowleft" || key === "a") {
            this.ctx.translate(-5, 0);
            this.redraw();
        }
        else if (key === "arrowright" || key === "d") {
            this.ctx.translate(5, 0);
            this.redraw();
        }
        else if (key === "arrowdown" || key === "s") {
            this.ctx.translate(0, 5);
            this.redraw();
        }
        else if (key === "arrowup" || key === "w") {
            this.ctx.translate(0, -5);
            this.redraw();
        }
        else if (key === "f") {
            const newtab = window.open();
            if (newtab) {
                const imageUrl = this.canvas.toDataURL('image/png');
                newtab.document.write(`<img src="${imageUrl}" alt="">`);
            }
            this.setAbsoluteTranslate(0, 0);
            this.redraw();
        }
    }
    setAbsoluteTranslate(x, y) {
        let currentTranslateX = this.getCurrentTranslateX();
        let currentTranslateY = this.getCurrentTranslateY();
        let deltaX = x - currentTranslateX;
        let deltaY = y - currentTranslateY;
        this.ctx.translate(deltaX, deltaY);
    }
    getCurrentTranslateX() {
        return this.ctx.getTransform().e;
    }
    getCurrentTranslateY() {
        return this.ctx.getTransform().f;
    }
    redraw() {
        let x = 0 - this.getCurrentTranslateX();
        let y = 0 - this.getCurrentTranslateY();
        this.ctx.clearRect(x, y, this.canvas.width, this.canvas.height);
        this.drawings.forEach(drawing => {
            this.drawSmoothLine(drawing.points, drawing.color, drawing.lineWidth, drawing.selected);
        });
        let currentD = this.currentDrawing;
        if (currentD) {
            this.drawSmoothLine(currentD.points, currentD.color, currentD.lineWidth, currentD.selected);
        }
        let currentSA = this.currentSelectionArea;
        if (currentSA) {
            this.drawSelectionArea(currentSA.start, currentSA.end, currentSA.color, currentSA.lineWidth);
        }
    }
    drawSelectionArea(start, end, color, lineWidth) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        let width = end.x - start.x;
        let height = end.y - start.y;
        this.ctx.rect(start.x, start.y, width, height);
        this.ctx.stroke();
    }
    drawSmoothLine(points, color, lineWidth, selected) {
        if (points.length < 2) {
            return; // Não é possível desenhar uma linha com menos de 2 pontos
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        //Testando a sombra de seleção.
        if (selected) {
            this.ctx.shadowColor = this.sharedVariables.selectedColor;
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }
        // Últimos pontos
        const last = points.length - 1;
        this.ctx.quadraticCurveTo(points[last - 1].x, points[last - 1].y, points[last].x, points[last].y);
        this.ctx.stroke();
        this.ctx.shadowColor = 'transparent';
    }
    resizeCanvas() {
        const bounding = this.canvas.getBoundingClientRect();
        this.canvas.width = bounding.width;
        this.canvas.height = bounding.height;
        this.redraw();
    }
}
document.addEventListener("DOMContentLoaded", (e) => {
    const sharedVariables = new SharedVariables();
    const whiteboard = new WhiteBoard(sharedVariables);
    const toolBar = new ToolBar(sharedVariables);
});
