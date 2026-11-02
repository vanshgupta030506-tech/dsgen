# Forma

A responsive landing page for a design-system builder that helps designers create
tokens and components, then bring their system into Figma.

## Server-side sign in and Firebase

Google Identity Services returns a Google ID token to the browser. The browser
sends it to `/api/auth/google`; the Vercel Function exchanges it with Firebase
Authentication, saves the profile to Realtime Database using Firebase Admin,
and creates a five-day `HttpOnly`, `SameSite=Lax` session cookie. Session
verification and sign-out also happen through same-origin API functions.

The Firebase Web API key and service-account credential are no longer included in
`index.html` or browser JavaScript. The Google OAuth client ID is returned by
`/api/config`; OAuth client IDs are public identifiers, not secrets.

### Configure Vercel

Add these environment variables in the Vercel project settings for each
deployment environment:

| Variable | Value |
| --- | --- |
| `APP_ORIGIN` | Exact origin, e.g. `https://dsgen.vercel.app` (no trailing slash) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web client ID configured for the Firebase Google provider |
| `FIREBASE_WEB_API_KEY` | Firebase Web API key for the `dsgen-8cf88` project |
| `FIREBASE_DATABASE_URL` | `https://dsgen-8cf88-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON for a service account belonging to the Firebase project |

Keep the service-account JSON private: enter it only in Vercel's encrypted
environment-variable settings. Do not commit it, put it in `index.html`, or paste
it into chat. Grant the service account only the permissions the app needs.

The Firebase Web API key is now used only by the server-side token exchange. Keep
its API restrictions limited to the Firebase APIs needed by the project. Do not
add HTTP referrer restrictions to this key: the exchange is a server-to-server
request and has no browser referrer, so that restriction can break sign-in. This
key identifies the Firebase project; it does not grant database access.

In Google Cloud Console, configure the OAuth web client with the production
JavaScript origin `https://dsgen.vercel.app`. Add `http://localhost:8000` as an
origin when testing locally. In Firebase Authentication, enable Google and add
the production domain and `localhost` to Authorized domains.

Because only the server uses Firebase Admin, Realtime Database rules should deny
all direct client access. Admin SDK operations run with server credentials and
bypass these rules:

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

### Run locally

Install Node.js 20 or later and the dependencies, then run the Vercel development
server (not a static file server, because sign-in needs the API functions):

```sh
npm install
npx vercel dev
```

Set the environment variables above in Vercel or a local `.env.local` file before
testing. `.env.local` is git-ignored; never commit credentials.
