# Testing Log – Creative Marketplace

Use this log to track manual testing.

**Auth logs (login/register):** Open the browser **Developer Console** (F12 → Console). You will see:
- `[Login]` / `[Register]` – form submit and success/fail
- `[Auth]` – signIn/signUp/signOut in the auth service (attempt, success with uid, or failed with code)

Use these to confirm whether login and register are working and why they fail when they do. For each step: note **Pass** or **Fail** and, if something goes wrong, write what you saw in **Notes**.

---

## Pre-requisites

| Step | What to check | Expected | Pass/Fail | Notes |
|------|----------------|----------|-----------|--------|
| 1 | `.env` exists with all `PUBLIC_FIREBASE_*` set | No missing env errors in console | | |
| 2 | Firebase project has Auth (Email/Password) enabled | Register/Login can complete | | |
| 3 | Firestore DB exists and rules/indexes deployed | No permission errors when loading data | | |
| 4 | `npm run dev` runs without errors | Server starts, e.g. http://localhost:4321 | | |

---

## Landing page (`/`)

| Step | What to do | Expected | Pass/Fail | Notes |
|------|------------|----------|-----------|--------|
| 5 | Open `/` | Page loads, "Creative Marketplace" title, hero text, Sign in / Register / Browse creators links | | |
| 6 | Click "Sign in" | Navigate to `/login` | | |
| 7 | Click "Register" | Navigate to `/register` | | |
| 8 | Click "Browse creators" | Navigate to `/discover` | | |

---

## Register (`/register`)

| Step | What to do | Expected | Pass/Fail | Notes |
|------|------------|----------|-----------|--------|
| 9 | Submit with empty fields | Validation or error message | | |
| 10 | Submit with invalid email | Error message | | |
| 11 | Submit with password &lt; 6 chars | Error (e.g. weak password) | | |
| 12 | Submit with valid email, password, role, optional displayName | Account created, redirect to `/discover` | | |
| 13 | Submit again with same email | Error (e.g. email already in use) | | |

---

## Login (`/login`)

| Step | What to do | Expected | Pass/Fail | Notes |
|------|------------|----------|-----------|--------|
| 14 | Submit with wrong password | Error (e.g. invalid email or password) | | |
| 15 | Submit with non-existent email | Error message | | |
| 16 | Submit with correct credentials | Redirect to `/discover` | | |
| 17 | After login, refresh `/discover` | Still on discover, header shows Discover / My Bookings / Logout | | |

---

## Discover page (`/discover`)

| Step | What to do | Expected | Pass/Fail | Notes |
|------|------------|----------|-----------|--------|
| 18 | Open `/discover` when logged out | Page loads; tabs (Influencers, Videographers, Editors, Models); search bar; sections "Popular…" / "Featured…" | | |
| 19 | When logged out, header shows | "Sign in" and "Register" | | |
| 20 | Click tab "Videographers" | Tab underlines, section titles change to "Popular Videographers" / "Featured Videographers"; cards (or "No creators yet") load | | |
| 21 | Click each tab (Influencers, Editors, Models) | Same behavior; no console errors | | |
| 22 | Open `/discover` when logged in | Header shows Discover, My Bookings, Logout | | |
| 23 | If creators exist: click a creator card | Navigate to `/profile/[id]` | | |
| 24 | Search bar shows | "What" / "When" / "Sort" and search button visible | | |

---

## Profile page (`/profile/[id]`)

| Step | What to do | Expected | Pass/Fail | Notes |
|------|------------|----------|-----------|--------|
| 25 | Open `/profile/[valid-user-id]` (e.g. from discover card) | Profile loads; name/role shown; "Book Now" or "Sign in to book" / "You cannot book…" per rules | | |
| 26 | Open `/profile/[invalid-id]` | "Profile not found" or similar | | |
| 27 | When logged in and `canBook` is true: click "Book Now", enter date, submit | "Booking requested" or success message | | |
| 28 | When logged in and `canBook` is false (e.g. same user): | "Book Now" not shown or "You cannot book this profile" | | |

---

## Logout

| Step | What to do | Expected | Pass/Fail | Notes |
|------|------------|----------|-----------|--------|
| 29 | On `/discover` when logged in, click "Logout" | Redirect to `/`; header shows Sign in / Register again | | |
| 30 | After logout, open `/discover` | Page loads; header shows Sign in / Register | | |

---

## Quick reference – when something goes wrong

- **Blank page / white screen** → Check browser console (F12) for errors; check that all `PUBLIC_FIREBASE_*` env vars are set.
- **"Firebase: Error (auth/…)"** → Auth config or Auth not enabled in Firebase Console.
- **Permission denied / missing index** → Firestore rules or indexes; run `firebase deploy --only firestore:rules` and `firebase deploy --only firestore:indexes`.
- **Redirect not working** → Check that login/register success path uses `window.location.href = '/discover'`.
- **Discover shows "No creators yet"** → Normal if no users with role influencer/videographer/editor/model exist; register one with a creative role and retry.
- **Book Now does nothing or errors** → Check console; ensure `canBook` allows the combination (no self-book, target not "user").

---

*Last updated: add date when you run a test pass.*
