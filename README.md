# Forma

A responsive landing page for a design-system builder that helps designers create
tokens and components, then bring their system into Figma.

## Sign in and Firebase

The sign-in flow uses Firebase Authentication with Google and stores the signed-in
user's display name, email, photo URL, and update timestamp at
`users/{uid}` in Firebase Realtime Database. The web app configuration in
`index.html`, including its Firebase API key, is public client configuration.
Firebase documents these keys as public project identifiers, not credentials
that authorize database access. Google sign-in needs the configuration in the
browser, so moving it to another frontend file or a Vercel environment variable
would not make it secret. Never put service-account keys, private keys, or other
server credentials in the page.

### Lock down the Firebase project

1. In Google Cloud Console → APIs & Services → Credentials, find the
   Firebase-provisioned browser key used by this app. Verify its API restrictions
   allow only the Firebase APIs required by this project. Firebase normally
   manages that allowlist; do not replace it with a guessed list, as that can
   break sign-in or database access. Keep unrelated Google APIs off this key.
2. If applying website (HTTP referrer) restrictions, allow only the domains you
   use, such as `https://dsgen.vercel.app/*` and (for local development)
   `http://localhost:8000/*`. Add other Vercel preview domains only if you
   actually use them. Referrer restrictions limit where the key is used; they
   do not authorize or protect database data.
3. In Firebase Console → Realtime Database → Rules, publish rules equivalent to:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

These rules let each signed-in user read or update only their own profile. Check
that no broader root-level rule grants public read/write access; broader rules
override narrower ones. Do not use public read/write rules.

4. Configure Firebase App Check for the web app and Realtime Database. Start in
   monitoring mode, integrate the selected web provider in the client, verify
   legitimate requests, then enforce it in Firebase Console. Enforcing before
   the client is configured can block the app.

In Firebase Authentication, enable Google as a sign-in provider and add the
production domain to Authorized domains. To test locally, add `localhost` there.

Firebase documents its API key guidance at
[Firebase API keys](https://firebase.google.com/docs/projects/api-keys), and
Realtime Database authorization at
[Database security rules](https://firebase.google.com/docs/database/security).

## Run locally

Serve the page over HTTP so Firebase Authentication can complete its redirect and
popup flow:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The page uses Firebase's browser SDK from
Google's CDN and does not require a build step or package installation.
