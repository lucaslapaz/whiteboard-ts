interface IDrawing{
    points:{x:number, y:number}[];
    color: string;
    lineWidth:number;
    selected: boolean
}

interface ISelectionArea{
    start: {x: number, y: number};
    end: {x: number, y: number};
    color: string;
    lineWidth: number;
}

interface IToolButton {
    id: string;
    class: string;
    tagName: string;
    imgPath: string;
    func: Function | Function[] | null | boolean;
    element?: HTMLElement;
}

class Variable<T>{
    private _value: T;
    private associates: HTMLElement [] = [];
    private listeners: Function[] = [];

    constructor(value:T){
        this._value = value;
    }

    public associateElement(element:HTMLElement | HTMLInputElement):void{
        this.associates.push(element);
        if(element.tagName.toLowerCase() === "input"){
            element.addEventListener("input", (event:Event) => {
                this.value = (event.target as HTMLInputElement).value as T;
            })
        };
        this.value = this._value as T;
    }

    public addListener(func:Function){
        this.listeners.push(func)
        func(this._value);
    }

    get value():T{
        return this._value
    }

    set value(value:T){
        this._value = value;
        if(this.associates.length > 0){
            for(let element of this.associates){
                if(element.tagName.toLowerCase() === "input"){
                    (element as HTMLInputElement).value = value as string;
                }else{
                    (element as HTMLElement).textContent = value as string;
                }
            }
        }

        if(this.listeners.length > 0){
            for(let func of this.listeners){
                func(value);
            }
        }
    }
}

enum ETools { 
    Pen = "pen", 
    Add = "add", 
    Eraser = "eraser", 
    Cursor = "cursor", 
    Hand = "hand",
    Center = "center",
}

class SharedVariables{
    public actualTool: ETools | null = null;
    public lineThickness: Variable<number> = new Variable<number>(2);
    public lineColor: Variable<string> = new Variable<string>("#38316d");
    public eraserThickness: Variable<number> = new Variable<number>(10);
    public selectedColor: string = "rgba(255, 0, 0, 1)";
    public selectionLineColor: string = "darkcyan";
    public selectionFillColor: string = "rgba(222,222,222,0.3)"
    public selectionLineWidth: number = 0.5;
}

abstract class PopUp{

    abstract interface:HTMLElement;
    public parent:HTMLElement;

    constructor(parent:HTMLElement){
        this.parent = parent;
    }

    abstract createInterface():void;

    public closePopUp(){
        if(this.interface?.parentNode){
            this.interface.parentNode.removeChild(this.interface);
        }
    }

    public showPopUp(){
        if(this.parent && this.interface && !this.interface.parentNode){
            this.parent.appendChild(this.interface);
        }
    }
}

class PenPopUp extends PopUp{

    public interface:HTMLDivElement = document.createElement("div"); 
    public spanThickness:HTMLSpanElement = document.createElement("span");
    public thicknessRange:HTMLInputElement = document.createElement("input");
    public thicknessNumber:HTMLParagraphElement = document.createElement("p");
    public spanColor:HTMLSpanElement = document.createElement("span");
    public colorInput:HTMLInputElement = document.createElement("input");

    constructor(parent:HTMLElement){
        super(parent);
        this.createInterface();
    }

