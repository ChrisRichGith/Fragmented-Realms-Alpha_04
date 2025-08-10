const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const connectedUsers = new Map(); // Stores username -> socket.id

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log(`A user connected with socket id: ${socket.id}`);

    // --- Registration ---
    socket.on('register', async ({ username, email, password }) => {
        try {
            const isAdmin = (email === 'christiandittrich74@googlemail.com');
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.createUser(username, email, hashedPassword, isAdmin);
            socket.emit('register success');
        } catch (error) {
            socket.emit('register failed', { message: error.message });
        }
    });

    // --- Login ---
    socket.on('login', async ({ identifier, password }) => {
        try {
            let user = db.findUserByUsername(identifier) || db.findUserByEmail(identifier);

            if (!user) {
                return socket.emit('login failed', { message: 'Benutzer nicht gefunden.' });
            }

            if (user.isBanned) {
                return socket.emit('login failed', { message: 'Dieses Konto wurde gesperrt.' });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return socket.emit('login failed', { message: 'Ungültiges Passwort.' });
            }

            if (connectedUsers.has(user.username)) {
                const oldSocketId = connectedUsers.get(user.username);
                const oldSocket = io.sockets.sockets.get(oldSocketId);
                if (oldSocket) {
                    oldSocket.emit('force logout');
                    oldSocket.disconnect();
                }
            }

            socket.username = user.username;
            connectedUsers.set(user.username, socket.id);
            await db.setUserOnline(user.username, true);

            socket.emit('login success', {
                username: user.username,
                isAdmin: user.isAdmin,
            });

            socket.emit('user data', {
                resources: user.resources,
                unlockedGames: user.unlockedGames,
            });
            
            io.emit('user list', Array.from(connectedUsers.keys()));
            io.emit('chat message', { user: 'System', text: `${user.username} ist dem Spiel beigetreten.` });

        } catch (error) {
            console.error('Login error:', error);
            socket.emit('login failed', { message: 'Ein interner Fehler ist aufgetreten.' });
        }
    });

    // --- Chat ---
    socket.on('chat message', (msg) => {
        if (socket.username) {
            io.emit('chat message', {
                user: socket.username,
                text: msg.text,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // --- Logout & Disconnect ---
    const handleDisconnect = async () => {
        if (socket.username && connectedUsers.get(socket.username) === socket.id) {
            console.log(`User ${socket.username} disconnected.`);
            await db.setUserOnline(socket.username, false);
            connectedUsers.delete(socket.username);
            io.emit('user list', Array.from(connectedUsers.keys()));
            io.emit('chat message', { user: 'System', text: `${socket.username} hat das Spiel verlassen.` });
        }
    };

    socket.on('logout', handleDisconnect);
    socket.on('disconnect', handleDisconnect);

    // --- Admin Handlers ---
    function isAdmin(username) {
        const user = db.findUserByUsername(username);
        return user && user.isAdmin;
    }

    socket.on('admin:get-all-users', () => {
        if (isAdmin(socket.username)) {
            socket.emit('admin:all-users', db.getAllUsers());
        }
    });
    
    socket.on('admin:get-user-data', (username, callback) => {
        if (isAdmin(socket.username)) {
            callback(db.findUserByUsername(username));
        }
    });

    socket.on('admin:update-resources', async ({ targetUsername, resources }) => {
        if (isAdmin(socket.username)) {
            await db.updateUser(targetUsername, { resources });
        }
    });
    
    socket.on('admin:update-games', async ({ targetUsername, unlockedGames }) => {
        if (isAdmin(socket.username)) {
            await db.updateUser(targetUsername, { unlockedGames });
        }
    });

    socket.on('admin:reset-password', async ({ targetUsername, newPassword }) => {
        if (isAdmin(socket.username)) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.updateUserPassword(targetUsername, hashedPassword);
        }
    });

    socket.on('admin:delete-user', async ({ targetUsername }) => {
        if (isAdmin(socket.username)) {
            await db.deleteUser(targetUsername);
            const targetSocketId = connectedUsers.get(targetUsername);
            if (targetSocketId) {
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit('force logout');
                    targetSocket.disconnect();
                }
            }
            io.emit('user list', Array.from(connectedUsers.keys()));
        }
    });

    socket.on('admin:kick', (targetUsername) => {
        if (isAdmin(socket.username)) {
            const targetSocketId = connectedUsers.get(targetUsername);
            if (targetSocketId) {
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit('force logout');
                    targetSocket.disconnect();
                }
            }
        }
    });

    socket.on('admin:ban', async (targetUsername) => {
        if (isAdmin(socket.username)) {
            await db.updateUser(targetUsername, { isBanned: true });
            const targetSocketId = connectedUsers.get(targetUsername);
            if (targetSocketId) {
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.emit('force logout');
                    targetSocket.disconnect();
                }
            }
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
