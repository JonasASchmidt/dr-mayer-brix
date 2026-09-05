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

Connected to Netlify, auto-deploys `main`. There is no contact form on the
site — visitors reach the practice by phone, via the 321med Online-Rezeption
floating widget, or via the `mailto:` link in the footer.
