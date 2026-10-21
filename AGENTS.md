# AGENTS.md
- `public/` is the published site (netlify.toml publish = "public").
- `public/engine.js` holds ALL game rules. It is UMD, shared by `server.js` (Socket.IO) and the browser's LocalTransport (BroadcastChannel + bots). It sends events through `emit(to, event, payload)`; the host must call `tick(ms)`.
- `public/app.js` is the UI. It talks to the engine only through a transport: `create`, `join`, `send(type, payload)`.
- `public/data/spaceObjects.js` is the object database (UMD).
- Images: send them through the `/.netlify/images` CDN via the `img()` helper. `server.js` redirects that path locally.
- `public/showcase.html` is a standalone iOS showcase page.
- Code style: vanilla JS, no build step, beginner-friendly comments.
