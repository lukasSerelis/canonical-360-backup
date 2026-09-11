/*
 * Canonical 360 — agent-driven extraction core
 * --------------------------------------------
 * This is meant to be evaluated by a coding agent inside the user's already
 * logged-in 360 browser tab (e.g. via a Playwright `page.evaluate`).
 *
 * WHY IT CACHES INSTEAD OF RETURNING THE DATA:
 * Some agent runtimes write a tool's return value and the page-accessibility
 * snapshot to the SAME temp file, so a large returned payload gets overwritten
 * by the snapshot and is lost. To avoid that, this script stores the result on
 * `window.__fb360` and returns only a short status string. The agent then pulls
 * the data back in small slices that are guaranteed to fit inline:
 *
 *     JSON.stringify(window.__fb360.slice(0, 5))
 *     JSON.stringify(window.__fb360.slice(5, 10))
 *     ...
 *
 * It reads only what is already on screen in the user's session. It never logs
 * in, edits, or submits anything.
 */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SETTLE_MS = 1300; // wait for the SPA to render each review

  const nav = document.querySelector('nav[aria-label="Reviews navigation"]');
  if (!nav) return 'ERROR: reviews navigation not found — open the 360 reviews page';

  // 1) Ordered roster (category + name + status) from the nav.
  const roster = [];
  let category = 'General';
  nav.querySelectorAll('h2, a').forEach((el) => {
    if (el.tagName === 'H2') {
      category = el.textContent.trim();
      return;
    }
    const kids = [...el.children];
    const name = (kids[0]?.textContent || el.textContent).trim();
    const status = kids.length > 1 ? kids[kids.length - 1].textContent.trim() : '';
    if (name) roster.push({ category, name, status, isSelf: name.toLowerCase() === 'self' });
  });

  const findLink = (name) =>
    [...nav.querySelectorAll('a')].find((a) => a.children[0]?.textContent.trim() === name);

  const extractCurrent = () => {
    const nameEl = document.querySelector('main a[href*="directory.canonical.com"]');
    const revName = nameEl ? nameEl.textContent.trim() : null;

    const fields = [...document.querySelectorAll('main textarea')].map((t) => {
      let question = t.getAttribute('aria-label') || '';
      if (!question) {
        const q = t.parentElement?.previousElementSibling;
        if (q) question = q.textContent.replace(/\s+/g, ' ').trim();
      }
      return { question, answer: t.value };
    });

    const statements = [...document.querySelectorAll('main [role="tab"]')]
      .map((e) => e.textContent.replace(/\s+/g, ' ').trim())
      .filter((s) => /Selected statement/i.test(s))
      .map((s) => {
        const [head, tail = ''] = s.split(/Selected statement\s*:?/i);
        const cat = head.replace(/^Menu\s*/i, '').trim();
        const st = tail.replace(/^:?\s*/, '').trim();
        return st ? `${cat}: ${st}` : null;
      })
      .filter(Boolean);

    return { revName, fields, statements };
  };

  // 2) Visit each review that can hold content (Self + anything "Completed").
  const data = [];
  for (const entry of roster) {
    const hasContent = entry.isSelf || /Completed/i.test(entry.status);
    if (!hasContent) {
      data.push({ ...entry, fields: [], statements: [] });
      continue;
    }
    const link = findLink(entry.name);
    if (!link) {
      data.push({ ...entry, fields: [], statements: [], error: 'nav link not found' });
      continue;
    }
    link.click();
    await sleep(SETTLE_MS);
    data.push({ ...entry, ...extractCurrent() });
  }

  window.__fb360 = data;
  const done = data.filter((d) => /Completed/i.test(d.status)).length;
  return `cached ${data.length} reviewees on window.__fb360 (${done} with content)`;
})();
