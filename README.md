# Forma

A responsive landing page for a design-system builder that helps designers create
tokens and components, then bring their system into Figma.

## Sign in and Firebase

The sign-in flow uses Firebase Authentication with Google and stores the signed-in
user's display name, email, photo URL, and update timestamp at
`users/{uid}` in Firebase Realtime Database. The web app configuration in
`index.html` is public client configuration; do not put service-account keys or
other private credentials in the page.

The Realtime Database must enforce per-user access. In Firebase Console, open
Realtime Database → Rules and publish rules equivalent to:

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

These rules let each signed-in user read or update only their own profile. Do not
use public read/write rules.

In Firebase Authentication, enable Google as a sign-in provider and add the
production domain to Authorized domains. To test locally, add `localhost` there.

## Run locally

Serve the page over HTTP so Firebase Authentication can complete its redirect and
popup flow:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The page uses Firebase's browser SDK from
Google's CDN and does not require a build step or package installation.
