/* ===== STATE ===== */
const STORAGE_KEY = 'english_practice_notes';

let notes      = loadNotes();
let historyOpen = true;
let searchQuery = '';
let editingId   = null;

/* ===== DOM REFS ===== */
const appWrapper       = document.querySelector('.app-wrapper');
const viText           = document.getElementById('viText');
const enText           = document.getElementById('enText');
const viCount          = document.getElementById('viCount');
const enCount          = document.getElementById('enCount');
const btnSave          = document.getElementById('btnSave');
const btnSaveLabel     = document.getElementById('btnSaveLabel');
const btnNewNote       = document.getElementById('btnNewNote');
const editBanner       = document.getElementById('editBanner');
const btnClear         = document.getElementById('btnClear');
const btnSwap          = document.getElementById('btnSwap');
const btnPractice      = document.getElementById('btnPractice');
const btnToggleHistory = document.getElementById('btnToggleHistory');
const btnCloseHistory  = document.getElementById('btnCloseHistory');
const btnImport        = document.getElementById('btnImport');
const btnExport        = document.getElementById('btnExport');
const importFileInput  = document.getElementById('importFileInput');
const historyPanel     = document.getElementById('historyPanel');
const historyList      = document.getElementById('historyList');
const historyEmpty     = document.getElementById('historyEmpty');
const historyBadge     = document.getElementById('historyBadge');
const historySearch    = document.getElementById('historySearch');
const toast            = document.getElementById('toast');

/* ===== LOCAL STORAGE ===== */
function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/* ===== CHAR COUNTER ===== */
function updateCounters() {
  const vi = viText.value.length;
  const en = enText.value.length;
  viCount.textContent = vi > 0 ? `${vi.toLocaleString()} characters` : '0 characters';
  enCount.textContent = en > 0 ? `${en.toLocaleString()} characters` : '0 characters';
}

viText.addEventListener('input', updateCounters);
enText.addEventListener('input', updateCounters);

/* ===== SAVE / UPDATE NOTE ===== */
btnSave.addEventListener('click', () => {
  const vi = viText.value.trim();
  const en = enText.value.trim();

  if (!vi && !en) {
    showToast('Please enter some content before saving.', 'error');
    return;
  }

  if (editingId !== null) {
    const idx = notes.findIndex(n => n.id === editingId);
    if (idx !== -1) {
      notes[idx].vi = vi;
      notes[idx].en = en;
      notes[idx].updatedAt = new Date().toISOString();
      saveNotes();
      renderHistory();
      showToast('✓ Note updated!');
    }
    exitEditMode();
    return;
  }

  const duplicate = notes.find(n => n.vi.trim() === vi);
  if (duplicate) {
    showToast('A note with this Vietnamese text already exists.', 'error');
    return;
  }

  const note = {
    id: Date.now(),
    vi,
    en,
    createdAt: new Date().toISOString(),
  };

  notes.unshift(note);
  saveNotes();
  renderHistory();
  updateBadge();

  viText.value = '';
  enText.value = '';
  updateCounters();

  showToast('✓ Note saved!');

  historyBadge.style.transform = 'scale(1.4)';
  setTimeout(() => { historyBadge.style.transform = ''; }, 300);
});

/* ===== EDIT MODE ===== */
function enterEditMode(note) {
  editingId = note.id;
  editBanner.classList.add('visible');
  btnSaveLabel.textContent = 'Update';
  renderHistory();
}

function exitEditMode() {
  editingId = null;
  editBanner.classList.remove('visible');
  btnSaveLabel.textContent = 'Save';
  viText.value = '';
  enText.value = '';
  updateCounters();
  renderHistory();
}

btnNewNote.addEventListener('click', exitEditMode);

/* ===== CLEAR ===== */
btnClear.addEventListener('click', () => {
  if (!viText.value && !enText.value && !editingId) return;
  if (editingId) {
    exitEditMode();
  } else {
    viText.value = '';
    enText.value = '';
    updateCounters();
    showToast('Content cleared.');
  }
});

/* ===== SWAP ===== */
btnSwap.addEventListener('click', () => {
  const tmp = viText.value;
  viText.value = enText.value;
  enText.value = tmp;
  updateCounters();
});

/* ===== HISTORY TOGGLE ===== */
btnToggleHistory.addEventListener('click', () => toggleHistory(true));
btnCloseHistory.addEventListener('click', () => toggleHistory(false));

function isMobile() {
  return window.innerWidth <= 900;
}

function toggleHistory(open) {
  historyOpen = open;
  if (isMobile()) {
    historyPanel.classList.toggle('open', open);
  } else {
    appWrapper.classList.toggle('history-hidden', !open);
  }
}

