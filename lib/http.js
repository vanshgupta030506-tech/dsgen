export function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(body));
}

export function isTrustedOrigin(request) {
  const origin = request.headers.origin;
  if (typeof origin !== "string") {
    return false;
  }

  if (process.env.APP_ORIGIN && origin === process.env.APP_ORIGIN) {
    return true;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      url.port === "8000"
    );
  } catch {
    return false;
  }
}

export function requireMethod(request, response, method) {
  if (request.method === method) {
    return true;
  }
  response.setHeader("Allow", method);
  sendJson(response, 405, { error: "Method not allowed." });
  return false;
}
