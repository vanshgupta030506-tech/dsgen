import {
  getFirebaseServices,
  readSessionCookie,
  sessionCookieHeader,
} from "../../lib/firebase-admin.js";
import { sendJson, requireMethod } from "../../lib/http.js";

export default async function handler(request, response) {
  if (!requireMethod(request, response, "GET")) {
    return;
  }

  const sessionCookie = readSessionCookie(request);
  if (!sessionCookie) {
    return sendJson(response, 200, { user: null });
  }

  try {
    const { auth } = getFirebaseServices();
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const user = {
      uid: decodedToken.uid,
      email: typeof decodedToken.email === "string" ? decodedToken.email : "",
      name: typeof decodedToken.name === "string" ? decodedToken.name : "",
      photoURL: typeof decodedToken.picture === "string" ? decodedToken.picture : "",
    };
    return sendJson(response, 200, { user });
  } catch (error) {
    const invalidSessionCodes = new Set([
      "auth/invalid-session-cookie",
      "auth/session-cookie-expired",
      "auth/session-cookie-revoked",
    ]);
    if (invalidSessionCodes.has(error?.code)) {
      response.setHeader("Set-Cookie", sessionCookieHeader("", 0));
      return sendJson(response, 200, { user: null });
    }

    console.error("Firebase session verification failed.", error);
    return sendJson(response, 500, { error: "Session verification failed. Please try again." });
  }
}