historyPanel.addEventListener('click', (e) => {
  if (e.target === historyPanel && isMobile()) toggleHistory(false);
});

/* ===== SEARCH ===== */
historySearch.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderHistory();
});

/* ===== RENDER HISTORY ===== */
function renderHistory() {
  const filtered = notes.filter(n => {
    if (!searchQuery) return true;
    return (
      n.vi.toLowerCase().includes(searchQuery) ||
      n.en.toLowerCase().includes(searchQuery)
    );
  });

  historyEmpty.style.display = filtered.length === 0 ? 'flex' : 'none';

  [...historyList.querySelectorAll('.history-item')].forEach(el => el.remove());

  filtered.forEach((note, idx) => {
    const item = buildHistoryItem(note, idx);
    historyList.appendChild(item);
  });
}

function buildHistoryItem(note, idx) {
  const item = document.createElement('div');
  item.className = 'history-item' + (note.id === editingId ? ' active' : '');
  item.setAttribute('data-id', note.id);
  item.style.animationDelay = `${idx * 0.04}s`;

  const dt     = formatDate(note.createdAt);
  const viHtml = highlight(note.vi || '(empty)');
  const enHtml = highlight(note.en || '(empty)');

  item.innerHTML = `
    <div class="history-item-time">
      <span>${dt}</span>
      <button class="history-item-delete" title="Delete this note">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="history-item-vi">${viHtml}</div>
    <div class="history-item-en">${enHtml}</div>
  `;

  item.addEventListener('click', (e) => {
    if (e.target.closest('.history-item-delete')) return;
    viText.value = note.vi;
    enText.value = note.en;
    updateCounters();
    enterEditMode(note);
    viText.focus();
  });

  item.querySelector('.history-item-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteNote(note.id, item);
  });

  return item;
}

function deleteNote(id, el) {
  el.style.transition = 'all 0.25s ease';
  el.style.opacity    = '0';
  el.style.transform  = 'translateX(20px)';
  el.style.maxHeight  = el.offsetHeight + 'px';
  setTimeout(() => {
    el.style.maxHeight   = '0';
    el.style.marginBottom = '0';
    el.style.padding     = '0';
  }, 200);
  setTimeout(() => {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    el.remove();
    updateBadge();
    if (notes.length === 0) historyEmpty.style.display = 'flex';
    if (editingId === id) exitEditMode();
    showToast('Note deleted.');
  }, 420);
}

