// Added by local-studio-usb-ai-demo. Only the studio's own page may call this server.
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

// shared is true when UAIS_HOST is set: the user chose a network address, so any Host is valid.
function isAllowedRequest(headers, shared = false) {
  const host = String(headers.host || "").toLowerCase();
  let hostname = "";
  try { hostname = new URL(`http://${host}`).hostname; } catch (_) {}
  // Stops DNS rebinding: a rebound page sends a same-origin GET with no Origin, but with its own Host.
  if (!shared && !LOOPBACK.has(hostname)) return false;
  // ponytail: no Origin passes (launcher, curl, <img>). A browser adds Origin to each cross-origin fetch and POST, and a page cannot read a no-Origin response.
  if (!headers.origin) return true;
  try { return new URL(headers.origin).host === host; } catch (_) { return false; }
}

module.exports = { isAllowedRequest };
