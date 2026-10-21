// Paste the Google Apps Script web app URL here (see apps-script/README.md).
// While it is empty, the guestbook opens a text message to Như í instead.
const GUESTBOOK_URL = '';
const PHONE = '0367174803';

// Reveal each part once as its section enters.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

// ---------- Lưu bút ----------
const form = document.getElementById('gb-form');
const list = document.getElementById('gb-notes');
const status = document.getElementById('gb-status');

function noteEl({ name, message }, isNew) {
  const li = document.createElement('li');
  li.className = isNew ? 'note note--new' : 'note';
  li.textContent = message;
  const from = document.createElement('span');
  from.className = 'note__from';
  from.textContent = '— ' + (name || 'Ẩn danh');
  li.append(from);
  return li;
}

function addNote(note, isNew) {
  list.querySelector('.note--empty')?.remove();
  if (isNew) list.prepend(noteEl(note, true));
  else list.append(noteEl(note, false));
}

async function loadNotes() {
  if (!GUESTBOOK_URL) return;
  try {
    const res = await fetch(GUESTBOOK_URL);
    const data = await res.json();
    (data.notes || []).forEach((n) => addNote(n, false));
  } catch {
    status.textContent = 'Chưa tải được lưu bút, thử lại sau nha.';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  const message = form.elements.message.value.trim();
  if (!message) { form.elements.message.focus(); return; }

  if (!GUESTBOOK_URL) {
    const body = encodeURIComponent(message + '\n— ' + (name || 'Ẩn danh'));
    status.innerHTML = '';
    status.append('Đang mở tin nhắn gửi í. Không mở được thì ');
    const a = document.createElement('a');
    a.href = `sms:${PHONE}?&body=${body}`;
    a.textContent = 'bấm vào đây';
    status.append(a, ' nhé.');
    window.location.href = a.href;
    return;
  }

  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Đang gửi…';
  try {
    // text/plain keeps this a simple request, which Apps Script accepts without a preflight.
    const res = await fetch(GUESTBOOK_URL, { method: 'POST', body: JSON.stringify({ name, message }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'failed');
    addNote({ name, message }, true);
    form.reset();
    status.textContent = 'Gửi rùi nè, cảm ơn nhìu nha!';
  } catch {
    status.textContent = 'Gửi chưa được, thử lại giúp í nha.';
  } finally {
    button.disabled = false;
  }
});

loadNotes();
