# Canonical 360 backup

**Back up your written 360 feedback and draft reviews offline — hands-off, driven
by your AI coding agent.** No server, no install, no credentials handled. Runs in
your own logged-in session, reads only what's on screen, never submits anything.

## Quick start (agent-driven — recommended)

Paste this into your AI coding agent (Copilot, etc.):

> Use the skill at https://github.com/lukasSerelis/canonical-360-backup to back up
> my Canonical 360 feedback.

Then just **log in to `https://360.canonical.com`** when the agent asks and open
your reviews page. The agent handles the rest: it walks every review, extracts
your feedback, and saves `360-backup.md` + `360-backup.json` into your workspace.
See [`SKILL.md`](SKILL.md) for the exact flow the agent follows.

To re-enter offline drafts, tell the agent you have drafts to import and it will
type them back in for you to review and save.

## Manual fallback (no agent)

1. Log in to `https://360.canonical.com` and open your reviews page.
2. Open DevTools (**F12**) → **Console**.
3. Paste all of [`scripts/extract.js`](scripts/extract.js) and press **Enter**.
4. `360-backup.md` and `360-backup.json` download automatically.

To re-import drafts manually: set `window.__drafts = [{ name, done_well, encourage }, …]`
in the Console, then paste [`scripts/fill.js`](scripts/fill.js). It fills each
review — you **Save/Submit each one yourself**.

## What you get

`360-backup.md` contains your self-reflection, every completed review
(*done well* / *encourage next* + selected statements), and blank templates for
the reviews you still have to do.

## Notes

- Names in `window.__drafts` must match the reviews list exactly.
- Never commit your own `360-backup.*` files — they're private (see `.gitignore`).
- If the 360 UI changes, update the selectors noted at the top of each script.

## License

MIT
