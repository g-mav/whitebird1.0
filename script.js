const canvas = document.getElementById('canvas');
const ctx = setupCanvas(canvas);
let isDrawing = false;
let currentTool = 'pencil';
let startX, startY;
let lastDrawn = null;
let tempCanvas, tempCtx;
let textPosition = { x: 0, y: 0 };
let isTextMode = false;
let activeTextBox = null;
let textBoxes = [];
let textBoxWidth = 0;
let textBoxHeight = 0;

// Set canvas size
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${window.innerWidth - 40}px`;
    canvas.style.height = `${window.innerHeight - 120}px`;
    canvas.width = (window.innerWidth - 40) * dpr;
    canvas.height = (window.innerHeight - 120) * dpr;
    ctx.scale(dpr, dpr);
    
    if (tempCanvas) {
        tempCanvas.style.width = canvas.style.width;
        tempCanvas.style.height = canvas.style.height;
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.scale(dpr, dpr);
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Tool selection
const tools = {
    pencil: { lineWidth: 2, lineCap: 'round', lineJoin: 'round' },
    pen: { lineWidth: 5, lineCap: 'round', lineJoin: 'round' },
    eraser: { lineWidth: 20, lineCap: 'round', lineJoin: 'round' }
};

// Event listeners for tools
document.getElementById('pencil').addEventListener('click', () => setTool('pencil'));
document.getElementById('pen').addEventListener('click', () => setTool('pen'));
document.getElementById('eraser').addEventListener('click', () => setTool('eraser'));
document.getElementById('shapes').addEventListener('change', (e) => setTool(e.target.value));
document.getElementById('clear').addEventListener('click', clearCanvas);
document.getElementById('text').addEventListener('click', () => setTool('text'));

// Color and stroke width controls
document.getElementById('strokeColor').addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value;
});

document.getElementById('strokeWidth').addEventListener('input', (e) => {
    ctx.lineWidth = e.target.value;
});

document.getElementById('bgColor').addEventListener('input', (e) => {
    const color = e.target.value;
    
    // Fill the entire canvas with the new background color
    ctx.save(); // Save the current context state
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore(); // Restore the context state
    
    // Update the eraser color to match the new background
    if (currentTool === 'eraser') {
        ctx.strokeStyle = color;
    }
    
    // Store the background color for future reference
    canvas.style.backgroundColor = color;
});

function setTool(toolName) {
    currentTool = toolName;
    document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(toolName)?.classList.add('active');
    
    if (tools[toolName]) {
        ctx.lineWidth = tools[toolName].lineWidth;
        ctx.lineCap = tools[toolName].lineCap;
        ctx.lineJoin = tools[toolName].lineJoin;
        
        if (toolName === 'eraser') {
            // Use the current canvas background color for eraser
            ctx.strokeStyle = canvas.style.backgroundColor || '#ffffff';
        } else {
            ctx.strokeStyle = document.getElementById('strokeColor').value;
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Remove all text boxes
    textBoxes.forEach(textBox => textBox.remove());
    textBoxes = [];
}

// Drawing functions
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

function startDrawing(e) {
    if (currentTool === 'text') {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [startX, startY] = [
            e.clientX - rect.left + window.scrollX,
            e.clientY - rect.top + window.scrollY
        ];
        // Initialize text box size
        textBoxWidth = 0;
        textBoxHeight = 0;
        return;
    }

    isDrawing = true;
    [startX, startY] = [e.offsetX, e.offsetY];
    ctx.beginPath();
    ctx.moveTo(startX, startY);
}

function draw(e) {
    if (!isDrawing) return;

    if (currentTool === 'text') {
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left + window.scrollX;
        const currentY = e.clientY - rect.top + window.scrollY;
        
        // Calculate width and height based on drag
        textBoxWidth = Math.abs(currentX - startX);
        textBoxHeight = Math.abs(currentY - startY);
        
        // Ensure minimum size
        textBoxWidth = Math.max(textBoxWidth, 100);
        textBoxHeight = Math.max(textBoxHeight, 24);
        
        // Calculate top-left corner for drawing
        const drawX = currentX > startX ? startX : startX - textBoxWidth;
        const drawY = currentY > startY ? startY : startY - textBoxHeight;
        
        // Draw preview
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.strokeStyle = '#999';
        tempCtx.setLineDash([5, 5]);
        tempCtx.strokeRect(drawX, drawY, textBoxWidth, textBoxHeight);
        return;
    }

    switch(currentTool) {
        case 'pencil':
        case 'pen':
        case 'eraser':
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            break;
        case 'rectangle':
        case 'circle':
        case 'line':
            // Clear the temporary canvas
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Don't copy the main canvas, just draw the preview shape
            tempCtx.strokeStyle = ctx.strokeStyle;
            tempCtx.lineWidth = ctx.lineWidth;
            
            // Draw preview shape
            switch(currentTool) {
                case 'rectangle':
                    drawRectangle(startX, startY, e.offsetX, e.offsetY, tempCtx);
                    break;
                case 'circle':
                    drawCircle(startX, startY, e.offsetX, e.offsetY, tempCtx);
                    break;
                case 'line':
                    drawLine(startX, startY, e.offsetX, e.offsetY, tempCtx);
                    break;
            }
            break;
    }
}

function drawRectangle(x1, y1, x2, y2, context) {
    context.beginPath();
    context.rect(x1, y1, x2 - x1, y2 - y1);
    context.stroke();
}

function drawCircle(x1, y1, x2, y2, context) {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    context.beginPath();
    context.arc(x1, y1, radius, 0, 2 * Math.PI);
    context.stroke();
}

function drawLine(x1, y1, x2, y2, context) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

function stopDrawing(e) {
    if (!isDrawing) return;

    if (currentTool === 'text') {
        const rect = canvas.getBoundingClientRect();
        const finalX = e.clientX - rect.left + window.scrollX;
        const finalY = e.clientY - rect.top + window.scrollY;
        
        // Calculate final position (top-left corner)
        const x = finalX > startX ? startX : startX - textBoxWidth;
        const y = finalY > startY ? startY : startY - textBoxHeight;
        
        // Clear preview
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.setLineDash([]); // Reset dash pattern
        
        // Create actual text box with the dragged dimensions
        const textBox = new TextBox(x, y, textBoxWidth, textBoxHeight);
        textBoxes.push(textBox);
        activeTextBox = textBox;
    } else if (['rectangle', 'circle', 'line'].includes(currentTool)) {
        // Draw the final shape on the main canvas
        switch(currentTool) {
            case 'rectangle':
                drawRectangle(startX, startY, e.offsetX, e.offsetY, ctx);
                break;
            case 'circle':
                drawCircle(startX, startY, e.offsetX, e.offsetY, ctx);
                break;
            case 'line':
                drawLine(startX, startY, e.offsetX, e.offsetY, ctx);
                break;
        }
        // Clear the temporary canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    isDrawing = false;
    ctx.beginPath();
}

// Initial setup
setTool('pencil');
initializeTempCanvas(); 

// Add this function after the resizeCanvas function
function initializeTempCanvas() {
    tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx = tempCanvas.getContext('2d');
    
    // Position the temporary canvas exactly over the main canvas
    tempCanvas.style.position = 'absolute';
    tempCanvas.style.top = canvas.offsetTop + 'px';
    tempCanvas.style.left = canvas.offsetLeft + 'px';
    tempCanvas.style.pointerEvents = 'none'; // Allows clicks to pass through to main canvas
    canvas.parentElement.appendChild(tempCanvas);
}

// Add this to the resizeCanvas function's event listener
window.addEventListener('resize', () => {
    resizeCanvas();
    // Update temp canvas position on resize
    if (tempCanvas) {
        tempCanvas.style.top = canvas.offsetTop + 'px';
        tempCanvas.style.left = canvas.offsetLeft + 'px';
    }
}); 

// Add this function at the top level to set up canvas text rendering
function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    // Enable font smoothing
    ctx.textRendering = 'optimizeLegibility';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    return ctx;
}

class TextBox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width || 100;
        this.height = height || 24;
        this.text = '';
        this.isEditing = true;
        this.element = this.createElement();
    }

    createElement() {
        const div = document.createElement('div');
        div.contentEditable = true;
        div.className = 'text-box';
        
        // Position and size the text box
        div.style.left = `${this.x}px`;
        div.style.top = `${this.y}px`;
        div.style.width = `${this.width}px`;
        div.style.height = `${this.height}px`;
        
        div.style.fontSize = `${document.getElementById('fontSize').value}px`;
        div.style.color = document.getElementById('strokeColor').value;
        div.textContent = 'Type here...'; // Add default text
        
        // Clear default text on first click
        div.addEventListener('focus', function firstClick() {
            if (this.textContent === 'Type here...') {
                this.textContent = '';
            }
            this.removeEventListener('focus', firstClick);
        });
        
        // Handle focus loss
        div.addEventListener('blur', () => {
            if (div.textContent.trim() === '' || div.textContent === 'Type here...') {
                div.remove();
                textBoxes = textBoxes.filter(tb => tb !== this);
            } else {
                this.isEditing = false;
                this.text = div.textContent;
                
                // Draw the text onto the canvas with better quality
                const fontSize = parseInt(div.style.fontSize);
                ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
                ctx.fillStyle = div.style.color;
                ctx.textBaseline = 'middle';
                
                // Draw the text at the exact position
                ctx.fillText(this.text, this.x, this.y);
                
                // Remove the text box div after drawing
                div.remove();
                textBoxes = textBoxes.filter(tb => tb !== this);
            }
            activeTextBox = null;
        });

        // Handle key presses
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                div.blur();
            }
        });

        // Handle double click for editing
        div.addEventListener('dblclick', () => {
            this.isEditing = true;
            activeTextBox = this;
            div.focus();
        });

        document.querySelector('.container').appendChild(div);
        setTimeout(() => div.focus(), 0);
        return div;
    }

    remove() {
        this.element.remove();
    }
}

// Add function to render text boxes to canvas
function renderTextBoxesToCanvas() {
    textBoxes.forEach(textBox => {
        if (!textBox.isEditing && textBox.text) {
            const fontSize = parseInt(textBox.element.style.fontSize);
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = textBox.element.style.color;
            ctx.fillText(textBox.text, textBox.x, textBox.y + fontSize * 0.7); // Adjust y position for baseline
        }
    });
}

// Add event listeners for font size and color changes
document.getElementById('fontSize').addEventListener('change', (e) => {
    if (activeTextBox) {
        activeTextBox.element.style.fontSize = `${e.target.value}px`;
    }
});

document.getElementById('strokeColor').addEventListener('input', (e) => {
    if (activeTextBox) {
        activeTextBox.element.style.color = e.target.value;
    }
    ctx.strokeStyle = e.target.value;
}); 