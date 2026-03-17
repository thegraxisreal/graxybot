const { io } = require('socket.io-client');
const DeltaMathController = require('./deltamathController');

const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3001';

console.log(`🔌 Connecting to broker at ${RELAY_URL}...`);

const socket = io(RELAY_URL, {
    query: { role: 'agent' },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
});

// Fake io object — controller emits go back through the socket to the broker
const fakeIo = {
    emit: (event, data) => socket.emit(event, data)
};

const controller = new DeltaMathController(fakeIo);

socket.on('connect', () => {
    console.log('✅ Connected to broker as local agent');
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err.message);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from broker:', reason);
});

socket.on('launch-agent', async (creds) => {
    console.log('📨 Received launch-agent from broker');
    try {
        await controller.startAgent(creds);
        socket.emit('status', 'Agent Launched - Attempting Login');
    } catch (e) {
        console.error('Launch Error:', e);
        socket.emit('status', 'Error launching agent');
    }
});

socket.on('stop-agent', async () => {
    await controller.stopAgent();
    socket.emit('status', 'Agent Stopped');
});

socket.on('start-ai', () => {
    socket.emit('status', 'AI Autonomous Mode Started');
    controller.startAutonomousLoop();
});

socket.on('pause-ai', async () => {
    await controller.pauseAgent();
});

socket.on('click', async (data) => {
    await controller.handleUserClick(data.x, data.y);
});

socket.on('type', async (data) => {
    await controller.handleUserType(data.text);
});

socket.on('keypress', async (data) => {
    await controller.handleUserKey(data.key);
});
