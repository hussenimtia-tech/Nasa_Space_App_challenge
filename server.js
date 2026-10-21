
/*
 * SpaceSkribble - Multiplayer Server
 * Port: 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const { Room, makeRoomCode } = require('./public/engine.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const AUTH_DB_PATH = path.join(__dirname, 'database', 'auth.db');
const TICK_MS = 250;

const db = new Database(AUTH_DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is missing or too short.');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Static file server
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/.netlify/images') {
      res.writeHead(302, {
        Location: url.searchParams.get('url') || '/'
      });
      return res.end();
    }

    let pathname = decodeURIComponent(url.pathname);

    if (pathname.includes('\0')) {
      res.writeHead(400);
      return res.end('Bad request');
    }

    let file = path.resolve(
      PUBLIC_DIR,
      '.' + pathname
    );

    if (file !== PUBLIC_DIR &&
        !file.startsWith(PUBLIC_DIR + path.sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }

    if (!fs.existsSync(file) && !path.extname(file)) {
      file += '.html';
    }

    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404, {
          'Content-Type': 'text/plain; charset=utf-8'
        });
        return res.end('Not found');
      }

      res.writeHead(200, {
        'Content-Type':
          MIME[path.extname(file).toLowerCase()] ||
          'application/octet-stream'
      });

      res.end(data);
    });
  } catch {
    res.writeHead(400);
    res.end('Bad request');
  }
});

const io = new Server(server, {
  cors: { origin: '*' }
});

// Verify login token
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    socket.data.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'spaceskribble'
    });

    if (!Number.isInteger(decoded.userId)) {
      return next(new Error('Invalid login token.'));
    }

    socket.data.userId = decoded.userId;

    console.log('Game socket authenticated:', decoded.userId);
    next();
  } catch (error) {
    console.error('Game socket authentication failed:', error.message);
    next(new Error('Login expired. Please log in again.'));
  }
});

// Prevent duplicate XP awards
db.exec(`
  CREATE TABLE IF NOT EXISTS learning_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const saveLearningProgress = db.transaction((userId, eventKey) => {
  const inserted = db.prepare(`
    INSERT OR IGNORE INTO learning_events (user_id, event_key)
    VALUES (?, ?)
  `).run(userId, eventKey);

  if (inserted.changes === 0) return;

  db.prepare(`
    INSERT OR IGNORE INTO learning_progress (user_id)
    VALUES (?)
  `).run(userId);

  db.prepare(`
    UPDATE learning_progress
    SET correct_answers = correct_answers + 1,
        xp = xp + 10,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(userId);
});

const rooms = new Map();

function createRoom() {
  let code;

  do {
    code = makeRoomCode();
  } while (rooms.has(code));

  const room = new Room({
    code,

    emit(to, event, payload) {
      if (to === 'all') {
        io.to(code).emit('evt', { event, payload });
      } else if (to && to.except) {
        io.to(code)
          .except(to.except)
          .emit('evt', { event, payload });
      } else {
        io.to(to).emit('evt', { event, payload });
      }
    }
  });

room.onCorrectGuess = async (player, details) => {
  if (!player?.userId) {
    console.log("XP not saved: player is not authenticated.");
    return;
  }

  const eventKey =
    `guess:${details.roomCode}:${details.turnIndex}:${player.userId}`;

  try {
    const response = await fetch(
      "http://localhost:3001/internal/progress",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-progress-secret":
            process.env.INTERNAL_PROGRESS_SECRET ||
            "local-progress-secret-change-this"
        },
        body: JSON.stringify({
          userId: player.userId,
          eventKey
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("XP save failed:", result);
      return;
    }

    console.log("Account progress API response:", result);
  } catch (error) {
    console.error("Learning progress save failed:", error.message);
  }
};


  rooms.set(code, room);
  return room;
}

io.on('connection', (socket) => {
  let room = null;

  function sendError(message) {
    socket.emit('evt', {
      event: 'error',
      payload: { message }
    });
  }

  function enter(target, profile) {
    const result = target.join(socket.id, profile);

    if (result.error) {
      return sendError(result.error);
    }

    const player = target.players.get(socket.id);

    if (player && socket.data.userId) {
      player.userId = socket.data.userId;
    }

    room = target;
    socket.join(target.code);

    socket.emit('evt', {
      event: 'joined',
      payload: {
        code: target.code,
        you: socket.id
      }
    });

    target.broadcastState();
  }

  socket.on('evt', ({ event, payload } = {}) => {
    if (!event) return;

    try {
      switch (event) {
        case 'createRoom': {
          const target = createRoom();
          enter(target, payload?.profile || payload || {});
          break;
        }

        case 'joinRoom': {
          const code = String(
            payload?.code || ''
          ).trim().toUpperCase();

          const target = rooms.get(code);

          if (!target) {
            return sendError('Room not found.');
          }

          enter(target, payload?.profile || {});
          break;
        }

        case 'leaveRoom': {
          if (room) {
            room.leave(socket.id);
            socket.leave(room.code);
            room.broadcastState();
            room = null;
          }
          break;
        }

        default: {
          if (!room) {
            return sendError('Join a room first.');
          }

          if (typeof room.handleEvent === 'function') {
            room.handleEvent(socket.id, event, payload);
          } else {
            sendError(
              'This game event is not configured: ' + event
            );
          }
        }
      }
    } catch (error) {
      console.error('Socket event error:', error);
      sendError('Could not process the game action.');
    }
  });

  socket.on('disconnect', () => {
    if (room) {
      room.leave(socket.id);
      room.broadcastState();
      room = null;
    }
  });
});

// Periodic game updates
const ticker = setInterval(() => {
  for (const room of rooms.values()) {
    if (typeof room.tick === 'function') {
      try {
        room.tick(TICK_MS);
      } catch (error) {
        console.error('Room tick error:', error);
      }
    }
  }
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`SpaceSkribble server: http://localhost:${PORT}`);
});

function shutdown() {
  clearInterval(ticker);

  io.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);