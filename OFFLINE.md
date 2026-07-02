# CM Simulator — Offline / Local Windows Build

This is the **fully-local** version of CM Simulator. It runs entirely on your
laptop with **no internet, no Firebase, and no login** — the resilient fallback
for "if Firebase ever goes down" (or if you make the GitHub repo private and
stop using GitHub Pages).

What "offline mode" changes vs. the normal cloud version:

| | Cloud version (default) | Offline version |
|---|---|---|
| Login | Firebase email/password | **None — opens straight into the simulator** |
| Content (scenarios, algorithms) | Loaded from Firestore | **Bundled into the app** |
| Saved sessions & scenarios | Firestore (per account) | **Stored in this browser, on this device** |
| Network needed | Yes | **No** |

Your data in offline mode lives in the browser's local storage on the machine
you use it on. It does not sync between devices (single-user by design).

---

## One-time setup on Windows

1. Install **[Node.js LTS](https://nodejs.org/)** (includes `npm`).
2. Open **Command Prompt** or **PowerShell** in this project folder.
3. Install dependencies (needs internet *this one time only*):

   ```
   npm install
   ```

## Build the offline app

```
npm run build:offline
```

This writes a self-contained site into the `dist\` folder using relative paths,
so it works from any location without a web server sub-path.

## Run it

Easiest — serve the build and open the printed URL in your browser:

```
npm run preview:offline
```

Then visit the `http://localhost:...` address it prints. Because it's a PWA, once
it has loaded once your browser caches it and it keeps working with the laptop
**fully offline**. You can also "Install" it from the browser to get an app-like
window and a Start-menu / desktop icon.

> Tip: serve it, don't double-click `dist\index.html`. Opening the raw file with
> a `file://` path prevents the service worker (the offline caching) from
> registering. Any local server works — `npm run preview:offline`, or
> `npx serve dist`.

## Live development (optional)

```
npm run dev:offline
```

Runs the same offline app with hot reload for editing.

---

## Build a Windows `.exe` (desktop app)

If you'd rather hand someone a real double-click Windows program instead of a
browser tab, the project can also package the offline app with **Electron**.

> **Must be built on Windows.** A Windows `.exe` can only be produced on a
> Windows machine (or a Windows CI runner). Run these on the Windows PC.

One-time (needs internet the first time to download Node + Electron):

```
npm install
```

Then build the installer:

```
npm run dist:win
```

This runs the offline build and packages it. You'll find the installer in the
`release\` folder (e.g. `CM Simulator Setup 1.0.0.exe`). Run it to install CM
Simulator with a desktop + Start-menu shortcut. The installed app runs fully
offline — no internet, no Firebase, no login — same as the offline web build.

To just try the desktop app without making an installer:

```
npm run desktop
```

(`npm run dist:mac` and `npm run dist:linux` produce a macOS `.dmg` and a Linux
`AppImage` respectively, each on its own OS.)

The desktop wrapper lives in `electron/main.js` and simply loads the existing
`dist\` offline build in a native window — it does not change the web app.

## How the switch works (for reference)

Offline mode is controlled by `VITE_OFFLINE=1` in `.env.offline`, which the
`*:offline` npm scripts activate via `vite --mode offline`. When it's on, the app
ignores any Firebase config and uses the local content/storage paths. The normal
`npm run build` is untouched and still produces the cloud (GitHub Pages) version.