/* ===== EXPORT ===== */
btnExport.addEventListener('click', () => {
  if (notes.length === 0) {
    showToast('No notes to export.', 'error');
    return;
  }

  const data    = notes.map(n => ({ vi: n.vi, en: n.en }));
  const json    = JSON.stringify(data, null, 2);
  const blob    = new Blob([json], { type: 'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  const date    = new Date().toISOString().slice(0, 10);
  a.href        = url;
  a.download    = `english-notes-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast(`✓ Exported ${notes.length} note${notes.length > 1 ? 's' : ''}.`);
});

/* ===== IMPORT ===== */
btnImport.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);

      if (!Array.isArray(parsed)) throw new Error('Not an array');

      const valid = parsed.filter(item =>
        item && typeof item === 'object' &&
        (typeof item.vi === 'string' || typeof item.en === 'string')
      );

      if (valid.length === 0) {
        showToast('No valid notes found in file.', 'error');
        return;
      }

      const existingVi = new Set(notes.map(n => n.vi.trim()));

      const imported = valid
        .filter(item => {
          const viVal = (item.vi || '').trim();
          if (!viVal || existingVi.has(viVal)) return false;
          existingVi.add(viVal);
          return true;
        })
        .map(item => ({
          id: Date.now() + Math.random(),
          vi: item.vi || '',
          en: item.en || '',
          createdAt: new Date().toISOString(),
        }));

      const skipped = valid.length - imported.length;

      if (imported.length === 0) {
        showToast('All notes already exist (duplicates skipped).', 'error');
        return;
      }

      notes = [...imported, ...notes];
      saveNotes();
      renderHistory();
      updateBadge();

      const msg = skipped > 0
        ? `✓ Imported ${imported.length} note${imported.length > 1 ? 's' : ''} (${skipped} duplicate${skipped > 1 ? 's' : ''} skipped).`
        : `✓ Imported ${imported.length} note${imported.length > 1 ? 's' : ''}.`;
      showToast(msg);
    } catch {
      showToast('Invalid JSON file.', 'error');
    }

    importFileInput.value = '';
  };
  reader.readAsText(file);
});

/* ===== BADGE ===== */
function updateBadge() {
  historyBadge.textContent = notes.length;
}

/* ===== HELPERS ===== */
function showToast(msg, type = 'success') {
  toast.textContent = msg;
  toast.className   = 'toast' + (type === 'error' ? ' error' : '');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function formatDate(iso) {
  const d      = new Date(iso);
  const now    = new Date();
  const diffMs  = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);

  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffH < 24)   return `${diffH} hour${diffH > 1 ? 's' : ''} ago`;

  return d.toLocaleDateString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function highlight(text) {
  if (!searchQuery) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const re      = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
  return escaped.replace(re, '<span class="highlight">$1</span>');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ===== PRACTICE MODE ===== */
const practiceOverlay      = document.getElementById('practiceOverlay');
const practiceViText       = document.getElementById('practiceViText');
const practiceEnText       = document.getElementById('practiceEnText');
const practiceEnSection    = document.getElementById('practiceEnSection');
const practiceUserInput    = document.getElementById('practiceUserInput');
const practiceResult       = document.getElementById('practiceResult');
const practiceDiff         = document.getElementById('practiceDiff');
const practiceResultScore  = document.getElementById('practiceResultScore');
const practiceProgress     = document.getElementById('practiceProgress');
const practiceProgressBar  = document.getElementById('practiceProgressBar');
const practiceCard         = document.getElementById('practiceCard');
const btnCheck             = document.getElementById('btnCheck');
const btnReveal            = document.getElementById('btnReveal');
const btnTryAgain          = document.getElementById('btnTryAgain');
const btnPracticePrev      = document.getElementById('btnPracticePrev');
const btnPracticeNext      = document.getElementById('btnPracticeNext');
const btnShuffle           = document.getElementById('btnShuffle');
const btnExitPractice      = document.getElementById('btnExitPractice');
const btnExitPracticeEmpty = document.getElementById('btnExitPracticeEmpty');
const practiceEmpty        = document.getElementById('practiceEmpty');
const practiceStage        = practiceCard.closest('.practice-stage');
const practiceNav          = document.querySelector('.practice-nav');

let practiceQueue = [];
let practiceIdx   = 0;
let isShuffled    = false;

function openPractice() {
  if (notes.length === 0) {
    practiceQueue = [];
    practiceStage.classList.add('hidden');
    practiceNav.classList.add('hidden');
    practiceEmpty.classList.add('visible');
  } else {
    practiceQueue = [...notes];
    practiceIdx   = 0;
    isShuffled    = false;
    btnShuffle.classList.remove('shuffled');
    practiceStage.classList.remove('hidden');
    practiceNav.classList.remove('hidden');
    practiceEmpty.classList.remove('visible');
    renderPracticeCard();
  }
  practiceOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePractice() {
  practiceOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderPracticeCard(direction = 'none') {
  const note = practiceQueue[practiceIdx];

  if (direction !== 'none') {
    practiceCard.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    practiceCard.style.opacity    = '0';
    practiceCard.style.transform  = direction === 'next' ? 'translateX(-16px)' : 'translateX(16px)';
    setTimeout(() => {
      practiceCard.style.transition = '';
      practiceCard.style.opacity    = '';
      practiceCard.style.transform  = '';
      fillCard(note);
    }, 150);
  } else {
    fillCard(note);
  }
}

function fillCard(note) {
  practiceViText.textContent = note.vi || '(empty)';
  practiceEnText.textContent = note.en || '(empty)';

  practiceUserInput.value = '';
  practiceEnSection.classList.remove('revealed');
  practiceResult.classList.remove('visible');
  practiceDiff.innerHTML = '';
  btnReveal.classList.remove('revealed');
  btnReveal.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    Reveal answer`;

  const current = practiceIdx + 1;
  const total   = practiceQueue.length;
  practiceProgress.textContent        = `${current} / ${total}`;
  practiceProgressBar.style.width     = `${(current / total) * 100}%`;
  btnPracticePrev.disabled            = practiceIdx === 0;
  btnPracticeNext.disabled            = practiceIdx === practiceQueue.length - 1;

  setTimeout(() => practiceUserInput.focus(), 200);
}

/* ===== DIFF / CHECK ===== */
function lcs(a, b) {
  const m  = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);

  const result = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i-1] === b[j-1])            { result.unshift({ type: 'match', val: a[i-1] }); i--; j--; }
    else if (dp[i-1][j] >= dp[i][j-1]) { result.unshift({ type: 'del',   val: a[i-1] }); i--; }
    else                               { result.unshift({ type: 'ins',   val: b[j-1] }); j--; }
  }
  while (i > 0) { result.unshift({ type: 'del', val: a[i-1] }); i--; }
  while (j > 0) { result.unshift({ type: 'ins', val: b[j-1] }); j--; }
  return result;
}

