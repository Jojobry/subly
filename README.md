# Subly — Subscription Tracker

A free, private Chrome extension to track every recurring subscription you pay for — from Netflix to Notion — without accounts, servers, or bank links. **All data stays on your device.**

![Subly](icons/icon128.png)

## Why

Forgotten subscriptions quietly drain money every month. Subly gives you one clean dashboard of what you pay, when it's due, and how much it adds up to per month and per year — and reminds you *before* you get charged.

Unlike most trackers, Subly has **no backend**. There's nothing to sign up for and nothing to trust: your financial data is stored locally with `chrome.storage.local` and never transmitted anywhere.

## Features

- 📊 **Dashboard** — monthly and yearly spend at a glance, plus active / trial / due-soon counts
- ➕ **Quick add/edit** — name, price, currency, billing cycle, renewal date, category, notes
- 🔔 **Local renewal reminders** — on-device notifications before a renewal or trial ends (no email, no server)
- 🌍 **150+ currencies** combined into one total using bundled offline rates (marked `≈` when mixed)
- 🌓 **Dark / light / system** theme
- 🔁 **Auto-rolls** past-due dates forward to the next cycle
- 💾 **Export / import** your data as JSON
- 🔒 **100% private & offline** — no accounts, no tracking, no network calls

## Install (from source)

1. Download or clone this repo.
2. Open `chrome://extensions` in Chrome (or any Chromium browser).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Pin Subly and click the icon to start.

## Privacy

See [PRIVACY.md](PRIVACY.md). Short version: everything stays on your device; Subly makes no network requests and collects nothing.

## Support

Subly is free and always will be. If it saved you from a forgotten charge and you'd like to say thanks:

☕ **[Buy me a coffee](https://buymeacoffee.com/jojobry)**

## Tech

Vanilla JavaScript, HTML, CSS. Manifest V3. No dependencies, no build step.

## License

[MIT](LICENSE) © 2026 Jojobry
