# Lưu bút backend (Google Sheet)

The guestbook saves wishes to a Google Sheet that Như í owns. Setup takes about five minutes:

1. Create a new Google Sheet, for example "Lưu bút Như í".
2. In the sheet, open **Extensions → Apps Script**. Replace the editor's contents with `Code.gs` from this folder, then save.
3. Click **Deploy → New deployment**. Choose the type **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy** and approve the permissions.
4. Copy the web app URL (it ends in `/exec`) and paste it into `GUESTBOOK_URL` at the top of `script.js`.

Wishes appear in the `LuuBut` tab. To hide one from the page, type `x` in its "Ẩn" column.

Until `GUESTBOOK_URL` is set, the form opens a text message to Như í with the wish already written.
