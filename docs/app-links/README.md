# App Links for crew links (spec 55)

`assetlinks.json` here lets Android open `https://nandi.nandi11.workers.dev/#crew/...` links straight in the NANDI app
(the manifest's `autoVerify` intent-filter on MainActivity). **It is not served yet**, on purpose: the web app is
deployed by CI (`wrangler deploy` of `./dist`) on every push to main, so a file in `public/` would go live with the
next push. Jenil decides when it is served (a yes/no line in the spec 55 push ask).

## What it says
- package `app.nandi.personal`
- release certificate SHA-256 `57:05:88:32:31:B1:0B:DB:9A:59:BF:B9:6A:E5:AA:09:D3:8C:F7:AC:CF:61:9B:82:4F:07:4D:16:CD:42:00:AA`,
  read from the CI-signed APK of run 41692881301 (main, 8802d65) by two independent readers; the notes are in
  `D:/nandi-gate-logs/spec55/assetlinks-sha256-notes.md`. The signing key itself was never opened.

## To serve it (one step, when Jenil says yes)
Copy it to `public/.well-known/assetlinks.json` and push. Vite copies `public/` into `dist/`, and CI's wrangler deploy
uploads it with the rest.

## Checked locally: the dot-directory is uploaded
A local `wrangler deploy --dry-run` (no login, no token, nothing deployed) of a folder holding only `index.html` and
`.well-known/assetlinks.json` reported a total upload of 0.31 KiB, the size of both files, and the file count rose
with the dot-directory present (Wrangler 4.148.0, 5 Nov 2026). So `.well-known/` is not skipped by default.

## Until it is served
A crew link tapped in a chat opens the web app. Its screen leads with "Have the app? Copy this link, then paste it in
NANDI → Yatra → Paste a crew link", a Copy button and the install link; joining in the browser is the second choice.
