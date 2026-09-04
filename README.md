# HNO-Praxis Dr. Mayer-Brix — Website

Static site (plain HTML/CSS/vanilla JS, no build step). Deployed on Netlify.

## Local development

    python3 -m http.server 4173

Then open http://localhost:4173/.

## Tests

    npm test

## Editing the announcement banner

Handled by Decap CMS — see the companion plan/spec for `/admin` setup.
Editing `content/banner.json` directly and pushing to `main` also works.

## Deployment

Connected to Netlify, auto-deploys `main`. Netlify Forms handles the
Kontakt form automatically (detected at deploy time via the `data-netlify`
form attributes) — no extra configuration needed.
