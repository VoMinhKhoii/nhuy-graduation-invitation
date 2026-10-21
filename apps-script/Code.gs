// Lưu bút backend: a Google Sheet behind an Apps Script web app.
// Setup steps are in README.md next to this file.

const SHEET_NAME = 'LuuBut';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Thời gian', 'Tên', 'Lời chúc', 'Ẩn (gõ x để ẩn)']);
  }
  return sh;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Newest first; rows marked "x" in column D are hidden from the page.
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const notes = rows
    .filter((r) => r[2] && String(r[3]).trim().toLowerCase() !== 'x')
    .reverse()
    .map((r) => ({ at: r[0], name: String(r[1]), message: String(r[2]) }));
  return json_({ notes });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const name = String(data.name || '').trim().slice(0, 60);
    const message = String(data.message || '').trim().slice(0, 1000);
    if (!message) return json_({ ok: false, error: 'empty' });
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    sheet_().appendRow([new Date(), name, message, '']);
    lock.releaseLock();
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
