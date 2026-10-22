onst express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
 
const app = express();
 
// Database file location. On Render, set DB_PATH to a persistent disk path (e.g. /var/data/auth.db)
// if you add a Disk. Otherwise it uses ./database/auth.db (data resets on free-plan redeploys/restarts).
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "database", "auth.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
 
// Render (and most hosts) give the port through process.env.PORT.
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
 
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "Set JWT_SECRET to a random secret of at least 32 characters."
  );
}
 
// ---- CORS -----------------------------------------------------------------
// Allowed websites that may call this server. Add more with the ALLOWED_ORIGINS env var
// (comma separated), e.g. a custom domain.
const allowedOrigins = [
  "https://moonlit-platypus-a05368.netlify.app",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:8888",
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
];
 
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = curl/Postman/server-to-server, allow.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Progress-Secret"],
  })
);
app.use(express.json({ limit: "20kb" }));
 
// Enable SQLite WAL for safer concurrent access.
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
 
// Existing accounts table.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
  );
 
  CREATE TABLE IF NOT EXISTS learning_progress (
    user_id INTEGER PRIMARY KEY,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    completed_steps INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
  );
 
  CREATE TABLE IF NOT EXISTS learning_step_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    step_id TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, step_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS learning_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
  );
`);
const questions = [
  "What is your favorite planet?",
  "What was your childhood nickname?",
  "What is your favorite space mission?"
];
 
// Authentication middleware.
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
 
  if (!match) {
    return res.status(401).json({
      message: "Please log in first."
    });
  }
 
  try {
    const payload = jwt.verify(match[1], JWT_SECRET);
 
    if (!Number.isInteger(payload.userId)) {
      throw new Error("Invalid token payload");
    }
 
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({
      message: "Session expired. Please log in again."
    });
  }
}
 
// Health check (open the Render URL in a browser to see if the server is awake).
app.get("/", (req, res) => {
  res.json({ ok: true, service: "SpaceSkribble auth server" });
});
 
app.get("/questions", (req, res) => {
  res.json(questions);
});
 
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, question, answer } = req.body;
 
    if (!name || !email || !password || !question || !answer) {
      return res.status(400).json({
        message: "Fill in all fields."
      });
    }
 
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters."
      });
    }
 
    if (!questions.includes(question)) {
      return res.status(400).json({
        message: "Invalid security question."
      });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(
      answer.trim().toLowerCase(),
      10
    );
 
    const result = db.prepare(`
      INSERT INTO users (name, email, password, question, answer)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      email.trim().toLowerCase(),
      hashedPassword,
      question,
      hashedAnswer
    );
 
    db.prepare(`
      INSERT INTO learning_progress (user_id)
      VALUES (?)
    `).run(result.lastInsertRowid);
 
    res.status(201).json({
      message: "Registration successful!"
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        message: "Email already registered."
      });
    }
 
    console.error("Registration error:", error.message);
 
    res.status(500).json({
      message: "Registration failed."
    });
  }
});
 
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
 
    const user = db.prepare(`
      SELECT id, name, email, password
      FROM users
      WHERE email = ?
    `).get((email || "").trim().toLowerCase());
 
    if (
      !user ||
      !(await bcrypt.compare(password || "", user.password))
    ) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }
 
    db.prepare(`
      INSERT OR IGNORE INTO learning_progress (user_id)
      VALUES (?)
    `).run(user.id);
 
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "2h", issuer: "spaceskribble" }
    );
 
    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
 
    res.status(500).json({
      message: "Login failed."
    });
  }
});
const INTERNAL_PROGRESS_SECRET =
  process.env.INTERNAL_PROGRESS_SECRET ||
  "local-progress-secret-change-this";
 
app.post("/internal/progress", (req, res) => {
  try {
    if (
      req.headers["x-progress-secret"] !==
      INTERNAL_PROGRESS_SECRET
    ) {
      return res.status(401).json({
        message: "Unauthorized."
      });
    }
 
    const { userId, eventKey } = req.body;
 
    if (
      !Number.isInteger(userId) ||
      typeof eventKey !== "string" ||
      !eventKey.trim()
    ) {
      return res.status(400).json({
        message: "Invalid progress data."
      });
    }
 
    const saveProgress = db.transaction(() => {
      const result = db.prepare(`
        INSERT OR IGNORE INTO learning_events
          (user_id, event_key)
        VALUES (?, ?)
      `).run(userId, eventKey);
 
      if (result.changes === 0) {
        return false;
      }
 
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
 
      return true;
    });
 
    const saved = saveProgress();
 
    res.json({ success: true, saved });
  } catch (error) {
    console.error("Progress save error:", error.message);
    res.status(500).json({
      message: "Could not save progress."
    });
  }
});
// Return the logged-in user's saved progress.
app.get("/progress", authenticate, (req, res) => {
  const progress = db.prepare(`
    SELECT correct_answers, xp, completed_steps, updated_at
    FROM learning_progress
    WHERE user_id = ?
  `).get(req.userId);
 
  if (!progress) {
    return res.status(404).json({
      message: "Progress not found."
    });
  }
 
  res.json({ progress });
});
 
app.post("/forgot-password/question", (req, res) => {
  const user = db.prepare(
    "SELECT question FROM users WHERE email = ?"
  ).get((req.body.email || "").trim().toLowerCase());
 
  if (!user) {
    return res.status(404).json({
      message: "Account not found."
    });
  }
 
  res.json({ question: user.question });
});
 
app.post("/forgot-password/reset", async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
 
    if (!answer || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Enter the answer and a password of at least 6 characters."
      });
    }
 
    const user = db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).get((email || "").trim().toLowerCase());
 
    if (
      !user ||
      !(await bcrypt.compare(
        answer.trim().toLowerCase(),
        user.answer
      ))
    ) {
      return res.status(401).json({
        message: "Incorrect answer."
      });
    }
 
    const hashedPassword = await bcrypt.hash(newPassword, 10);
 
    db.prepare(
      "UPDATE users SET password = ? WHERE id = ?"
    ).run(hashedPassword, user.id);
 
    res.json({
      message: "Password reset successful. Please log in."
    });
  } catch (error) {
    console.error("Password reset error:", error.message);
 
    res.status(500).json({
      message: "Password reset failed."
    });
  }
});
 
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Authentication server running on port ${PORT}`);
});
 
