/* Info Sheets MVP - bottom toolbar navigation */
const LANGS = ['en','es'];
const I18N = {
  en: { titleFallback: 'Info Sheets' },
  es: { titleFallback: 'Fichas' },
};

let state = {
  sheets: [],
  index: 0,
  lang: 'en',
};

async function loadSheets() {
  const file = `sheets.${state.lang}.json`;
  try {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error(`${file} must be an array`);
    state.sheets = data;
  } catch (err) {
    console.error(err);
    // Fallback demo data if fetch fails (e.g., opened via file://) per language
    if (state.lang === 'es') {
      state.sheets = [
        { id: 'bienvenida', title: 'Bienvenida', text: 'Demostración local. El navegador puede bloquear fetch(file://). Usa los datos de demostración o un servidor local.', image: 'images/placeholder-1.jpg', alt: 'Fondo degradado' },
        { id: 'navegacion', title: 'Navegación', text: 'Usa los botones de la barra inferior para moverte entre fichas. Los botones se desactivan al inicio y al final.', image: 'images/placeholder-2.jpg', alt: 'Degradado suave' },
        { id: 'editar', title: 'Editar sheets.es.json', text: 'Añade tus fichas editando sheets.es.json. Cada ficha necesita título, texto e imagen.', image: 'images/placeholder-3.jpg', alt: 'Fondo suave' },
      ];
    } else {
      state.sheets = [
        { id: 'welcome', title: 'Welcome', text: 'This is a local demo. Your browser may block fetch(file://). Use the demo data or run a local server.', image: 'images/placeholder-1.jpg', alt: 'Abstract gradient' },
        { id: 'navigation', title: 'Navigation', text: 'Use the bottom toolbar buttons to navigate. Buttons disable at the ends.', image: 'images/placeholder-2.jpg', alt: 'Soft gradient' },
        { id: 'edit-json', title: 'Edit sheets.en.json', text: 'Add your own sheets by editing sheets.en.json. Each sheet needs a title, text, and image URL.', image: 'images/placeholder-3.jpg', alt: 'Smooth gradient' },
      ];
    }
  }
}

function render() {
  const { sheets, index, lang } = state;
  const t = I18N[lang] || I18N.en;
  const sheet = sheets[index];
  const titleEl = document.getElementById('sheet-title');
  const imgEl = document.getElementById('sheet-image');
  const captionEl = document.getElementById('sheet-image-caption');
  const textEl = document.getElementById('sheet-text');
  const buttonsWrap = document.getElementById('sheet-buttons');

  if (!sheet) return;
  titleEl.textContent = sheet.title || t.titleFallback;

  imgEl.src = sheet.image || '';
  imgEl.alt = sheet.alt || sheet.title || '';
  captionEl.textContent = sheet.alt || '';

  textEl.innerHTML = '';
  const paras = (sheet.text || '').split(/\n\n+/);
  paras.forEach(p => {
    const el = document.createElement('p');
    el.textContent = p;
    textEl.appendChild(el);
  });

  // Render/Update buttons
  buttonsWrap.innerHTML = '';
  sheets.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(i === index));
    btn.setAttribute('aria-controls', 'sheet');

    // Build content with icon + optional label
    if (s.icon) {
      if (/\.(svg|png|jpg|jpeg|gif|webp)$/i.test(s.icon)) {
        btn.innerHTML = `<img src="${s.icon}" alt="" class="btn-icon" />`;
      } else {
        btn.innerHTML = `<span class="btn-emoji">${s.icon}</span>`;
      }
    } else {
      btn.innerHTML = `<span class="btn-emoji">${i + 1}</span>`;
    }
    if (s.label) {
      const label = document.createElement('span');
      label.className = 'btn-label';
      label.textContent = s.label;
      btn.appendChild(label);
    }

    btn.setAttribute('aria-label', s.title || s.label || `Sheet ${i+1}`);
    btn.addEventListener('click', () => {
      state.index = i;
      render();
    });
    buttonsWrap.appendChild(btn);
  });
}

function setupNav() {
  // Keyboard support: numbers select tabs 1..9
  window.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
      const idx = Math.min(Number(e.key) - 1, state.sheets.length - 1);
      if (idx >= 0) { state.index = idx; render(); }
    }
  });
}

function setupLangSelector() {
  const sel = document.getElementById('lang-select');
  sel.value = state.lang;
  sel.addEventListener('change', async () => {
    const prevLen = state.sheets.length;
    const prevIndex = state.index;
    state.lang = sel.value;
    localStorage.setItem('infoSheetsLang', state.lang);
    await loadSheets();
    // Keep index if possible
    if (state.sheets.length < prevLen && prevIndex >= state.sheets.length) {
      state.index = Math.max(0, state.sheets.length - 1);
    }
    render();
  });
}

function setupSwipe() {
  // Optional: keep swipe to move left/right by index
  let startX = 0, startY = 0, dx = 0, dy = 0;
  const threshold = 40; // px
  const main = document.getElementById('app-main');
  main.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY; dx = 0; dy = 0;
  }, { passive: true });
  main.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    dx = t.clientX - startX; dy = t.clientY - startY;
  }, { passive: true });
  main.addEventListener('touchend', () => {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx < 0 && state.index < state.sheets.length - 1) { state.index += 1; render(); }
      if (dx > 0 && state.index > 0) { state.index -= 1; render(); }
    }
  });
}

(async function init() {
  // Language init
  const savedLang = localStorage.getItem('infoSheetsLang');
  if (savedLang && LANGS.includes(savedLang)) state.lang = savedLang;
  else {
    const navLang = (navigator.language || 'en').slice(0,2).toLowerCase();
    state.lang = LANGS.includes(navLang) ? navLang : 'en';
  }

  setupNav();
  setupSwipe();
  await loadSheets();

  // Restore last index per language
  const savedIndexKey = `infoSheetsIndex:${state.lang}`;
  const saved = Number(localStorage.getItem(savedIndexKey));
  if (!Number.isNaN(saved) && saved >= 0 && saved < state.sheets.length) {
    state.index = saved;
  }

  setupLangSelector();
  render();

  // Persist on change per language: observe text changes (title updates when index changes)
  const titleEl = document.getElementById('sheet-title');
  const observer = new MutationObserver(() => {
    localStorage.setItem(`infoSheetsIndex:${state.lang}`, String(state.index));
  });
  observer.observe(titleEl, { childList: true });
})();
