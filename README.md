# MOVE AI dashboard

Movement-analytics dashboard for interactive environments, published as a static site on GitHub Pages.

**Live site:** `https://<your-github-username>.github.io/move-ai/`

> **Data is local.** Participants, sessions, movement events, object interactions and reports are stored in your browser's `localStorage` (via `assets/js/store.js`). Nothing is shared between users or devices. Use **Settings → Export JSON** for backups.

> **Demo build.** GitHub Pages only serves static files. There is no Laravel, PHP or MySQL here, and none of it is simulated as real. All numbers, participants, sessions and notifications come from a sample dataset inside `assets/js/app.js`, and actions such as export or sign-out only show a demo toast.

## Stack

Plain HTML, CSS and JavaScript with [Chart.js 4.4.4](https://www.chartjs.org/) loaded from the cdnjs CDN. There is no framework and no compile step, so nothing to `npm install`.

```
move-ai/
├── index.html                  # app shell (sidebar, topbar, content mount point)
├── 404.html                    # friendly not-found page
├── assets/
│   ├── css/styles.css          # all styling, light + dark, responsive breakpoints
│   ├── js/store.js             # data service: CRUD, seed data, import/export, dashboard stats
│   ├── js/pages.js             # Participants, Sessions, Tracking, Reports, Settings screens
│   ├── js/app.js               # dashboard, charts, hash router
│   └── favicon.svg
├── scripts/build.sh            # assembles + validates the site into _site/
├── .github/workflows/deploy.yml
└── README.md
```

## How paths and routing work on GitHub Pages

A project site lives under a sub-path (`/move-ai/`), not at the domain root. To make that work everywhere:

- **All asset links are relative** (`./assets/...`). The same files work at `/move-ai/` on GitHub and at `/` on a local server, so there is no base path to configure and nothing to change if you rename the repository.
- **Navigation uses hash routes** (`#/overview`, `#/sessions`, `#/participants`, ...). Pages is static, so server-side URLs like `/move-ai/sessions` would return 404 on refresh. Hash routes never reach the server, so refresh, bookmarks, shared links and the browser back/forward buttons all work.
- `scripts/build.sh` fails the build if it finds a root-absolute URL (`href="/..."`), a reference to a missing file, or a JavaScript syntax error.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

To check the exact output that gets deployed:

```bash
bash scripts/build.sh _site
cd _site && python3 -m http.server 8000
```

To mimic the real sub-path, serve the **parent** folder and open `http://localhost:8000/move-ai/`.

## Deploy to GitHub Pages

1. **Create the repository** on GitHub named exactly `move-ai` (public, or private if your plan supports Pages for private repos). Don't add a README or other files.
2. **Push this project** (default branch `main`):
   ```bash
   cd move-ai
   git init
   git add .
   git commit -m "Initial commit: MOVE AI dashboard for GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/move-ai.git
   git push -u origin main
   ```
3. **Enable Pages:** repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Run the workflow.** The first push may have run before Pages was enabled. Open the **Actions** tab, choose **Deploy to GitHub Pages**, and click **Run workflow** (or push any new commit).
5. **Open the site** at `https://<your-github-username>.github.io/move-ai/`. The URL also appears on the deploy job in the Actions run.

Every later push to `main` rebuilds and redeploys automatically.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Actions run fails at "Setup Pages" or "Deploy" | Pages source is not set to **GitHub Actions** (step 3). |
| Site shows the GitHub 404 page | The first deployment hasn't finished. Check the Actions tab and wait for a green run. |
| Charts are empty | The browser couldn't load Chart.js from cdnjs (offline, or a content blocker). Download `chart.umd.min.js` into `assets/js/` and point the `<script>` tag in `index.html` at `./assets/js/chart.umd.min.js` to self-host it. |
| Build fails with `root-absolute URL` | Change `href="/x"` to `href="./x"`. |
| Repo renamed | Nothing to change in the code. The site URL changes to match the new name. |

## Moving to a real backend later

When you add Laravel/PHP/MySQL, host it separately (a VPS, Forge, Railway, etc.) and have this frontend call its JSON API. Replace the internals of `assets/js/store.js` (`get`, `add`, `update`, `remove`) with `fetch()` calls (the UI only talks to `MoveStore`), and enable CORS on the API for your `github.io` origin.

## Admin panel (phase 1)

- **Activities**: activity library with categories, difficulty, activate/deactivate, add/edit/delete.
- **Supervisors**: list, profile, activate/deactivate, assign participants and sessions, pending reports.
- **Audit logs**: records create/update/delete, session completed, supervisor assigned, report status changes, data import/export. Search and filters.
- **Settings**: organization, defaults, activity categories (all saved in the browser only).

All data is local demo storage (localStorage). Nothing here is real security or a real server.

## Supervisor panel

Use the **Demo role** switcher at the bottom of the sidebar (Admin / Supervisor, plus which supervisor you act as).
Pages: Overview, My participants, My sessions (with detail view), Attendance, Movement tracking, Object interactions, Reports, Notifications, My profile, Settings.
The role switch is a **frontend simulation only**: it is not authentication and gives no real security. Movement metrics are demo values; no camera, pose or AI tracking and no email/push notifications are connected. Data is stored in this browser only.

## Advanced analytics (Admin)

Sidebar: **Analytics** opens ten tabs: Overview, Participants, Movement, Activities, Sessions, Attendance, Objects, Supervisors, Comparisons, Data quality.
All numbers are calculated in `assets/js/analytics.js` (pure functions, no DOM) from records stored in this browser. Missing values show as "—" or "Not enough data"; nothing is estimated, except distance/speed on the Movement page, which are labelled demo-derived estimates.
Exports on each page: CSV, JSON, and **Print / Save as PDF** (uses the browser print dialog; choose "Save as PDF").
Run the calculation tests: `node tests/analytics.test.js`

## AI & cameras (Admin, frontend demo)

Sidebar section **AI & cameras**: AI dashboard, Cameras (CRUD, status, calibration), Live monitoring, Vision data (detection, tracking, pose, movement metrics, interactions), Cube zones, Object library, AI event timeline, AI documentation (architecture, API contracts, privacy, backend requirements).

**What is real and what is simulated**
- Real in the browser: camera/zone/object CRUD, a USB webcam preview after you click and allow it (stops when you stop or leave the page), metric calculations in `assets/js/ai-core.js`, the API client and mock adapter.
- Simulated (always labelled): the 4 demo cameras, detections, tracks, poses, objects, interactions, events and processing jobs. Turn **Demo Mode** off on the AI dashboard to hide all simulated data.
- Not available on GitHub Pages: AI processing, RTSP/IP streams, saved video. These need a separate backend or gateway (see the in-app documentation).

**Files:** `assets/js/ai-core.js` (pure logic, data models v1, API layer) and `assets/js/ai.js` (UI). Data is stored in `localStorage` under `moveai.ai.v1`, separate from existing MOVE AI data.

**API layer:** `MoveAI.createApi({getDb, baseUrl, live})`. Mock adapter is the default. Live calls are made only when you set a base URL in Live mode and press *Test connection*. Never put credentials in the URL.

**Security:** No credentials are accepted or stored. Frontend role switching is a simulation, not authorisation. No facial recognition is used. Tracking IDs are temporary and are not participant identities.

Tests: `node tests/ai.test.js` (also `node tests/analytics.test.js`).
