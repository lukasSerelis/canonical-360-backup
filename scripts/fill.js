/*
 * Canonical 360 — offline draft filler (optional)
 * -----------------------------------------------
 * Types your offline-written feedback back into the 360 tool so you don't have
 * to copy/paste person by person. It NEVER submits — you still review and save
 * each review yourself in the UI.
 *
 * Usage:
 *   1. Log in to https://360.canonical.com and open your reviews page.
 *   2. Prepare your drafts as an array and assign it to window.__drafts, e.g.:
 *
 *        window.__drafts = [
 *          { name: "Juan Ruitina", done_well: "…", encourage: "…" },
 *          { name: "Sophie Felder", done_well: "…", encourage: "…" },
 *        ];
 *
 *      (Names must match exactly as shown in the reviews list.)
 *   3. Paste this whole file into the DevTools Console and press Enter.
 *   4. Review every entry in the UI and click Save / Submit manually.
 */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SETTLE_MS = 1300;

  const drafts = window.__drafts;
  if (!Array.isArray(drafts) || !drafts.length) {
    alert('Set window.__drafts = [{ name, done_well, encourage }, …] first.');
    return;
  }

  const nav = document.querySelector('nav[aria-label="Reviews navigation"]');
  if (!nav) {
    alert('Open your 360 reviews page first.');
    return;
  }

  // React-controlled textareas need the native setter + input event.
  const setValue = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    ).set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  for (const d of drafts) {
    const link = [...nav.querySelectorAll('a')].find(
      (a) => a.children[0]?.textContent.trim() === d.name
    );
    if (!link) {
      console.warn('Reviewee not found, skipping:', d.name);
      continue;
    }
    link.click();
    await sleep(SETTLE_MS);

    const areas = [...document.querySelectorAll('main textarea')];
    if (d.done_well != null && areas[0]) setValue(areas[0], d.done_well);
    if (d.encourage != null && areas[1]) setValue(areas[1], d.encourage);
    await sleep(400);
    console.log('Filled draft for', d.name);
  }

  console.log('All drafts filled. Review each review and Save / Submit manually.');
})();
