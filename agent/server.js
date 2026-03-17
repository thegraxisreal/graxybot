console.log("STEP 1: Starting server.js...");
const express = require('express');
console.log("STEP 2: Express loaded");
const http = require('http');
console.log("STEP 3: HTTP loaded");
const { Server } = require('socket.io');
console.log("STEP 4: Socket.io loaded");
const path = require('path');
const DeltaMathController = require('./deltamathController');
console.log("STEP 5: DeltaMathController loaded");

const app = express();
const server = http.createServer(app);
console.log("STEP 6: Server created");

const io = new Server(server, {
    maxHttpBufferSize: 1e8, // 100 MB
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["my-custom-header", "bypass-tunnel-reminder"],
        credentials: true
    }
});
console.log("STEP 7: Socket.io initialized");

const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Serve static files from the graxybot directory (one level up)
app.use(express.static(path.join(__dirname, '../graxybot')));
app.use('/root', express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../graxybot', 'graxybot.html'));
});

// Controller Instance
const agentController = new DeltaMathController(io);
console.log("STEP 8: Controller instantiated");

let activeControllerId = null;
let sessionTimeout = null;

const SESSION_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

function clearSessionTimeout() {
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
}

async function endSession(reason = 'Session ended') {
    clearSessionTimeout();
    await agentController.stopAgent();
    if (activeControllerId) {
        io.to(activeControllerId).emit('status', reason);
    }
    activeControllerId = null;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('launch-agent', async (creds) => {
        if (agentController.isAgentActive && activeControllerId !== socket.id) {
            socket.emit('status', 'Agent Busy - Another user is currently using it.');
            return;
        }

        try {
            activeControllerId = socket.id;
            await agentController.startAgent(creds);
            socket.emit('status', 'Agent Launched - Attempting Login');

            // Start 10-minute session timeout
            clearSessionTimeout();
            sessionTimeout = setTimeout(() => {
                console.log('⏰ Session time limit reached. Stopping agent.');
                endSession('Session time limit reached (10 min). Agent stopped.');
            }, SESSION_LIMIT_MS);
        } catch (e) {
            console.error("Launch Error:", e);
            socket.emit('status', 'Error launching agent');
            activeControllerId = null;
        }
    });

    socket.on('stop-agent', async () => {
        if (activeControllerId === socket.id || !activeControllerId) {
            await endSession('Agent Stopped');
        }
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        if (activeControllerId === socket.id) {
            console.log('Active controller disconnected. Stopping agent...');
            await endSession('User disconnected. Agent stopped.');
        }
    });

    socket.on('start-ai', async () => {
        if (activeControllerId === socket.id) {
            socket.emit('status', 'AI Autonomous Mode Started');
            agentController.startAutonomousLoop();
        }
    });

    socket.on('pause-ai', async () => {
        if (activeControllerId === socket.id) {
            await agentController.pauseAgent();
        }
    });

    // Interaction Events
    socket.on('click', async (data) => {
        if (activeControllerId === socket.id) {
            await agentController.handleUserClick(data.x, data.y);
        }
    });

    socket.on('type', async (data) => {
        if (activeControllerId === socket.id) {
            await agentController.handleUserType(data.text);
        }
    });

    socket.on('keypress', async (data) => {
        if (activeControllerId === socket.id) {
            await agentController.handleUserKey(data.key);
        }
    });
});

console.log("STEP 9: Attempting to listen on port", port);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Graxybot Console running at http://localhost:${PORT}`);
    console.log("STEP 10: Server listening!");
});
