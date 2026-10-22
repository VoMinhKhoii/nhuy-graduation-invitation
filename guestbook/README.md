# Lưu bút backend (Cloudflare Worker + D1)

The guestbook form posts to a small Cloudflare Worker, which saves each wish in a D1 database (SQLite). The site reads the wishes back from the same URL.

- Live URL: https://nhuy-luu-but.minhkhoitdn.workers.dev (already set as `GUESTBOOK_URL` in `js/main.js`)
- Database: `nhuy-luu-but`, table `wishes`
- Only the GitHub Pages site (and localhost) can read or post from a browser. One sender can post at most 10 wishes per 10 minutes.

## Reading or hiding wishes

Open the Cloudflare dashboard → **Storage & Databases → D1 → nhuy-luu-but → Console**, or run the same SQL from this folder:

```sh
npx wrangler d1 execute nhuy-luu-but --remote --command "SELECT id, name, message, created_at FROM wishes ORDER BY id DESC"
npx wrangler d1 execute nhuy-luu-but --remote --command "UPDATE wishes SET hidden = 1 WHERE id = 12"
```

A hidden wish stays in the database but no longer shows on the page.

## Changing the worker

Edit `src/index.js`, then run `npx wrangler deploy` from this folder. `schema.sql` creates the table on a new database:

```sh
npx wrangler d1 execute nhuy-luu-but --remote --file schema.sql
```
