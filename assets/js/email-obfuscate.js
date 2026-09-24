// assets/js/email-obfuscate.js
//
// Keeps the practice's email address out of the static HTML/JS source as a
// plain "user@domain" string, so naive scrapers that regex page source (the
// bulk of address-harvesting spam bots) never see a harvestable address —
// only a page rendered by an actual browser reconstructs it.

export function buildAddress(user, domain) {
  return `${user}@${domain}`;
}

// user@domain, capturing user and domain separately.
export const EMAIL_PATTERN = '([A-Za-z0-9._%+-]+)@([A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,})';

// Split-and-rejoin obfuscation: safe against a plain @-regex over raw HTML.
// Not a defense against a bot that runs full JS (nothing client-side is),
// which is an accepted, deliberate limit of "spam proof" here.
//
// One obfuscated link. With a `label`, that text is shown instead of the
// address (data-label tells initEmailLinks not to overwrite it) — the
// label must already be HTML-escaped by the caller.
export function emailLinkHtml(user, domain, label) {
  const text = label ?? `${user} (at) ${domain.replaceAll('.', ' (dot) ')}`;
  const labelAttr = label ? ' data-label="1"' : '';
  return `<a class="js-email" data-user="${user}" data-domain="${domain}"${labelAttr} href="#">${text}</a>`;
}

// {user, domain} if the whole string is one email address, else null.
export function parseEmail(str) {
  const m = new RegExp(`^${EMAIL_PATTERN}$`).exec(str.trim());
  return m ? { user: m[1], domain: m[2] } : null;
}

export function obfuscateEmailsInHtml(html) {
  return html.replace(new RegExp(EMAIL_PATTERN, 'g'), (match, user, domain) => emailLinkHtml(user, domain));
}

export function initEmailLinks(root = document) {
  root.querySelectorAll('a.js-email[data-user][data-domain]').forEach((el) => {
    const address = buildAddress(el.dataset.user, el.dataset.domain);
    el.href = `mailto:${address}`;
    if (!el.dataset.label) el.textContent = address;
  });
}
