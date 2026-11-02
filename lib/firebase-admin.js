import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const appName = "forma-server";

export function getFirebaseServices() {
  const existingApp = getApps().find((app) => app.name === appName);
  if (existingApp) {
    return {
      auth: getAuth(existingApp),
      database: getDatabase(existingApp),
    };
  }

  const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!serviceAccountValue || !databaseURL) {
    throw new Error("Firebase server configuration is incomplete.");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountValue);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
  }

  if (
    !serviceAccount ||
    typeof serviceAccount !== "object" ||
    Array.isArray(serviceAccount) ||
    typeof serviceAccount.project_id !== "string" ||
    typeof serviceAccount.client_email !== "string" ||
    typeof serviceAccount.private_key !== "string"
  ) {
    throw new Error("Firebase service account is missing required fields.");
  }

  const app = initializeApp(
    {
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
      databaseURL,
    },
    appName,
  );

  return {
    auth: getAuth(app),
    database: getDatabase(app),
  };
}

export function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-forma_session"
    : "forma_session";
}

export function readSessionCookie(request) {
  const cookieHeader = request.headers.cookie;
  if (typeof cookieHeader !== "string") {
    return null;
  }
  const prefix = `${sessionCookieName()}=`;
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : null;
}

export function sessionCookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${sessionCookieName()}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}
