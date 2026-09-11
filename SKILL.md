---
name: canonical-360-backup
description: >-
  Hands-off backup of a user's written Canonical 360 review feedback, and offline
  drafting/re-import. Trigger this skill when a user pastes this repo's URL and
  asks to back up or export their 360 feedback, or to re-enter offline drafts.
  The agent drives a browser to extract everything programmatically (self-reflection,
  per-person "done well" / "encourage next" answers, and selected statements) and
  saves local files. No LLM parsing of content is required.
---

# Canonical 360 backup (agent-driven)

**Goal: the user pastes this repo URL, says "back up my 360 feedback", and the
agent does the rest.** Keep user input to a minimum — do not ask questions you can
answer by inspecting the page. The only thing the agent cannot do is log in.

## Golden path — the agent runs the whole thing

Follow these steps in order. Prefer this over the manual console script.

1. **Get the user into their session (one-time, unavoidable).**
   Ask the user to log in to `https://360.canonical.com` and open their reviews
   page in a shared browser tab. Never request or type their password/SSO/2FA;
   never attempt to authenticate for them.

2. **Attach to the tab.** Use the browser tools to open/share the page. Confirm the
   reviewee list is present by checking for `nav[aria-label="Reviews navigation"]`.

3. **Run the extraction core.** Evaluate the contents of
   [`scripts/agent-extract.js`](scripts/agent-extract.js) in the page (e.g. a
   Playwright `page.evaluate` / run-code tool). It clicks through every review with
   content and stores the result on `window.__fb360`, returning only a short status
   string.

   > ⚠️ **Do not return the full dataset from the page.** Several agent runtimes
   > write the tool's return value and the page snapshot to the *same* temp file,
   > so a large payload gets overwritten by the snapshot and is lost. That is the
   > cause of "the return value wasn't captured / content.txt only has the
   > snapshot". `agent-extract.js` avoids this by caching to `window.__fb360`.

4. **Pull the data back in small slices** (each small enough to return inline):

   ```js
   JSON.stringify(window.__fb360.slice(0, 5))
   JSON.stringify(window.__fb360.slice(5, 10))
   JSON.stringify(window.__fb360.slice(10, 15))
   // …continue until you've covered window.__fb360.length
   ```

   First check the count with `window.__fb360.length`, then slice in batches of ~5.

5. **Write the backup files to the workspace** from the collected slices:
   - `360-backup.json` — the raw array.
   - `360-backup.md` — grouped by category; each reviewee shows status, selected
     statements, and the two answers. For not-started reviewees, emit blank
     templates using the two standard prompts (see below) so they can be drafted
     offline.

6. **Report** a short summary: how many reviewees, how many had content, and the
   file paths. Do **not** paste the full feedback back into chat unless asked.

### The two standard prompts (used for blank templates)
- *What have they done well in the past cycle?*
- *What would you encourage them to do in the next cycle?*

## Offline drafting
The user edits `360-backup.md` (or the JSON) in any editor. Blank sections are
ready to fill.

## Re-import drafts (agent-driven, optional)
When the user is logged in with the reviews page open and wants drafts entered:
1. Have their drafts as `[{ name, done_well, encourage }, …]`.
2. Set `window.__drafts = <that array>` in the page, then evaluate
   [`scripts/fill.js`](scripts/fill.js). It types each answer into the fields but
   **never submits** — the user saves each review manually.

## Manual fallback (no agent)
If no agent/browser automation is available, the user can paste
[`scripts/extract.js`](scripts/extract.js) into DevTools → Console; it downloads
`360-backup.md` + `360-backup.json` directly.

## Guardrails for the assistant
- Never log in for the user or handle credentials/2FA.
- Prefer programmatic extraction; do not read/summarize each page with the model.
- Never commit anyone's `360-backup.*` — it is private personal data (see
  `.gitignore`).
- Selectors: list `nav[aria-label="Reviews navigation"]`, fields `main textarea`,
  statements `main [role="tab"]`, reviewee name `main a[href*="directory.canonical.com"]`.
  Update the scripts if the 360 UI changes.
