// assets/js/email-obfuscate.js
//
// Keeps the practice's email address out of the static HTML/JS source as a
// plain "user@domain" string, so naive scrapers that regex page source (the
// bulk of address-harvesting spam bots) never see a harvestable address —
// only a page rendered by an actual browser reconstructs it.

export function buildAddress(user, domain) {
  return `${user}@${domain}`;
}

// Split-and-rejoin obfuscation: safe against a plain @-regex over raw HTML.
// Not a defense against a bot that runs full JS (nothing client-side is),
// which is an accepted, deliberate limit of "spam proof" here.
export function obfuscateEmailsInHtml(html) {
  const EMAIL_RE = /([A-Za-z0-9._%+-]+)@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;
  return html.replace(
    EMAIL_RE,
    (match, user, domain) =>
      `<a class="js-email" data-user="${user}" data-domain="${domain}" href="#">${user} (at) ${domain.replaceAll('.', ' (dot) ')}</a>`
  );
}

export function initEmailLinks(root = document) {
  root.querySelectorAll('a.js-email[data-user][data-domain]').forEach((el) => {
    const address = buildAddress(el.dataset.user, el.dataset.domain);
    el.href = `mailto:${address}`;
    if (!el.dataset.label) el.textContent = address;
  });
}
