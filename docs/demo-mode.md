# Demo mode (simulated data)

Demo mode shows the client the whole design on a phone without depending on the backend. It ships in this version's APK (Profile > Developer) and should be hidden (`EXPO_PUBLIC_DEV_TOOLS=false`) or removed before a store release.

## How to use it

| Where | What |
|---|---|
| Profile > Developer > **Simulated data** | Turns demo mode on or off. Switching signs the user out, because a session from one data source is not valid in the other. |
| Login screen, **long-press the logo** (0.8 s) | Opens Developer before signing in, so demo mode can be turned on when the backend is down. |
| Login, with demo mode on | Any email and password work. A pill under the logo says "Simulated data on". |
| Developer > **Reset simulated data** | Removes what was added during a demo and puts the sample data back. |
| Developer > **Recent simulated requests** | The last 40 requests answered on the device. "no route" marks a request the simulation does not know (it got an empty success). |
| `EXPO_PUBLIC_DEMO_MODE=true` in `.env` | A fresh install starts in demo mode (for the client APK). The switch still works. |
| `EXPO_PUBLIC_DEV_TOOLS=false` in `.env` | Hides the Developer row and the long-press. |

The flag and the simulated database are files in the app's document folder (`demo-mode.json`, `demo-db.json`), not AsyncStorage, because logout runs `AsyncStorage.clear()`.

## How it works

`utils/demo/installDemoInterceptor.ts` is imported first in `app/_layout.tsx`. It wraps `global.fetch` and adds an axios request interceptor. While demo mode is on:

- Requests to `CONFIG.API_BASE_URL` (the CrossCare API) and `CONFIG.RAG_SERVICE_URL` (the Doula chat) are answered by `utils/demo/mockRoutes.ts` from the on-device database in `utils/demo/mockDb.ts`. No screen code changed.
- Every handler returns the same JSON as the matching controller in `crosscare-backend`, including status codes and validation errors, so screens behave as they do against the real server.
- Requests to other services go out as usual (see "Still online" below).

Sample data: patient "Maya Thompson", 24 weeks + 3 days, two weeks of water, steps, sleep, weight, heart rate, blood pressure, glucose, mood and calories; 3 notes, 3 journal photos, 2 medications, 4 appointments, 3 symptoms, today's meals and 5 badges.

Demo mode also turns on `CONFIG.BACKDATED_READINGS` (logging a vital for an earlier date), because the simulated API stores `recorded_at` and the real one does not yet.

## What the demo covers

All of these work with no backend:

