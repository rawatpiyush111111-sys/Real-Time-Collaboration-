#  🎨Real-Time-Collaboration-
Real-time Collaboration Tool such as document editor or whiteboard using WebSocket Protocol.


A real-time collaborative whiteboard application built with WebSocket technology. 
Multiple users can draw simultaneously and see each other's changes in real-time.

## Features

- **Real-time Collaboration**: Multiple users can draw simultaneously
- **Live Cursors**: See other users' cursor positions in real-time
- **Customizable Tools**: Adjustable brush size and color selection
- **User Management**: Unique user IDs and colors for each participant
- **Responsive Design**: Works on desktop and mobile devices
- **Touch Support**: Full touch screen compatibility
- **Auto-reconnection**: Automatically reconnects when connection is lost
- **Canvas Clearing**: Clear the entire canvas (affects all users)

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws library)
- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Real-time Communication**: WebSocket protocol

## Project Structure

```
collaborative-whiteboard/
├── server.js              # WebSocket server
├── package.json           # Node.js dependencies
├── README.md             # This file
└── public/               # Client-side files
    ├── index.html        # Main HTML page
    ├── style.css         # Styling
    └── script.js         # Client-side JavaScript
```

## Installation & Setup

1. **Clone or create the project directory**:
   ```bash
   mkdir collaborative-whiteboard
   cd collaborative-whiteboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **For development with auto-reload**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to `http://localhost:3000`

## How It Works

### Server Side (server.js)
- Creates an Express server with WebSocket support
- Manages client connections and broadcasts messages
- Stores drawing data and synchronizes it with new clients
- Handles user management (IDs, colors, cursor positions)

### Client Side (public/)
- **index.html**: Main interface with canvas and controls
- **style.css**: Modern, responsive styling with glassmorphism effects
- **script.js**: Canvas drawing logic and WebSocket communication

## WebSocket Message Types

### Client to Server:
- `draw`: Drawing stroke data (coordinates, color, brush size)
- `clear`: Clear canvas request
- `cursor`: Cursor position updates

### Server to Client:
- `user_connected`: Initial connection with user info and existing data
- `draw`: Broadcast drawing strokes from other users
- `clear`: Canvas clear notification
- `cursor`: Other users' cursor positions
- `user_count`: Current number of connected users

## Key Features Explained

### Real-time Drawing
Each drawing stroke is immediately broadcast to all connected users, creating a seamless collaborative experience.

### User Identification
Each user gets a unique ID and random color assignment for easy identification of contributions.

### Canvas Persistence
New users joining see the complete current state of the canvas, including all previous drawings.

### Mobile Support
Touch events are properly handled for mobile devices, providing the same functionality as desktop.

### Connection Management
Automatic reconnection attempts when the connection is lost, with visual status indicators.

## Customization Options

### Adding New Tools
Extend the application by adding new drawing tools in `script.js`:
- Different brush shapes
- Text tools
- Shape tools (rectangles, circles)
- Eraser functionality

### Styling
Modify `style.css` to change:
- Color schemes
- Layout arrangements
- Animation effects
- Responsive breakpoints

### Server Configuration
Adjust server settings in `server.js`:
- Port configuration
- Connection limits
- Data retention policies
- Rate limiting

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Performance Considerations

- Canvas operations are optimized for smooth drawing
- WebSocket messages are kept minimal for low latency
- Cursor updates are throttled to prevent spam
- Drawing data is stored efficiently in memory

## Deployment

For production deployment:

1. Set the PORT environment variable
2. Use a process manager like PM2
3. Consider adding SSL for secure WebSocket connections
4. Implement data persistence (database) for drawing history
5. Add user authentication if needed

## Contributing

Feel free to fork this project and submit pull requests for improvements!

## License

MIT License - feel free to use this code for your own projects.
