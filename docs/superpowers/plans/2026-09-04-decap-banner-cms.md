# Decap CMS Banner Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the practice owner a `/admin` page where he edits `content/banner.json` (message, on/off, optional link) through a simple form and Save commits straight to `main`, triggering a Netlify rebuild — without him ever touching git, markdown, or code.

**Architecture:** Decap CMS (static admin app loaded from `admin/index.html` + `admin/config.yml`) using the `github` backend, authenticated via a Netlify serverless function implementing the standard OAuth code-exchange flow. Depends on the static site rebuild plan being deployed first (needs a live Netlify site + pushed GitHub repo to authenticate against).

**Tech Stack:** Decap CMS (loaded from its CDN script, config-only — no build step on our side), one Netlify Function (`netlify/functions/oauth.js`, plain Node using global `fetch`, no dependencies), one GitHub OAuth App.

**Spec:** [docs/superpowers/specs/2026-09-04-static-rebuild-design.md](../specs/2026-09-04-static-rebuild-design.md)

## Global Constraints

- No extra npm dependencies for the OAuth function — Node 18+ global `fetch` only (spec §5).
- The editing UI must expose only the 4 `banner.json` fields (`enabled`, `message`, `linkLabel`, `linkUrl`) — nothing else (spec §5).
- `message` is a plain-text widget, not markdown — no syntax for the practice owner to learn (spec §5).
- Requires the static-site-rebuild plan's Task 14 (Netlify site + GitHub repo live) to be done first.

---

### Task 1: GitHub OAuth App (manual setup, documented)

