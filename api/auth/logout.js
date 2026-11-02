import { isTrustedOrigin, sendJson, requireMethod } from "../../lib/http.js";
import { sessionCookieHeader } from "../../lib/firebase-admin.js";

export default function handler(request, response) {
  if (!requireMethod(request, response, "POST")) {
    return;
  }
  if (!isTrustedOrigin(request)) {
    return sendJson(response, 403, { error: "This sign-out request is not allowed." });
  }

  response.setHeader("Set-Cookie", sessionCookieHeader("", 0));
  return sendJson(response, 200, { ok: true });
}
