class CollaborativeWhiteboard {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.cursorsContainer = document.getElementById('cursors');
        
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.userId = null;
        this.userColor = '#000000';
        this.brushSize = 5;
        
        this.activeCursors = new Map();
        
        this.initCanvas();
        this.initWebSocket();
        this.initEventListeners();
    }
    
    initCanvas() {
        // Set canvas size
        this.canvas.width = 1200;
        this.canvas.height = 700;
        
        // Set canvas style
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.userColor;
        this.ctx.lineWidth = this.brushSize;
    }
    
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.updateConnectionStatus('connected');
            console.log('Connected to WebSocket server');
        };
        
        this.ws.onclose = () => {
            this.updateConnectionStatus('disconnected');
            console.log('Disconnected from WebSocket server');
            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.initWebSocket(), 3000);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('disconnected');
        };
        
        this.ws.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'user_connected':
                this.userId = data.userId;
                this.userColor = data.userColor;
                this.updateUserInfo();
                // Redraw existing drawing data
                this.redrawCanvas(data.drawingData);
                break;
                
            case 'draw':
                this.drawRemoteStroke(data);
                break;
                
            case 'clear':
                this.clearCanvas();
                break;
                
            case 'cursor':
                this.updateRemoteCursor(data);
                break;
                
            case 'user_count':
                this.updateUserCount(data.count);
                break;
        }
    }
    
    initEventListeners() {
        // Drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Cursor tracking
        this.canvas.addEventListener('mousemove', this.trackCursor.bind(this));
        
        // Tool controls
        const brushSize = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        const brushColor = document.getElementById('brushColor');
        const clearBtn = document.getElementById('clearCanvas');
        
        brushSize.addEventListener('input', (e) => {
            this.brushSize = e.target.value;
            this.ctx.lineWidth = this.brushSize;
            brushSizeValue.textContent = this.brushSize;
        });
        
        brushColor.addEventListener('change', (e) => {
            this.userColor = e.target.value;
            this.ctx.strokeStyle = this.userColor;
        });
        
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear the entire canvas? This will affect all users.')) {
                this.clearCanvas();
                this.sendMessage({ type: 'clear' });
            }
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    getTouchPos(e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return this.getMousePos(touch);
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        // Send drawing data to server
        this.sendMessage({
            type: 'draw',
            fromX: this.lastX,
            fromY: this.lastY,
            toX: pos.x,
            toY: pos.y,
            color: this.userColor,
            size: this.brushSize
        });
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    trackCursor(e) {
        if (this.ws.readyState === WebSocket.OPEN) {
            const pos = this.getMousePos(e);
            this.sendMessage({
                type: 'cursor',
                x: pos.x,
                y: pos.y
            });
        }
    }
    
    drawRemoteStroke(data) {
        this.ctx.save();
        this.ctx.strokeStyle = data.userColor || data.color;
        this.ctx.lineWidth = data.size;
        this.ctx.beginPath();
        this.ctx.moveTo(data.fromX, data.fromY);
        this.ctx.lineTo(data.toX, data.toY);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    updateRemoteCursor(data) {
        if (data.userId === this.userId) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width / this.canvas.width;
        const scaleY = rect.height / this.canvas.height;
        
        const x = data.x * scaleX + rect.left;
        const y = data.y * scaleY + rect.top;
        
        let cursor = this.activeCursors.get(data.userId);
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'cursor';
            cursor.style.backgroundColor = data.userColor;
            this.cursorsContainer.appendChild(cursor);
            this.activeCursors.set(data.userId, cursor);
        }
        
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        
        // Remove cursor after inactivity
        clearTimeout(cursor.timeout);
        cursor.timeout = setTimeout(() => {
            if (cursor.parentNode) {
                cursor.parentNode.removeChild(cursor);
                this.activeCursors.delete(data.userId);
            }
        }, 3000);
    }
    
    redrawCanvas(drawingData) {
        this.clearCanvas();
        drawingData.forEach(stroke => {
            this.drawRemoteStroke(stroke);
        });
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    sendMessage(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.className = `status-${status}`;
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    updateUserCount(count) {
        document.getElementById('userCount').textContent = `Users: ${count}`;
    }
    
    updateUserInfo() {
        document.getElementById('userId').textContent = `ID: ${this.userId}`;
        document.getElementById('brushColor').value = this.userColor;
        this.ctx.strokeStyle = this.userColor;
    }
}

// Initialize the whiteboard when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new CollaborativeWhiteboard();
});