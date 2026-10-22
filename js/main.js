// The Lưu bút backend: a Cloudflare Worker with a D1 (SQLite) table (see guestbook/README.md).
const GUESTBOOK_URL = 'https://nhuy-luu-but.minhkhoitdn.workers.dev';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Reveal sections once as they scroll in ----------
const revealer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    }
  }
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
document.querySelectorAll('[data-reveal]').forEach((el) => revealer.observe(el));

// ---------- Clothesline: the first photo on each wrapped line draws that line's twine ----------
const line = document.querySelector('.line');
function markRowStarts() {
  let rowTop = null;
  for (const item of line.children) {
    item.classList.toggle('is-row-start', item.offsetTop !== rowTop);
    rowTop = item.offsetTop;
  }
}
new ResizeObserver(markRowStarts).observe(line);

// ---------- Guestbook ----------
const form = document.getElementById('gb-form');
const list = document.getElementById('gb-notes');
const statusEl = document.getElementById('gb-status');
const emptyEl = document.getElementById('gb-empty');
const errorEl = document.getElementById('gb-msg-error');
const messageInput = form.elements.message;
const nameInput = form.elements.name;

function wishEl({ name, message }, isNew) {
  const li = document.createElement('li');
  li.className = isNew ? 'wish wish--new' : 'wish';
  const text = document.createElement('p');
  text.textContent = message;
  const from = document.createElement('span');
  from.className = 'wish__from';
  from.textContent = name || 'Ẩn danh';
  li.append(text, from);
  return li;
}

function showSkeletons(count) {
  list.setAttribute('aria-busy', 'true');
  emptyEl.hidden = true;
  for (let i = 0; i < count; i += 1) {
    const li = document.createElement('li');
    li.className = 'wish wish--skeleton';
    li.setAttribute('aria-hidden', 'true');
    list.append(li);
  }
}

function clearSkeletons() {
  list.querySelectorAll('.wish--skeleton').forEach((el) => el.remove());
  list.setAttribute('aria-busy', 'false');
}

async function loadWishes() {
  showSkeletons(3);
  try {
    const res = await fetch(GUESTBOOK_URL);
    const data = await res.json();
    clearSkeletons();
    const notes = data.notes || [];
    emptyEl.hidden = notes.length > 0;
    notes.forEach((note) => list.append(wishEl(note, false)));
  } catch {
    clearSkeletons();
    emptyEl.hidden = false;
    statusEl.textContent = 'Chưa tải được lưu bút, thử lại sau nha.';
  }
}

messageInput.addEventListener('input', () => {
  if (messageInput.value.trim()) {
    errorEl.hidden = true;
    messageInput.removeAttribute('aria-invalid');
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!message) {
    errorEl.hidden = false;
    messageInput.setAttribute('aria-invalid', 'true');
    messageInput.focus();
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  statusEl.textContent = 'Đang gửi…';
  try {
    // A text/plain body keeps this a simple request, so the browser skips the CORS preflight.
    const res = await fetch(GUESTBOOK_URL, { method: 'POST', body: JSON.stringify({ name, message }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'failed');
    emptyEl.hidden = true;
    list.prepend(wishEl({ name, message }, !reduceMotion.matches));
    form.reset();
    statusEl.textContent = 'Gửi rồi nè, cảm ơn nhiều nha!';
  } catch (err) {
    statusEl.textContent = err.message === 'too-many'
      ? 'Gửi nhiều quá rồi nè, đợi vài phút rồi gửi tiếp nha.'
      : 'Gửi chưa được, thử lại giúp í nha.';
  } finally {
    button.disabled = false;
  }
});

loadWishes();
