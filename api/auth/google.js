import { getFirebaseServices, sessionCookieHeader } from "../../lib/firebase-admin.js";
import { isTrustedOrigin, sendJson, requireMethod } from "../../lib/http.js";
import { ServerValue } from "firebase-admin/database";

const sessionDurationMs = 5 * 24 * 60 * 60 * 1000;
const sessionDurationSeconds = sessionDurationMs / 1000;

export default async function handler(request, response) {
  if (!requireMethod(request, response, "POST")) {
    return;
  }
  if (!isTrustedOrigin(request)) {
    return sendJson(response, 403, { error: "This sign-in request is not allowed." });
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!apiKey || !googleClientId) {
    return sendJson(response, 503, { error: "Google sign-in is not configured on the server." });
  }

  const credential = request.body?.credential;
  if (
    typeof credential !== "string" ||
    credential.length > 12000 ||
    credential.split(".").length !== 3
  ) {
    return sendJson(response, 400, { error: "A valid Google sign-in credential is required." });
  }

  try {
    const firebaseResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postBody: `id_token=${encodeURIComponent(credential)}&providerId=google.com`,
          requestUri: request.headers.origin,
          returnIdpCredential: false,
          returnSecureToken: true,
        }),
      },
    );
    if (!firebaseResponse.ok) {
      const error = await firebaseResponse.json().catch(() => ({}));
      console.error("Firebase rejected Google sign-in.", {
        status: firebaseResponse.status,
        code: error.error?.message ?? "unknown",
      });
      return sendJson(response, 401, {
        error: "Google sign-in could not be verified. Check that Google is enabled in Firebase Authentication.",
      });
    }

    const firebaseResult = await firebaseResponse.json();
    if (
      typeof firebaseResult.idToken !== "string" ||
      typeof firebaseResult.localId !== "string"
    ) {
      console.error("Firebase returned an incomplete sign-in response.");
      return sendJson(response, 502, { error: "Firebase could not complete sign-in. Please try again." });
    }

    const { auth, database } = getFirebaseServices();
    const decodedToken = await auth.verifyIdToken(firebaseResult.idToken, true);
    if (decodedToken.uid !== firebaseResult.localId) {
      return sendJson(response, 401, { error: "Google sign-in could not be verified." });
    }

    const name =
      typeof decodedToken.name === "string"
        ? decodedToken.name
        : typeof firebaseResult.displayName === "string"
          ? firebaseResult.displayName
          : "";
    const email =
      typeof decodedToken.email === "string"
        ? decodedToken.email
        : typeof firebaseResult.email === "string"
          ? firebaseResult.email
          : "";
    const photoURL =
      typeof decodedToken.picture === "string"
        ? decodedToken.picture
        : typeof firebaseResult.photoUrl === "string"
          ? firebaseResult.photoUrl
          : "";

    await database.ref(`users/${decodedToken.uid}`).update({
      displayName: name,
      email,
      photoURL,
      updatedAt: ServerValue.TIMESTAMP,
    });

    const sessionCookie = await auth.createSessionCookie(firebaseResult.idToken, {
      expiresIn: sessionDurationMs,
    });
    response.setHeader(
      "Set-Cookie",
      sessionCookieHeader(sessionCookie, sessionDurationSeconds),
    );
    return sendJson(response, 200, {
      user: { uid: decodedToken.uid, email, name, photoURL },
    });
  } catch (error) {
    console.error("Server-side Google sign-in failed.", error);
    return sendJson(response, 500, { error: "Sign-in failed due to a server error. Please try again." });
  }
}
