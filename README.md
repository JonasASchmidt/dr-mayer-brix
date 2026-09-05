# HNO-Praxis Dr. Mayer-Brix — Website

Static site (plain HTML/CSS/vanilla JS, no build step). Deployed on Netlify.

## Local development

    python3 -m http.server 4173

Then open http://localhost:4173/.

## Tests

    npm test

## Editing the announcement banner

The whole "CMS" for the mint banner at the top of the site is one plain-text
file: `content/banner.txt`.

- **Empty file → banner is off.** Nothing else to flip — there's no separate
  on/off setting to get wrong.
- **Any text in the file → banner is on**, showing that text. Every line
  becomes its own paragraph with a small gap before the next one — you
  don't need a blank line between lines to get that spacing.
- **`**double asterisks**` → bold/highlighted.** Everything else renders at
  the normal (Medium) weight. Example:
  `**Praxis geschlossen vom 31.8. bis 4.9.**` renders that sentence bold.
- **A line starting with `#` → a comment, never shown on the site.** Use it
  to leave a note for the next person editing the file ("remove after
  4.9."), or to keep old/draft wording around without deleting it — just
  put `#` in front of lines you don't want live yet. If every real line is
  commented out, the banner is off, same as an empty file.

To change it (no coding needed):

1. Go to the file on GitHub: `content/banner.txt` in this repo.
2. Click the pencil (✎) icon to edit.
3. Type the new message, or delete everything to turn the banner off.
4. Scroll down and click **"Commit changes"** (committing straight to `main`
   is fine for this file).
5. Netlify redeploys automatically — the live site updates in under a minute.

No `enabled` flag, no JSON syntax (quotes/commas) to break by accident.
(A fuller CMS — Decap, with a proper editing form at `/admin` — is possible
later if this ever needs more than one text field, but needs Netlify
Identity turned on in the dashboard first; this plain-text approach needs
nothing extra to work today.)

## Deployment

Connected to Netlify, auto-deploys `main`. There is no contact form on the
site — visitors reach the practice by phone, via the 321med Online-Rezeption
floating widget, or via the `mailto:` link in the footer.