**Files:**
- Create: `docs/superpowers/notes/2026-09-04-oauth-app-setup.md` (records the app's Client ID and callback URL for later steps — not the secret)

- [ ] **Step 1: Register the OAuth App**

Direct the user (this needs a browser session logged into their GitHub account, not something to automate blind): go to https://github.com/settings/applications/new, set:
- Application name: `HNO Mayer-Brix Website CMS`
- Homepage URL: `https://pmb.makethings.work`
- Authorization callback URL: `https://pmb.makethings.work/.netlify/functions/oauth/callback`

Register it, then generate a new Client Secret.

- [ ] **Step 2: Record the Client ID (not the secret) for reference**

```markdown
<!-- docs/superpowers/notes/2026-09-04-oauth-app-setup.md -->
# GitHub OAuth App — CMS auth

- App name: HNO Mayer-Brix Website CMS
- Homepage URL: https://pmb.makethings.work
- Callback URL: https://pmb.makethings.work/.netlify/functions/oauth/callback
- Client ID: <fill in after registering — not secret, safe to record>
- Client Secret: stored ONLY in Netlify env vars (OAUTH_GITHUB_CLIENT_SECRET) — never committed
```

- [ ] **Step 3: Set Netlify environment variables**

In the Netlify site dashboard → Site configuration → Environment variables, add:
- `OAUTH_GITHUB_CLIENT_ID` = the Client ID from Step 1
- `OAUTH_GITHUB_CLIENT_SECRET` = the Client Secret from Step 1

- [ ] **Step 4: Commit the notes file (Client ID only, never the secret)**

```bash
git add docs/superpowers/notes/2026-09-04-oauth-app-setup.md
git commit -m "Record GitHub OAuth App setup notes for Decap CMS

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Netlify Function implementing the OAuth flow

**Files:**
- Create: `netlify/functions/oauth.js`
- Create: `tests/oauth.test.js`

**Interfaces:**
- Produces: `buildAuthorizeUrl(clientId: string, redirectUri: string): string` and `buildTokenExchangeBody(params: {code, clientId, clientSecret}): string`, exported from `netlify/functions/oauth.js` for unit testing. The function's default export (Netlify's handler signature `(event) => Response`) is not unit tested — verified end-to-end in Task 4.

- [ ] **Step 1: Write the failing tests for the pure URL/body builders**

```javascript
// tests/oauth.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthorizeUrl, buildTokenExchangeBody } from '../netlify/functions/oauth.js';

test('buildAuthorizeUrl points at GitHub with the right client id and scope', () => {
  const url = buildAuthorizeUrl('abc123', 'https://pmb.makethings.work/.netlify/functions/oauth/callback');
  assert.equal(
    url,
    'https://github.com/login/oauth/authorize?client_id=abc123&redirect_uri=https%3A%2F%2Fpmb.makethings.work%2F.netlify%2Ffunctions%2Foauth%2Fcallback&scope=repo'
  );
});

test('buildTokenExchangeBody url-encodes the code exchange params', () => {
  const body = buildTokenExchangeBody({ code: 'xyz', clientId: 'abc123', clientSecret: 'shh' });
  assert.equal(body, 'client_id=abc123&client_secret=shh&code=xyz');
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `node --test tests/`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `netlify/functions/oauth.js`**

```javascript
// netlify/functions/oauth.js
export function buildAuthorizeUrl(clientId, redirectUri) {
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: 'repo' });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function buildTokenExchangeBody({ code, clientId, clientSecret }) {
  return `client_id=${clientId}&client_secret=${clientSecret}&code=${code}`;
}

function popupResponseHtml(status, payload) {
  return `<!doctype html><html><body><script>
(function() {
  function receiveMessage() {
    window.opener.postMessage(
      'authorization:github:${status}:${JSON.stringify(payload)}',
      '*'
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;
}

export default async (request) => {
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/.netlify/functions/oauth/callback`;
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

  if (url.pathname.endsWith('/callback')) {
    const code = url.searchParams.get('code');
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: buildTokenExchangeBody({ code, clientId, clientSecret }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return new Response(popupResponseHtml('error', { message: tokenData.error_description || tokenData.error }), {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    return new Response(popupResponseHtml('success', { token: tokenData.access_token, provider: 'github' }), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return Response.redirect(buildAuthorizeUrl(clientId, redirectUri), 302);
};
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `node --test tests/`
Expected: PASS (2 new tests)

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/oauth.js tests/oauth.test.js
git commit -m "Add Netlify Function implementing Decap CMS GitHub OAuth flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Decap CMS admin UI and config

**Files:**
- Create: `admin/index.html`
- Create: `admin/config.yml`

**Interfaces:**
- Consumes: `content/banner.json`'s exact schema from the static-site-rebuild plan's Task 3 (`enabled`, `message`, `linkLabel`, `linkUrl`) — field names below must match exactly.

- [ ] **Step 1: Create `admin/config.yml`**

```yaml
backend:
  name: github
  repo: JonasASchmidt/dr-mayer-brix-website
  branch: main
  base_url: https://pmb.makethings.work
  auth_endpoint: /.netlify/functions/oauth

media_folder: "assets/img/uploads"
public_folder: "/assets/img/uploads"

collections:
  - name: "banner"
    label: "Ankündigungsbanner"
    files:
      - name: "banner"
        label: "Banner"
        file: "content/banner.json"
        fields:
          - { label: "Banner anzeigen", name: "enabled", widget: "boolean", default: true }
          - { label: "Text", name: "message", widget: "text", hint: "Leerzeile = neuer Absatz." }
          - { label: "Link-Beschriftung (optional)", name: "linkLabel", widget: "string", required: false }
          - { label: "Link-Ziel (optional)", name: "linkUrl", widget: "string", required: false }
```

- [ ] **Step 2: Create `admin/index.html`**

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HNO-Praxis Dr. Mayer-Brix — Banner bearbeiten</title>
  <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
  <!-- Pinned to an exact version (not a ^range) so the served file can't change
       under us; decap-cms has no published SRI hashes since it's a large,
       frequently-rebuilt bundle — pin-and-review-on-bump is the practical
       mitigation here instead. Check https://www.npmjs.com/package/decap-cms
       for the current latest 3.x before deploying and update this pin. -->
  <script src="https://unpkg.com/decap-cms@3.3.3/dist/decap-cms.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify config loads (local check, auth won't complete without the deployed OAuth function)**

Run: `python3 -m http.server 4173`, navigate the Browser tool to `http://localhost:4173/admin/`, screenshot. Expect: Decap's "Login with GitHub" screen renders without a JS console error about invalid YAML (check `read_console_messages`) — actual login will fail locally since `base_url`/`auth_endpoint` point at the production Netlify Function, which is expected and fine at this stage; full login is verified in Task 4 against the live deploy.

- [ ] **Step 4: Commit**

```bash
git add admin/index.html admin/config.yml
git commit -m "Add Decap CMS admin UI for the banner editor

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: End-to-end verification against the live deploy

**Files:** none — this task verifies previously-committed work after a real deploy, no code changes expected unless verification surfaces a bug (fix inline if so, in whichever file is at fault).

- [ ] **Step 1: Push and let Netlify deploy**

```bash
git push
```

Wait for the Netlify build to finish (check the Netlify dashboard or `netlify status`).

- [ ] **Step 2: Full login + edit + publish cycle**

Using the Browser tool, navigate to `https://pmb.makethings.work/admin/`. Click "Login with GitHub", complete the GitHub OAuth prompt (this needs a real logged-in GitHub session — use the account that has access to the `JonasASchmidt/dr-mayer-brix-website` repo). Expect: Decap's editor UI loads showing the "Ankündigungsbanner" collection with the current seeded content.

- [ ] **Step 3: Make a test edit and confirm it publishes**

Change the `message` field to a distinguishable test string, click "Publish" (or "Save" depending on Decap's editorial workflow setting — this config has no `publish_mode` set, so it's the default simple flow: Save commits directly to `main`). Wait ~1 minute for the Netlify rebuild, then navigate to `https://pmb.makethings.work/` and confirm the banner shows the new test text.

- [ ] **Step 4: Revert the test edit**

Through the same `/admin/` UI (or `git revert` the test commit), restore the real seeded banner content from the static-site-rebuild plan's Task 3, Step 5. Confirm it republishes correctly.

- [ ] **Step 5: Confirm the toggle works end-to-end**

In `/admin/`, switch "Banner anzeigen" off, publish, wait for rebuild, confirm the banner disappears on the live site (slot collapses per `banner.js`'s `renderBannerHTML` returning `''` when `enabled` is false). Switch it back on, publish, confirm it reappears.

---

## Self-review notes

- **Spec coverage**: spec §5 (banner CMS) fully covered — schema (Task 3), auth pattern replacing deprecated Netlify Identity (Tasks 1–2), end-to-end editing UX (Task 4).
- **Placeholder scan**: the only unresolved value is the OAuth Client ID/Secret, which cannot be known until the user registers the GitHub OAuth App in Task 1 — that's an inherent external dependency, not a plan placeholder (Task 1 Step 2's `<fill in after registering>` is explicitly a manual-step artifact, not code).
- **Type/name consistency**: `buildAuthorizeUrl`/`buildTokenExchangeBody` signatures used identically between their definitions (Task 2, Step 3) and their tests (Task 2, Step 1). `admin/config.yml`'s field names (`enabled`, `message`, `linkLabel`, `linkUrl`) match `content/banner.json`'s schema and `banner.js`'s `renderBannerHTML` destructuring exactly.