| Area | Screens | API routes simulated |
|---|---|---|
| Auth | Login, Sign up, Verify email (any code), Forgot / reset password | `/login`, `/signup`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password` |
| Profile | Profile, Account details, Your pregnancy, pregnancy week modal, profile photo, Delete account (resets the demo) | `/user/:id/profile` (GET, PUT), `/profile/image`, `/pregnancy-week` (GET, PUT), `/avatar`, `/delete-account` |
| Home | Week and baby card, vitals tiles, water glass, appointments, Explorer badge | `/user/activity/:id`, `bpstatus`, `glucosestatus`, `water`, `appointments`, `/user/:id/badges/award` |
| Health | Water, Steps, Sleep, Weight, Heart rate, Blood pressure, Glucose, Mood, Symptoms, Medication, Food (search, portion, goals, history) | every `/user/activity/:id/*` and `/user/metrics/:id/*` route in `activity.route.js` and `metrics.route.js` |
| Journal | Timeline, new entry (note or photo), open / edit / delete note and photo | `note`, `notes`, `journal`, `journal/upload`, `journal/:entryId` |
| Calendar | Calendar, add / edit / delete appointment | `appointment`, `appointments/:appointmentId` |
| Hall of Fame | Badges | `GET /user/:id` |
| Ask Doula / Concierge chat | Typed and spoken questions, intake questionnaire answers, health logging from chat | RAG `POST /chat/:userId` (canned replies in English, Portuguese and Spanish), `/user/:id/domain` |

Intake questionnaire (Concierge chat): answers go to `POST /user/:id/domain` and are kept in the demo database. In demo mode the simulated guide quotes them back when the patient asks about their home or "what do you know about me", to show that saved answers become AI context. The real AI does this through `getUserProfile` in CrossCare-rag; it is not run in demo mode.

Already local before this branch (no backend involved, in demo mode or not): Concierge meet / name / voice / call / history screens, Avatar Studio choices, guide name, Premium status, notification preferences.
Note: these live in AsyncStorage, so logout and switching the data source reset them.

## Where the design is ahead of the backend

Work the backend needs so the real app matches what the demo shows. In demo mode these work because the simulation fills the gap.

| # | Gap | Front end that depends on it | What the backend needs |
|---|---|---|---|
| 1 | Vitals ignore `recorded_at` | Backdated readings (`components/vitals/VitalsUI.tsx`, `backdate.ts`); off in real mode via `EXPO_PUBLIC_BACKDATED_READINGS` | Accept `recorded_at` on `water`, `weight`, `heart`, `bp`, `glucose`, `steps` and store the reading on that day |
| 2 | No `GET /user/activity/:id/note/:noteId` | Opening a note with its full text; `GET notes` cuts descriptions at 30 characters | Add the route, or return the full description in `notes` |
| 3 | No `POST /user/activity/:id/heartrate` | Apple Health sync (`useAppleHealthStore.ts`) | Add the route or point the store to `heart` |
| 4 | No `GET /user/activity/:id/stepsGoal` | Apple Health steps goal | Add the route or read `goals` |
| 5 | Self-care routes are commented out (`selfcare.route.js`) | Exercise detail (`app/patient/excerises/excerise.tsx`, `GET /categories/:id`) | Restore the routes, or move the screen to Contentful like the Self-care list |
| 6 | No premium API | Premium screen keeps a simulated status (`premiumStore.ts`) | An entitlement on the patient (from clinic or provider) |
| 7 | No chat history or guide profile on the server | Concierge history, guide name and avatar live only on the phone | Endpoints to save threads and the guide / avatar choice per patient |
| 8 | No preference storage | "Proactive suggestions" and "Weekly summary" toggles (`notification.tsx`) | Preference fields, plus the features themselves |
| 9 | Email depends on SendGrid | Sign up verification and password reset | A valid `SENDGRID_API_KEY` and verified sender on the server |
| 10 | Photos depend on Supabase Storage | Profile photo, journal photos | `SUPABASE_URL`, keys and the storage bucket on the server |

## Still online in demo mode

These are third-party services called directly from the app. Demo mode does not replace them, so they need internet and valid keys in the `.env` at build time. The "without it" column is what the code suggests; it has not been tested on a device.

| Service | Used for | Without it (expected, not tested) |
|---|---|---|
| Gemini (`EXPO_PUBLIC_GEMINI_API`) | Translating replies, chat fallback when RAG fails | The simulated RAG answers first, so chat replies still appear; translation fails |
| OpenAI (`EXPO_PUBLIC_OPENAI_API_KEY`) | Intent classifier and empathy lines in the questionnaire | Those steps fail; check the intake flow before a demo |
| Deepgram (`EXPO_PUBLIC_DEEPGRAM_API`) | Read-aloud (TTS) and voice notes (speech to text) | Voice features fail; typing works |
| Contentful | Self-care routines, avatar content | Self-care content does not load |
| Open Food Facts | Barcode lookup in Food | Barcode search fails |

## Files

- `utils/demo/demoMode.ts`: the flag (zustand + file), `DEV_TOOLS_VISIBLE`
- `utils/demo/mockDb.ts`: the database, sample data, save and reset
- `utils/demo/mockRoutes.ts`: one handler per backend route
- `utils/demo/mockContent.ts`: badge names and the canned Doula replies
- `utils/demo/installDemoInterceptor.ts`: the fetch and axios hooks, request log
- `app/developer.tsx`: the Developer screen
- Touched: `app/_layout.tsx`, `app/login.tsx`, `app/patient/(tabs)/profile.tsx`, `constants/config.ts`, `translation/en.json`, `translation/pt.json`
