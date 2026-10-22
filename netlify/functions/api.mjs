// Netlify Function: SpaceSkribble auth API (replaces auto-server.js on Netlify).
// Routes (all under /api): POST /register, POST /login, GET /questions, GET /progress,
// POST /forgot-password/question, POST /forgot-password/reset, POST /internal/progress
// Data is stored in Netlify Blobs (built in, no extra database account needed).
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getStore } from "@netlify/blobs";

export const config = { path: "/api/*" };

const questions = [
  "What is your favorite planet?",
  "What was your childhood nickname?",
  "What is your favorite space mission?",
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const key = (email) => encodeURIComponent(email);
const normEmail = (e) => String(e || "").trim().toLowerCase();

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function authenticate(req, secret) {
  const match = (req.headers.get("authorization") || "").match(/^Bearer (.+)$/);
  if (!match) return { error: json({ message: "Please log in first." }, 401) };
  try {
    const payload = jwt.verify(match[1], secret);
    if (!Number.isInteger(payload.userId)) throw new Error("bad payload");
    return { userId: payload.userId };
  } catch {
    return { error: json({ message: "Session expired. Please log in again." }, 401) };
  }
}

export default async (req) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    return json(
      { message: "Server not configured: set JWT_SECRET (32+ characters) in Netlify environment variables." },
      500
    );
  }

  const users = getStore("users"); // key: email -> user record
  const progressStore = getStore("progress"); // key: userId -> progress
  const events = getStore("events"); // key: eventKey -> true

  const path = new URL(req.url).pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  const method = req.method;

  try {
    // ---- GET /questions
    if (method === "GET" && path === "/questions") return json(questions);

    // ---- POST /register
    if (method === "POST" && path === "/register") {
      const { name, email, password, question, answer } = await readBody(req);
      if (!name || !email || !password || !question || !answer)
        return json({ message: "Fill in all fields." }, 400);
      if (String(password).length < 6)
        return json({ message: "Password must be at least 6 characters." }, 400);
      if (!questions.includes(question))
        return json({ message: "Invalid security question." }, 400);

      const mail = normEmail(email);
      if (await users.get(key(mail))) return json({ message: "Email already registered." }, 409);

      const id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      const record = {
        id,
        name: String(name).trim(),
        email: mail,
        password: await bcrypt.hash(String(password), 10),
        question,
        answer: await bcrypt.hash(String(answer).trim().toLowerCase(), 10),
      };

      const saved = await users.setJSON(key(mail), record, { onlyIfNew: true });
      if (saved && saved.modified === false)
        return json({ message: "Email already registered." }, 409);

      await progressStore.setJSON(String(id), {
        correct_answers: 0,
        xp: 0,
        completed_steps: 0,
        updated_at: new Date().toISOString(),
      });
      return json({ message: "Registration successful!" }, 201);
    }

    // ---- POST /login
    if (method === "POST" && path === "/login") {
      const { email, password } = await readBody(req);
      const user = await users.get(key(normEmail(email)), { type: "json" });
      if (!user || !(await bcrypt.compare(String(password || ""), user.password)))
        return json({ message: "Invalid email or password." }, 401);

      if (!(await progressStore.get(String(user.id)))) {
        await progressStore.setJSON(String(user.id), {
          correct_answers: 0,
          xp: 0,
          completed_steps: 0,
          updated_at: new Date().toISOString(),
        });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "2h",
        issuer: "spaceskribble",
      });
      return json({
        message: "Login successful!",
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    }

    // ---- GET /progress
    if (method === "GET" && path === "/progress") {
      const auth = authenticate(req, JWT_SECRET);
      if (auth.error) return auth.error;
      const progress = await progressStore.get(String(auth.userId), { type: "json" });
      if (!progress) return json({ message: "Progress not found." }, 404);
      return json({ progress });
    }

    // ---- POST /internal/progress
    if (method === "POST" && path === "/internal/progress") {
      const secret = process.env.INTERNAL_PROGRESS_SECRET;
      if (!secret || req.headers.get("x-progress-secret") !== secret)
        return json({ message: "Unauthorized." }, 401);

      const { userId, eventKey } = await readBody(req);
      if (!Number.isInteger(userId) || typeof eventKey !== "string" || !eventKey.trim())
        return json({ message: "Invalid progress data." }, 400);

      const ek = encodeURIComponent(eventKey.trim());
      if (await events.get(ek)) return json({ success: true, saved: false });
      await events.set(ek, "1");

      const progress =
        (await progressStore.get(String(userId), { type: "json" })) || {
          correct_answers: 0,
          xp: 0,
          completed_steps: 0,
        };
      progress.correct_answers += 1;
      progress.xp += 10;
      progress.updated_at = new Date().toISOString();
      await progressStore.setJSON(String(userId), progress);
      return json({ success: true, saved: true });
    }

    // ---- POST /forgot-password/question
    if (method === "POST" && path === "/forgot-password/question") {
      const { email } = await readBody(req);
      const user = await users.get(key(normEmail(email)), { type: "json" });
      if (!user) return json({ message: "Account not found." }, 404);
      return json({ question: user.question });
    }

    // ---- POST /forgot-password/reset
    if (method === "POST" && path === "/forgot-password/reset") {
      const { email, answer, newPassword } = await readBody(req);
      if (!answer || !newPassword || String(newPassword).length < 6)
        return json({ message: "Enter the answer and a password of at least 6 characters." }, 400);

      const mail = normEmail(email);
      const user = await users.get(key(mail), { type: "json" });
      if (
        !user ||
        !(await bcrypt.compare(String(answer).trim().toLowerCase(), user.answer))
      )
        return json({ message: "Incorrect answer." }, 401);

      user.password = await bcrypt.hash(String(newPassword), 10);
      await users.setJSON(key(mail), user);
      return json({ message: "Password reset successful. Please log in." });
    }

    return json({ message: "Not found." }, 404);
  } catch (error) {
    console.error("API error:", error);
    return json({ message: "Server error. Please try again." }, 500);
  }
};
