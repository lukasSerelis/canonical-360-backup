/*
 * Canonical 360 — backup extractor
 * ---------------------------------
 * Programmatically walks your own authenticated 360 session, visits every
 * review that has content, and downloads a Markdown + JSON backup.
 *
 * Usage:
 *   1. Log in to https://360.canonical.com and open your reviews page.
 *   2. Open DevTools (F12) > Console.
 *   3. Paste this whole file and press Enter.
 *   4. Two files download: 360-backup.md and 360-backup.json.
 *
 * No credentials are read or stored. It only reads what is already on screen
 * in your logged-in session. It never submits or edits anything.
 */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SETTLE_MS = 1300; // wait for the SPA to render each review

  const nav = document.querySelector('nav[aria-label="Reviews navigation"]');
  if (!nav) {
    alert('Open your 360 reviews page (the list of reviewees must be visible) and try again.');
    return;
  }

  // 1) Build the ordered roster (category + name + status) straight from the nav.
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

  // 2) Extract whatever the currently-open review page shows.
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

  // 3) Visit each review that can hold content (Self + anything "Completed").
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

  // 4) Render Markdown.
  const clean = (s) => (s || '').trim();
  let md = `# Canonical 360 — Feedback Backup\n\n`;
  md += `**Backed up:** ${new Date().toISOString().slice(0, 10)}\n`;
  md += `**Source:** ${location.origin}\n`;
  const doneCount = data.filter((d) => /Completed/i.test(d.status)).length;
  md += `**Reviews with content captured:** ${doneCount}\n`;

  let cat = null;
  for (const d of data) {
    if (d.category !== cat) {
      cat = d.category;
      md += `\n---\n\n## ${cat}\n`;
    }
    md += `\n### ${d.name}${d.status ? ` — ${d.status}` : ''}\n`;
    if (d.statements?.length) {
      md += `\n**Selected statements**\n`;
      d.statements.forEach((s) => (md += `- ${s}\n`));
    }
    if (d.fields?.length) {
      d.fields.forEach((f, i) => {
        md += `\n**${clean(f.question) || 'Field ' + (i + 1)}**\n${clean(f.answer) || '_(blank)_'}\n`;
      });
    } else {
      // Empty template so it can be drafted offline.
      md += `\n**What have they done well in the past cycle?**\n\n`;
      md += `\n**What would you encourage them to do in the next cycle?**\n\n`;
    }
  }

  // 5) Trigger downloads.
  const download = (filename, text, type) => {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  download('360-backup.md', md, 'text/markdown');
  download('360-backup.json', JSON.stringify(data, null, 2), 'application/json');

  console.log(`360 backup complete — ${data.length} reviewees, ${doneCount} with content.`);
})();
