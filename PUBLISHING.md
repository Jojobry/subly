# Publishing Subly — step by step

Everything you need to ship this week.

---

## 1. Put it on GitHub

```bash
cd C:\Users\jojojojojojo\subly
git init
git add .
git commit -m "Subly v1.0.0 — private, local subscription tracker"
```

Create a repo on GitHub (e.g. `subly`) and push:

```bash
git remote add origin https://github.com/Jojobry/subly.git
git branch -M main
git push -u origin main
```

You can keep the repo **private**. The only thing that must be public is the privacy policy URL (next step).

---

## 2. Make the privacy policy publicly reachable

The Chrome Web Store requires a public privacy-policy URL. Two easy options:

**Option A — GitHub Gist (simplest, repo stays private)**
1. Go to https://gist.github.com
2. Paste the contents of `PRIVACY.md`, name it `PRIVACY.md`, create a **public** gist.
3. Use that gist URL as your privacy policy link.

**Option B — GitHub Pages**
1. Make the repo public, *or* move `PRIVACY.md` to a separate public repo.
2. Settings → Pages → deploy from `main`.
3. Your URL will be like `https://jojobry.github.io/subly/PRIVACY`.

Either way, copy the final public URL — you'll paste it into the store form.

---

## 3. Package the extension

Zip the **contents** of the `subly` folder (not the folder itself) — the `manifest.json` must be at the root of the zip.

PowerShell:
```powershell
cd C:\Users\jojojojojojo\subly
Compress-Archive -Path manifest.json,background.js,popup.html,popup.css,popup.js,rates.js,icons -DestinationPath subly-v1.0.0.zip -Force
```

---

## 4. Create a Chrome Web Store developer account

- Go to https://chrome.google.com/webstore/devconsole
- One-time **$5 USD** registration fee (this is Google's fee, not a Subly cost — the extension itself is free).

---

## 5. Submit

In the developer console → **New item** → upload `subly-v1.0.0.zip`, then fill in:

- **Description** → paste from `STORE_LISTING.md`
- **Category** → Tools (or Productivity)
- **Language** → English
- **Privacy policy URL** → the public URL from step 2
- **Screenshots** → 1280×800 or 640×400 PNG. Take a few of the popup (add 4–5 sample subscriptions first so it looks full). At least one is required.
- **Single purpose** → "Track personal subscriptions locally."
- **Permission justifications:**
  - `storage` — "Save the user's subscriptions and settings locally on their device."
  - `alarms` — "Run a once-daily local check for upcoming renewals."
  - `notifications` — "Show on-device reminders before a subscription renews."
- **Data usage** → check that you do **not** collect or transmit any user data. (True — Subly makes no network calls.)

Submit for review. Review typically takes a few hours to a few days.

---

## Updating later

Bump `version` in `manifest.json` (e.g. `1.0.1`), re-zip, upload as a new package on the same store item.
