---
name: canonical-360-backup
description: >-
  Back up your written Canonical 360 review feedback and draft reviews offline.
  Use when someone wants to export their 360 feedback (self-reflection, per-person
  "done well" / "encourage next" answers, and selected statements) to local files,
  or re-import offline-written drafts. Extraction is fully programmatic via a
  browser-console script — no LLM parsing required.
---

# Canonical 360 backup

A tiny, script-driven workflow to (1) export all of your 360 feedback to
Markdown + JSON and (2) optionally type offline drafts back into the tool.

Everything runs inside the user's own authenticated browser session. No
credentials are read, stored, or transmitted, and nothing is ever submitted
automatically.

## When to use
- "Back up my 360 feedback."
- "Export my written reviews so I can work offline."
- "Re-enter the reviews I drafted offline."

## Steps

### 1. Export a backup (programmatic — preferred)
1. Ask the user to log in to `https://360.canonical.com` and open their reviews page.
2. Have them open DevTools (F12) → Console.
3. Have them paste the contents of [`scripts/extract.js`](scripts/extract.js) and press Enter.
4. Two files download: `360-backup.md` (readable + offline template) and `360-backup.json`.

The script reads the reviewee list from the navigation, visits every review that
has content (self-reflection + anything marked *Completed*), and captures the
question labels, answers, and selected statements directly from the DOM. To-do /
skipped reviewees are listed with blank templates so they can be drafted offline.

### 2. Draft offline
Edit `360-backup.md` (or the JSON) in any editor. Blank sections are ready-to-fill
templates using the two standard prompts:
- *What have they done well in the past cycle?*
- *What would you encourage them to do in the next cycle?*

### 3. Re-import drafts (optional)
1. Log in and open the reviews page.
2. In the Console, set `window.__drafts = [{ name, done_well, encourage }, …]`.
3. Paste [`scripts/fill.js`](scripts/fill.js) and press Enter.
4. The script fills each reviewee's fields; the user reviews and clicks Save/Submit manually.

## Notes for the assistant
- Do **not** attempt to log in for the user or request their password/SSO/2FA.
- Prefer running `extract.js` over manually clicking and reading pages — it is
  faster, deterministic, and does not rely on the model to parse content.
- Never commit anyone's exported feedback (`360-backup.*`) to source control; it
  is private personal data.
- Selectors depend on the 360 UI: reviewee list `nav[aria-label="Reviews navigation"]`,
  feedback fields `main textarea`, statements `main [role="tab"]`. Update the
  scripts if the UI changes.