    createInterface(): void{
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

class AddPopUp extends PopUp{

    public interface:HTMLDivElement = document.createElement("div"); 

    constructor(parent:HTMLElement){
        super(parent);
        this.createInterface();
    }

    createInterface(): void{
        this.interface.classList.add("tool-popup");
    }
}

class EraserPopUp extends PopUp{

    public interface:HTMLDivElement = document.createElement("div"); 
    public spanThickness:HTMLSpanElement = document.createElement("span");
    public thicknessRange:HTMLInputElement = document.createElement("input");
    public thicknessNumber:HTMLParagraphElement = document.createElement("p");

    constructor(parent:HTMLElement){
        super(parent);
        this.createInterface();
    }

    createInterface(): void{
        console.log('ljsadkfjasdkfj')
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

enum EToolBarButtonStatus{
    Active = "active",
    Normal = "normal",
    Hover = "active"
}

abstract class IToolBarButton{
    abstract status:EToolBarButtonStatus;
    abstract id:string;
    abstract imgPath:string;
    abstract interface: HTMLElement | null;
    abstract func: Function;
    public parent:HTMLElement | null;
    abstract createInterface():void;
    abstract focus():void;
    abstract loseFocus():void;

    constructor(parent:HTMLElement){
        this.parent = parent;
    }
}

class ToolBarButton extends IToolBarButton{
    public status:EToolBarButtonStatus = EToolBarButtonStatus.Normal;
    public id:string;
    public imgPath:string;
    public func: Function;
    public interface: HTMLElement = document.createElement("span");
    public image:HTMLImageElement = document.createElement("img");

    constructor(toolContainer:HTMLElement, id:string,imgPath:string, func:Function){
        super(toolContainer);
        this.id = id;
        this.imgPath = imgPath;
        this.func = func;
        this.createInterface();
    } 

    createInterface(): void {
        this.interface.classList.add("tool-button");
        this.interface.setAttribute("id", this.id);

        this.image.src = this.imgPath;
        this.image.alt = "Tool button";

        this.interface.appendChild(this.image);
        if(this.parent){
            this.parent.appendChild(this.interface);
        }else{
            console.log("Impossible to add button to the toolbar menu. The parent container is null or undefined.")
        }
    }
    focus(): void {
        this.interface.setAttribute("active","true");
    }

    loseFocus():void{
        this.interface.removeAttribute("active");
    }

}

class ToolBar{

    private sharedVariables:SharedVariables;
    private toolContainer:HTMLElement = document.getElementById("tool-container") as HTMLElement;
    
    private penButton = new ToolBarButton(this.toolContainer,"pen-button", "./images/pen-ico.svg", this.selectPen);
    //private addButton = new ToolBarButton(this.toolContainer,"add-button", "./images/add-ico.svg", this.selectAdd);
    private eraserButton = new ToolBarButton(this.toolContainer,"eraser-button", "./images/eraser-ico.svg", this.selectEraser);
    private cursorButton = new ToolBarButton(this.toolContainer,"cursor-button", "./images/cursor-ico.svg", this.selectCursor);
    private handButton = new ToolBarButton(this.toolContainer,"hand-button", "./images/hand-ico.svg", this.selectHand);
    private centerButton = new ToolBarButton(this.toolContainer,"center-button", "./images/center-focus-ico.svg", this.selectHand);
    private buttons: ToolBarButton[] = [this.penButton, /*this.addButton,*/ this.eraserButton, this.cursorButton, this.handButton, this.centerButton]

    private penPopUp:PenPopUp | null = null;
    private addPopUp:AddPopUp | null = null;
    private eraserPopUp:EraserPopUp | null = null;
    private actualPopUp:PopUp | null = null;


    constructor(sharedVariables:SharedVariables){
        this.sharedVariables = sharedVariables;
        if(!this.toolContainer){
            return;
        }
        this.toolContainer.addEventListener("mousedown",this.toolMouseEvents.bind(this));
        window.addEventListener("mousedown", this.windowMouseEvent.bind(this));
    }

    //ToolBar functions

    windowMouseEvent(event:MouseEvent):void{
        let target: HTMLElement = event.target as HTMLElement;
        let alvo:HTMLElement = target.closest("#tool-container") as HTMLElement;
        if(!alvo && this.actualPopUp != null){
            this.actualPopUp.closePopUp();
        }
    }

    toolMouseEvents(event:MouseEvent):void{
        let target: HTMLElement = event.target as HTMLElement;
        let alvo:HTMLElement = target.closest(".tool-button") as HTMLElement;

        if(target.closest(".tool-popup") as HTMLElement === null){
            this.closePopUp();
        }

        if(alvo){
            event.preventDefault();
            this.buttons.forEach((button, index) => {
                if(button.id === alvo.getAttribute('id')){
                    button.focus();
                    if(button.func && typeof button.func === "function"){
                        button.func.bind(this)();
                    }
                }else{
                    button.loseFocus();
                }
            })
        }
    }

    dispatchToolChangeEvent(tool: ETools):void{
        this.sharedVariables.actualTool = tool;
        window.dispatchEvent(new CustomEvent("toolchanged", {detail: {
            actualTool: this.sharedVariables.actualTool
        }}))
    }

    closePopUp():void{
        this.actualPopUp?.closePopUp();
    }

    //ToolBar Buttons functions

    selectPen(objeto:ToolBarButton):void{
        if(!this.penPopUp){
            this.penPopUp = new PenPopUp(this.toolContainer)
            let {lineThickness, lineColor} = this.sharedVariables;
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

    selectAdd():void{
        if(!this.addPopUp){
            this.addPopUp = new AddPopUp(this.toolContainer);
        }

        this.dispatchToolChangeEvent(ETools.Add);
        this.actualPopUp = this.addPopUp;
        this.actualPopUp.showPopUp();
    }

    selectEraser():void{
        if(!this.eraserPopUp){
            this.eraserPopUp = new EraserPopUp(this.toolContainer);
            this.sharedVariables.eraserThickness.associateElement(this.eraserPopUp.thicknessRange)
            this.sharedVariables.eraserThickness.associateElement(this.eraserPopUp.thicknessNumber)
        }

        this.dispatchToolChangeEvent(ETools.Eraser);
        this.actualPopUp = this.eraserPopUp;
        this.actualPopUp.showPopUp();
    }

    selectCursor():void{
        this.dispatchToolChangeEvent(ETools.Cursor);
    }

    selectHand():void{
        this.dispatchToolChangeEvent(ETools.Hand);
    }
    selectCenter():void{
        this.dispatchToolChangeEvent(ETools.Center);
    }
}

abstract class Tool{
    protected whiteboard: WhiteBoard;

    constructor(whiteboard: WhiteBoard){
        this.whiteboard = whiteboard;
    }
}

class Pen extends Tool{
    constructor(whiteboard:WhiteBoard){
        super(whiteboard);
    }

    public startDrawing(event:MouseEvent){
        if(event.button === 0){
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
            this.whiteboard.currentDrawing = {
                points:[{x, y}],
                color: this.whiteboard.sharedVariables.lineColor.value as string,
                lineWidth: this.whiteboard.sharedVariables.lineThickness.value as number,
                selected: false
            }
            this.whiteboard.lastX = x;
            this.whiteboard.lastY = y;
        }
    }

    public continueDrawing(event:MouseEvent){
        if(this.whiteboard.currentDrawing && this.whiteboard.lastX !== null && this.whiteboard.lastY !== null){
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();

            let dx = x - this.whiteboard.lastX;
            let dy = y - this.whiteboard.lastY;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if(distance > 2 || this.whiteboard.currentDrawing.points.length < 3){
                this.whiteboard.currentDrawing.points.push({x, y});
                this.whiteboard.lastX = x;
                this.whiteboard.lastY = y;
                this.whiteboard.redraw();
            }
        }
    }

    public finishDrawing(event:MouseEvent){
        if(this.whiteboard.currentDrawing){
            this.whiteboard.drawings.push(this.whiteboard.currentDrawing);
            this.whiteboard.currentDrawing = null;
        }
        this.whiteboard.lastX = null;
        this.whiteboard.lastY = null;
    }
}

class Eraser extends Tool{

    private erasing:boolean = false;

    constructor(whiteboard:WhiteBoard){
        super(whiteboard);
    }
    
    public startErasing(event: MouseEvent) {
        if (!this.whiteboard.currentDrawing) {
            this.erasing = true;
            let radius: number = 10;
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
            this.whiteboard.drawings = this.whiteboard.drawings.filter((draw) => {
                return !this.isDrawingInEraseRadius(draw, x, y, radius);
            });
            this.whiteboard.redraw();
        }
    }

    private isDrawingInEraseRadius(drawing: IDrawing, x: number, y: number, radius: number): boolean {
        for (let i = 0; i < drawing.points.length - 1; i++) {
            let point1 = drawing.points[i];
            let point2 = drawing.points[i + 1];
            if (this.isPointNearLine(drawing.lineWidth, point1, point2, { x, y }, radius)) {
                return true;
            }
        }
        return false;
    }

    private isPointNearLine(lineWidth:number, point1: { x: number, y: number }, point2: { x: number, y: number }, point: { x: number, y: number }, radius: number): boolean {
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
        } else if (param > 1) {
            xx = point2.x;
            yy = point2.y;
        } else {
            xx = point1.x + param * C;
            yy = point1.y + param * D;
        }

        let dx = point.x - xx;
        let dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy) <= (lineWidth/2) + ((this.whiteboard.sharedVariables.eraserThickness.value as number) / 2);
    }

    public continueErasing(event:MouseEvent){
        if(this.erasing){
            this.startErasing(event);
        }
    }

    public finishErasing(event:MouseEvent){
        if(this.erasing){
            this.erasing = false;
        }
    }
}

class Cursor extends Tool{

    public selecting:boolean = false;

    constructor(whiteboard:WhiteBoard){
        super(whiteboard);
    }

    public startSelection(event: MouseEvent) {
        if (!this.whiteboard.currentDrawing) {
            this.selecting = true;
        }
    }

    private isDrawingInEraseRadius(drawing: IDrawing, x: number, y: number, radius: number): boolean {
        for (let i = 0; i < drawing.points.length - 1; i++) {
            let point1 = drawing.points[i];
            let point2 = drawing.points[i + 1];
            if (this.isPointNearLine(drawing.lineWidth, point1, point2, { x, y }, radius)) {
                return true;
            }
        }
        return false;
    }

    private isPointNearLine(lineWidth:number, point1: { x: number, y: number }, point2: { x: number, y: number }, point: { x: number, y: number }, radius: number): boolean {
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
        } else if (param > 1) {
            xx = point2.x;
            yy = point2.y;
        } else {
            xx = point1.x + param * C;
            yy = point1.y + param * D;
        }

        let dx = point.x - xx;
        let dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy) <= (lineWidth/2) + ((this.whiteboard.sharedVariables.eraserThickness.value as number) / 2);
    }

    private isPointInSelectionArea(points: { x: number, y: number }[], selectionArea:ISelectionArea):boolean{

        let minX = Math.min(selectionArea.start.x, selectionArea.end.x);
        let maxX = Math.max(selectionArea.start.x, selectionArea.end.x);
        let minY = Math.min(selectionArea.start.y, selectionArea.end.y);
        let maxY = Math.max(selectionArea.start.y, selectionArea.end.y);

        for(let point of points){
            if(point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY){
                return true;
            }
        }
        return false;
    }

    public continueSelection(event:MouseEvent){
        if(this.selecting){
            let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
            let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
            if(!this.whiteboard.currentSelectionArea){
                this.whiteboard.currentSelectionArea = {
                    start: {x, y},
                    color: this.whiteboard.sharedVariables.selectionLineColor,
                    end: {x, y},
                    lineWidth: this.whiteboard.sharedVariables.selectionLineWidth
                };
            }else{
                
                this.whiteboard.drawings.forEach((draw) => {
                    draw.selected = this.isPointInSelectionArea(draw.points, this.whiteboard.currentSelectionArea as ISelectionArea)
                })
                this.whiteboard.currentSelectionArea.end = {x, y}
            }
            this.whiteboard.redraw();
        }
    }

    public finishSelection(event:MouseEvent){
        if(this.selecting){
            this.selecting = false;

            if(this.whiteboard.currentSelectionArea){
                this.whiteboard.currentSelectionArea = null;

            }else{
                let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
                let y = event.offsetY - this.whiteboard.getCurrentTranslateY();

                this.whiteboard.drawings.forEach((draw) => {
                    if(this.isDrawingInEraseRadius(draw, x, y, 1)){
                        draw.selected = true;
                    }else{
                        draw.selected = false;
                    };
                });
            }
            this.whiteboard.redraw();
        }
    }
}

class Hand extends Tool{

    public dragging:boolean = false;

    constructor(whiteboard: WhiteBoard){
        super(whiteboard);
    }

    public startDragging(event:MouseEvent){
        this.dragging = true;
        let x = event.offsetX - this.whiteboard.getCurrentTranslateX();
        let y = event.offsetY - this.whiteboard.getCurrentTranslateY();
        console.log('started to dragging');
    }

    public continueDragging(event:MouseEvent){

    }

    public finishDragging(event:MouseEvent){
        if(this.dragging){
            this.dragging = false;
        }
    }
}

class WhiteBoard{

    private pen:Pen = new Pen(this);
    private eraser:Eraser = new Eraser(this);
    private cursor:Cursor = new Cursor(this);
    private hand:Hand = new Hand(this);

    public sharedVariables:SharedVariables;
    public drawings: IDrawing[] = [];
    private redoDrawings: IDrawing[] = [];
    public currentDrawing: IDrawing | null = null;
    public currentSelectionArea: ISelectionArea | null = null;

    private canvas : HTMLCanvasElement = document.getElementById("whiteboard") as HTMLCanvasElement;
    private ctx:CanvasRenderingContext2D;

    public lastX: number | null = null;
    public lastY: number | null = null;

    constructor(sharedVariables:SharedVariables){
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.sharedVariables = sharedVariables;
        this.resizeCanvas();
        this.setupEventListeners();
    }

    private setupEventListeners(){
        this.canvas.addEventListener("mousedown", this.mouseDownEventListener.bind(this))
        this.canvas.addEventListener("mousemove", this.mouseMoveEventListener.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseUpEventListener.bind(this));
        this.canvas.addEventListener("mouseleave", this.mouseLeaveEventListener.bind(this));
        window.addEventListener("resize", this.resizeCanvas.bind(this))
        window.addEventListener("keydown", this.keyDown.bind(this));
        window.addEventListener("toolchanged", this.toolChangedEventListener.bind(this));
    }

    private mouseDownEventListener(event:MouseEvent):void{
        if(this.sharedVariables.actualTool === ETools.Pen){
            this.pen.startDrawing.bind(this.pen)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Eraser){
            this.eraser.startErasing.bind(this.eraser)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Cursor){
            this.cursor.startSelection.bind(this.cursor)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Hand){
            this.hand.startDragging.bind(this.hand)(event);
        }
    }

    private mouseMoveEventListener(event:MouseEvent):void{
        if(this.sharedVariables.actualTool === ETools.Pen){
            this.pen.continueDrawing.bind(this.pen)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Eraser){
            this.eraser.continueErasing.bind(this.eraser)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Cursor){
            this.cursor.continueSelection.bind(this.cursor)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Hand){
            this.hand.continueDragging.bind(this.hand)(event);
        }
    }

    private mouseUpEventListener(event:MouseEvent):void{
        if(this.sharedVariables.actualTool === ETools.Pen){
            this.pen.finishDrawing.bind(this.pen)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Eraser){
            this.eraser.finishErasing.bind(this.eraser)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Cursor){
            this.cursor.finishSelection.bind(this.cursor)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Hand){
            this.hand.finishDragging.bind(this.hand)(event);
        }
        
    }

    private mouseLeaveEventListener(event:MouseEvent):void{
        if(this.sharedVariables.actualTool === ETools.Pen){
            this.pen.finishDrawing.bind(this.pen)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Eraser){
            this.eraser.finishErasing.bind(this.eraser)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Cursor){
            this.cursor.finishSelection.bind(this.cursor)(event);
        }
        else if(this.sharedVariables.actualTool === ETools.Hand){
            this.hand.finishDragging.bind(this.hand)(event);
        }
    }
    
    private toolChangedEventListener(event:Event):void{
        let value = (event as CustomEvent).detail
        if(value){
            switch (this.sharedVariables.actualTool){
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

    private keyDown(event:KeyboardEvent){
        event.preventDefault();
        let key = event.key.toLowerCase();
        
        if(event.ctrlKey){
            if(key === "z"){
                let undo = this.drawings.pop() as IDrawing;
                    if(undo){
                        this.redoDrawings.push(undo);
                        this.redraw();
                    }
                }
            else if(key === "y"){
                let redo = this.redoDrawings.pop() as IDrawing;
                if(redo){
                    this.drawings.push(redo);
                    this.redraw();
                }
            }
            else if(key === "c"){
                this.drawings = [];
                this.redoDrawings = [];
                this.redraw();
            }
        }
        if(key === "arrowleft" || key === "a"){
            this.ctx.translate(-5, 0);
            this.redraw();
        }
        else if(key==="arrowright" || key === "d"){
            this.ctx.translate(5, 0);
            this.redraw();
        }
        else if(key==="arrowdown" || key === "s"){
            this.ctx.translate(0, 5);
            this.redraw();
        }
        else if(key ==="arrowup" || key === "w"){
            this.ctx.translate(0, -5);
            this.redraw();
        }
        else if(key === "f"){
            const newtab = window.open();
            if(newtab){
                const imageUrl = this.canvas.toDataURL('image/png');
                newtab.document.write(`<img src="${imageUrl}" alt="">`)
            }
            this.setAbsoluteTranslate(0, 0);
            this.redraw();
        }else if(key === "delete"){
            this.drawings = this.drawings.filter((draw)=> {
                return draw.selected == false
            })
            this.redraw();
            console.log('acho que foi');
        }
    }

    private setAbsoluteTranslate(x:number, y:number):void{
        let currentTranslateX = this.getCurrentTranslateX();
        let currentTranslateY = this.getCurrentTranslateY();
        let deltaX = x - currentTranslateX;
        let deltaY = y - currentTranslateY;
        this.ctx.translate(deltaX, deltaY);
    }

    public getCurrentTranslateX(){
        return this.ctx.getTransform().e;
    }

    public getCurrentTranslateY(){
        return this.ctx.getTransform().f;
    }

    public redraw(){
        let x = 0 - this.getCurrentTranslateX();
        let y = 0 - this.getCurrentTranslateY();
        this.ctx.clearRect(x,y, this.canvas.width, this.canvas.height);

        this.drawings.forEach(drawing => {
            this.drawSmoothLine(drawing.points, drawing.color, drawing.lineWidth, drawing.selected);
        });

        let currentD = this.currentDrawing;
        if (currentD) {
            this.drawSmoothLine(currentD.points, currentD.color, currentD.lineWidth, currentD.selected);
        }


        let currentSA = this.currentSelectionArea;
        if(currentSA){
            this.drawSelectionArea(currentSA.start, currentSA.end, currentSA.color, currentSA.lineWidth);
        }
    }

    private drawSelectionArea(start: { x: number, y: number}, end: { x: number, y: number}, color: string, lineWidth: number){
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);

        let width = end.x - start.x
        let height = end.y - start.y

        this.ctx.rect(start.x, start.y, width, height)
        this.ctx.fillStyle = this.sharedVariables.selectionFillColor;
        this.ctx.fill();

        this.ctx.stroke();

    }

    private drawSmoothLine(points: { x: number, y: number}[], color: string, lineWidth: number, selected: boolean) {
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
        if(selected){
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

    private resizeCanvas ():void{
        const bounding:DOMRect = this.canvas.getBoundingClientRect();
        this.canvas.width = bounding.width;
        this.canvas.height = bounding.height;
        this.redraw();
    }
}

document.addEventListener("DOMContentLoaded", (e:Event) => {
    const sharedVariables = new SharedVariables();
    const whiteboard = new WhiteBoard(sharedVariables);
    const toolBar = new ToolBar(sharedVariables);
})

