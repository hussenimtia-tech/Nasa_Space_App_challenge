/* Server address. Load this BEFORE auth.js / profile.js on every page.
 *  - Netlify (current setup): "/api" -> the Netlify Function in netlify/functions/api.mjs
 *  - Playing on your own computer with auto-server.js: set it to "" (uses http://localhost:3001)
 */
window.SS_API = "/api";
