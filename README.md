# Canonical 360 backup

Two small browser-console scripts to **back up your written 360 feedback** and
**draft reviews offline** — no server, no install, no credentials handled.

Everything runs in your own logged-in session and reads only what's on screen.
Nothing is ever submitted automatically.

## Back up your feedback

1. Log in to `https://360.canonical.com` and open your reviews page.
2. Open DevTools (**F12**) → **Console**.
3. Paste all of [`scripts/extract.js`](scripts/extract.js) and press **Enter**.
4. `360-backup.md` and `360-backup.json` download automatically.

`360-backup.md` contains your self-reflection, every completed review
(*done well* / *encourage next* + selected statements), and blank templates for
the reviews you still have to do.

## Write reviews offline

Edit `360-backup.md` (or the JSON) in any editor. The blank sections are ready to
fill using the two standard prompts.

## Re-import your drafts (optional)

1. Log in and open your reviews page.
2. In the Console, set your drafts:

   ```js
   window.__drafts = [
     { name: "Jane Doe", done_well: "…", encourage: "…" },
   ];
   ```

3. Paste all of [`scripts/fill.js`](scripts/fill.js) and press **Enter**.
4. Each review is filled in — **review and Save/Submit each one yourself**.

## Notes

- Names in `window.__drafts` must match the reviews list exactly.
- Never commit your own `360-backup.*` files — they're private.
- If the 360 UI changes, update the selectors noted at the top of each script.

## License

MIT
