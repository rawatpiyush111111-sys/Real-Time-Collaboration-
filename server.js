const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients and drawing data
const clients = new Set();
const drawingData = [];

// Generate unique user ID
function generateUserId() {
  return Math.random().toString(36).substr(2, 9);
}

// Generate random color for user
function generateUserColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  return colors[Math.floor(Math.random() * colors.length)];
}

wss.on('connection', (ws) => {
  const userId = generateUserId();
  const userColor = generateUserColor();
  
  // Add client to set
  clients.add(ws);
  
  // Send user info and existing drawing data
  ws.send(JSON.stringify({
    type: 'user_connected',
    userId: userId,
    userColor: userColor,
    drawingData: drawingData
  }));
  
  // Broadcast user count
  broadcastUserCount();
  
  console.log(`User ${userId} connected. Total users: ${clients.size}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'draw':
          // Store drawing data
          const drawData = {
            ...data,
            userId: userId,
            userColor: userColor,
            timestamp: Date.now()
          };
          drawingData.push(drawData);
          
          // Broadcast to all other clients
          broadcast(drawData, ws);
          break;
          
        case 'clear':
          // Clear drawing data
          drawingData.length = 0;
          broadcast({ type: 'clear' }, ws);
          break;
          
        case 'cursor':
          // Broadcast cursor position
          broadcast({
            type: 'cursor',
            userId: userId,
            userColor: userColor,
            x: data.x,
            y: data.y
          }, ws);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    broadcastUserCount();
    console.log(`User ${userId} disconnected. Total users: ${clients.size}`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast message to all clients except sender
function broadcast(data, sender = null) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Broadcast user count to all clients
function broadcastUserCount() {
  broadcast({
    type: 'user_count',
    count: clients.size
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});