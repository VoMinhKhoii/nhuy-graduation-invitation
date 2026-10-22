// Paste the Google Apps Script web app URL here to turn on the shared guestbook (see apps-script/README.md).
// While it is empty, sending a wish opens a text message to Như í instead.
const GUESTBOOK_URL = '';
const PHONE = '0367174803';

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

// ---------- Clothesline: pin the section and pan sideways on desktop ----------
function setUpClothesline() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const section = document.querySelector('.memories');
  const track = section.querySelector('.memories__track');
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-pinned');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => section.classList.remove('is-pinned');
  });

  // Fonts and photos change the track width; measure again once everything has loaded.
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
setUpClothesline();

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
  if (!GUESTBOOK_URL) return;
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

  if (!GUESTBOOK_URL) {
    const body = encodeURIComponent(`${message}\n- ${name || 'Ẩn danh'}`);
    const link = document.createElement('a');
    link.href = `sms:${PHONE}?&body=${body}`;
    link.textContent = 'bấm vào đây';
    statusEl.replaceChildren('Đang mở tin nhắn gửi í. Không mở được thì ', link, ' nhé.');
    window.location.href = link.href;
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  statusEl.textContent = 'Đang gửi…';
  try {
    // A text/plain body keeps this a simple request, which Apps Script accepts without a preflight.
    const res = await fetch(GUESTBOOK_URL, { method: 'POST', body: JSON.stringify({ name, message }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'failed');
    emptyEl.hidden = true;
    list.prepend(wishEl({ name, message }, !reduceMotion.matches));
    form.reset();
    statusEl.textContent = 'Gửi rồi nè, cảm ơn nhiều nha!';
  } catch {
    statusEl.textContent = 'Gửi chưa được, thử lại giúp í nha.';
  } finally {
    button.disabled = false;
  }
});

loadWishes();
