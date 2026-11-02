import { sendJson, requireMethod } from "../lib/http.js";

export default function handler(request, response) {
  if (!requireMethod(request, response, "GET")) {
    return;
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return sendJson(response, 503, { error: "Google sign-in is not configured on the server." });
  }

  return sendJson(response, 200, { googleClientId });
}