function tokenize(text) {
  return text.trim().toLowerCase().match(/[\w']+|[^\w\s]/g) || [];
}

function runCheck() {
  const answer   = practiceEnText.textContent;
  const userText = practiceUserInput.value.trim();

  if (!userText) {
    practiceUserInput.focus();
    practiceUserInput.classList.add('shake');
    setTimeout(() => practiceUserInput.classList.remove('shake'), 400);
    return;
  }

  const answerTokens = tokenize(answer);
  const userTokens   = tokenize(userText);
  const diff         = lcs(answerTokens, userTokens);

  let correctCount = 0;
  let html         = '';

  diff.forEach(d => {
    const w = escapeHtml(d.val);
    if (d.type === 'match') {
      correctCount++;
      html += `<span class="word-correct">${w}</span> `;
    } else if (d.type === 'del') {
      html += `<span class="word-wrong">${w}</span> `;
    } else {
      html += `<span class="word-extra">${w}</span> `;
    }
  });

  const total = answerTokens.length;
  const pct   = total > 0 ? Math.round((correctCount / total) * 100) : 100;
  const cls   = pct >= 80 ? 'score-good' : pct >= 50 ? 'score-mid' : 'score-bad';
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '🙂' : '💪';

  practiceResultScore.innerHTML =
    `${emoji} Score: <span class="score-num ${cls}">${pct}%</span>` +
    `<span style="color:var(--text-muted);font-weight:400;margin-left:6px">(${correctCount}/${total} words)</span>`;

  practiceDiff.innerHTML = html;
  practiceResult.classList.add('visible');

  practiceEnSection.classList.add('revealed');
  btnReveal.classList.add('revealed');
  btnReveal.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
    Hide answer`;
}

btnCheck.addEventListener('click', runCheck);

btnTryAgain.addEventListener('click', () => {
  practiceResult.classList.remove('visible');
  practiceEnSection.classList.remove('revealed');
  btnReveal.classList.remove('revealed');
  btnReveal.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    Reveal answer`;
  practiceUserInput.value = '';
  practiceUserInput.focus();
});

btnReveal.addEventListener('click', () => {
  const isRevealed = practiceEnSection.classList.contains('revealed');
  if (isRevealed) {
    practiceEnSection.classList.remove('revealed');
    btnReveal.classList.remove('revealed');
    btnReveal.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      Reveal answer`;
  } else {
    practiceEnSection.classList.add('revealed');
    btnReveal.classList.add('revealed');
    btnReveal.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
      Hide answer`;
  }
});

btnPracticeNext.addEventListener('click', () => {
  if (practiceIdx < practiceQueue.length - 1) {
    practiceIdx++;
    renderPracticeCard('next');
  }
});

btnPracticePrev.addEventListener('click', () => {
  if (practiceIdx > 0) {
    practiceIdx--;
    renderPracticeCard('prev');
  }
});

btnShuffle.addEventListener('click', () => {
  isShuffled = !isShuffled;
  btnShuffle.classList.toggle('shuffled', isShuffled);
  if (isShuffled) {
    practiceQueue = [...notes];
    for (let i = practiceQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [practiceQueue[i], practiceQueue[j]] = [practiceQueue[j], practiceQueue[i]];
    }
  } else {
    practiceQueue = [...notes];
  }
  practiceIdx = 0;
  renderPracticeCard();
});

btnPractice.addEventListener('click', openPractice);
btnExitPractice.addEventListener('click', closePractice);
btnExitPracticeEmpty.addEventListener('click', closePractice);

/* ===== KEYBOARD SHORTCUTS ===== */
document.addEventListener('keydown', (e) => {
  if (practiceOverlay.classList.contains('open')) {
    if (e.key === 'Escape')                        { closePractice(); return; }
    if (e.key === 'ArrowRight')                    { btnPracticeNext.click(); return; }
    if (e.key === 'ArrowLeft')                     { btnPracticePrev.click(); return; }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!practiceResult.classList.contains('visible')) runCheck();
      else btnPracticeNext.click();
      return;
    }
    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    btnSave.click();
  }
  if (e.key === 'Escape' && historyOpen) {
    toggleHistory(false);
  }
});

/* ===== INIT ===== */
updateBadge();
updateCounters();
renderHistory();
