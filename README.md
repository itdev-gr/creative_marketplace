# Creative Marketplace

Astro + Firebase (Auth, Firestore) creative marketplace with role-based booking.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Firebase project**

   - Create a project at [Firebase Console](https://console.firebase.google.com).
   - Enable **Authentication** (Email/Password).
   - Create a **Firestore** database.
   - Copy the project config (API key, auth domain, etc.) and add env vars (see below).

3. **Environment variables**

   Create a `.env` file in the project root (see `.env.example`). Use the `PUBLIC_` prefix so Astro exposes them to the client:

   ```env
   PUBLIC_FIREBASE_API_KEY=your-api-key
   PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   PUBLIC_FIREBASE_APP_ID=...
   ```

4. **Firestore rules and indexes**

   Deploy rules and indexes (requires [Firebase CLI](https://firebase.google.com/docs/cli)):

   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run test` – run unit tests
- `npm run test:watch` – run tests in watch mode
- `npx eslint .` – run ESLint
- `npx prettier --check .` – check formatting

The app uses `output: "server"` (Node adapter) so the profile page can use dynamic routes. Run the built app with `node ./dist/server/entry.mjs` (or use your preferred process manager).

## Booking business rules

- **Roles:** `user`, `influencer`, `videographer`, `editor`, `model`.
- **Who can book whom:**
  - A **user** can book any **creative** role (influencer, videographer, editor, model).
  - Any **creative** can book any other creative (including the same role).
  - Nobody can book a **user**.
  - Nobody can book **themselves**.
- Validation is applied in the UI (before showing “Book Now”), in the booking service (before writing), and in Firestore security rules.

## Project structure

- `src/lib/types/` – shared types (Role, Booking, UserProfile)
- `src/lib/utils/` – pure helpers (e.g. `canBook`)
- `src/lib/services/` – auth and booking services
- `src/lib/firebase/` – Firebase config and auth state
- `src/lib/errors/` – typed errors for auth and booking
- `src/components/` – reusable UI (e.g. BookNowButton)
- `src/pages/` – Astro pages (login, register, profile)
