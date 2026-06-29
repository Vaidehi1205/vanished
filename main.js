// ===== VANISHED — MAIN GAME LOOP =====
import { state, initState, advanceTime, addTimelineEntry, getTimeLabel,
         trustModifier, moralityShift, markFactDiscovered, isFactKnown,
         unlockLocation, canTravel, LOCATIONS, countKeyCluesFound,
         determineEnding } from './gamestate.js';
import { getDialogueTree } from './dialogue.js';
import { getHotspots, getSceneBg } from './scenes.js';
import { updateHUD, renderHUD, renderScene, renderCluePanel, renderNotebook,
         renderEndingScreen, renderMapScreen, showNotification } from './ui.js';
import { initBoard, rebuildPins, render as renderBoard, handleBoardClick,
         getKeyConnectionsMade } from './board.js';
import { createStarAudio } from '/star-sdk/audio.js';

// Expose scene API for ui.js
window.__sceneAPI__ = { getHotspots, getSceneBg };

// ===== AUDIO =====
let audio = null;
const AMBIENT_URL = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/83095140-072a-4aab-955a-0dd99b56cb57.mp3';

async function initAudio() {
  try {
    audio = createStarAudio();
    audio.preload({ 'ambient': AMBIENT_URL });
  } catch (e) { /* audio optional */ }
}

function playAmbient() {
  try { audio && audio.loop('ambient', 0.25); } catch (e) {}
}

function playSfx(name) {
  try {
    if (!audio) return;
    const sfxMap = {
      clue: 'ping',
      reveal: 'success',
      wrong: 'error',
      connect: 'click',
      travel: 'whoosh',
    };
    audio.play(sfxMap[name] || 'click');
  } catch (e) {}
}

// ===== GAME STATE =====
let currentModal = null; // 'clues' | 'notebook' | 'board' | 'map' | 'dialogue' | 'accusation'
let activeDialogue = null;
let activeDialogueSuspect = null;
let pendingEventText = null;
let boardInitialized = false; // track if board listeners wired

// ===== ROOT HTML =====
function buildRoot() {
  const root = document.getElementById('game-root');
  root.innerHTML = `
    <!-- RAIN EFFECT -->
    <div class="rain-container" id="rain"></div>

    <!-- TITLE SCREEN -->
    <div id="title-screen" class="screen">
      <div class="title-rain"></div>
      <div class="title-overlay"></div>
      <div class="title-content">
        <div class="game-title">VANISHED</div>
        <div class="game-subtitle">A Detective Mystery</div>
        <div class="title-tagline">
          "The rain doesn't care about your deadline."
        </div>
        <div style="margin-bottom:0.5rem;">
          <button class="btn-primary" id="start-btn">BEGIN INVESTIGATION</button>
        </div>
        <div style="margin-top:1rem;color:#4b5563;font-size:0.7rem;max-width:340px;line-height:1.6;">
          Night 2 of the school trip. Emily Carter, 17, is missing.<br>
          Roads cut off. The mountain is sealed by rain.<br>
          Follow the evidence. Break the story open.
        </div>
      </div>
    </div>

    <!-- GAME HUD -->
    <div id="game-hud" class="hidden"></div>

    <!-- SCENE VIEW -->
    <div id="scene-view" class="hidden" style="position:fixed;inset:0;top:56px;bottom:80px;"></div>

    <!-- BOTTOM NAV -->
    <div id="bottom-nav" class="hidden">
      <button class="nav-btn" id="nav-hotel">
        <span class="nav-icon">🏨</span>Hotel
      </button>
      <button class="nav-btn" id="nav-suspects">
        <span class="nav-icon">👥</span>Suspects
      </button>
      <button class="nav-btn" id="nav-accuse">
        <span class="nav-icon">⚖️</span>Accuse
      </button>
      <button class="nav-btn" id="nav-rescue">
        <span class="nav-icon">🔦</span>Rescue
      </button>
    </div>

    <!-- BOARD SCREEN -->
    <div id="board-screen" class="hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:56px;background:rgba(0,0,0,0.95);border-bottom:1px solid #1f2937;display:flex;align-items:center;justify-content:space-between;padding:0 1rem;z-index:10;">
        <div style="color:#e8c87a;letter-spacing:0.15em;font-size:0.95rem;">📌 DEDUCTION BOARD</div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <span style="color:#6b7280;font-size:0.7rem;" id="board-hint">Select two pins to connect them with string</span>
          <button class="hud-btn" id="board-close-btn">✕ Close</button>
        </div>
      </div>
      <div class="board-canvas-wrap">
        <canvas id="board-canvas"></canvas>
      </div>
      <div class="board-controls">
        <span style="color:#6b7280;font-size:0.7rem;">
          🔴 Key connection &nbsp;|&nbsp; 🟡 Standard connection &nbsp;|&nbsp; Click same pin to deselect
        </span>
      </div>
    </div>

    <!-- MAP SCREEN -->
    <div id="map-screen" class="hidden"></div>

    <!-- MODAL OVERLAY -->
    <div id="modal-overlay" class="modal-overlay hidden">
      <div class="modal-box" id="modal-box"></div>
    </div>

    <!-- DIALOGUE PANEL -->
    <div id="dialogue-panel" class="hidden"></div>
  `;
}

// ===== RAIN EFFECT =====
function spawnRain() {
  const container = document.getElementById('rain');
  if (!container) return;
  for (let i = 0; i < 60; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.height = `${Math.random() * 60 + 30}px`;
    drop.style.animationDuration = `${Math.random() * 0.6 + 0.4}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    drop.style.opacity = `${Math.random() * 0.5 + 0.1}`;
    container.appendChild(drop);
  }
}

// ===== TITLE SCREEN =====
function showTitle() {
  document.getElementById('title-screen').classList.remove('hidden');
  document.getElementById('game-hud').classList.add('hidden');
  document.getElementById('scene-view').classList.add('hidden');
  document.getElementById('bottom-nav').classList.add('hidden');
}

// ===== START GAME =====
function startGame() {
  initState();
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('game-hud').classList.remove('hidden');
  document.getElementById('scene-view').classList.remove('hidden');
  document.getElementById('bottom-nav').classList.remove('hidden');

  renderHUD();
  wireHUDButtons();
  wireBottomNav();
  navigateTo('hotel');
  playAmbient();

  // Opening narration
  showModal(`
    <div class="modal-header">
      <div class="modal-title">📋 CASE BRIEFING</div>
      <button class="modal-close" data-close>✕</button>
    </div>
    <div class="modal-body">
      <div style="color:#9ca3af;font-size:0.8rem;margin-bottom:1.2rem;line-height:1.7;font-style:italic;">
        <strong style="color:#e8c87a;">22:00 — Heritage Mountain Hotel</strong><br><br>
        Emily Carter, age 17, did not return from the excursion's free period this evening.
        Her roommate Sarah Kim reported her missing at 9:45pm.<br><br>
        Heavy rain has closed mountain roads, leaving the hotel isolated and everyone on edge.
        You've been tasked with conducting the initial investigation before memories harden into alibis.<br><br>
        Her phone was found in her room, damaged. A notebook with cryptic writing. Mud on her boots from an earlier excursion.<br><br>
        <strong style="color:#e8c87a;">Every answer changes the shape of the case.</strong>
      </div>
      <div style="background:rgba(239,68,68,0.08);border:1px solid #7f1d1d;padding:0.8rem;margin-bottom:1rem;">
        <div style="color:#fca5a5;font-size:0.75rem;letter-spacing:0.1em;margin-bottom:0.4rem;">OBJECTIVES</div>
        <div style="color:#d1d5db;font-size:0.8rem;line-height:1.7;">
          • Locate Emily Carter<br>
          • Determine if she left voluntarily or was abducted<br>
          • Identify who is responsible<br>
          • Find and rescue her if possible
        </div>
      </div>
      <div style="color:#6b7280;font-size:0.72rem;line-height:1.6;">
        💡 <strong>Tips:</strong> Search locations for clues. Interview suspects to raise trust and unlock new dialogue. Connect evidence on the Deduction Board. Revisit witnesses after finding new proof.
      </div>
      <div style="margin-top:1.2rem;text-align:center;">
        <button class="btn-primary" data-close>BEGIN INVESTIGATION →</button>
      </div>
    </div>
  `);
}

// ===== NAVIGATION =====
function navigateTo(locationId) {
  if (!canTravel(locationId)) {
    showNotification('Location Locked', 'You need more information before visiting this location.', 'critical');
    return;
  }
  const loc = LOCATIONS[locationId];
  const prev = state.currentLocation;

  if (prev && prev !== locationId && loc.timeCost > 0) {
    const outOfTime = advanceTime(loc.timeCost);
    addTimelineEntry(undefined, `Traveled to ${loc.name}. (${loc.timeCost} min)`);
    updateHUD();
    if (outOfTime) { triggerTimeUp(); return; }
  }

  state.currentLocation = locationId;
  closeDialogue();

  renderScene(locationId, onHotspotClick);
  updateHUD();
  playSfx('travel');
}

// ===== HOTSPOT CLICK =====
function onHotspotClick(hotspot) {
  if (hotspot.toLocation) {
    navigateTo(hotspot.toLocation);
    return;
  }

  if (hotspot.suspectId) {
    startInterview(hotspot.suspectId);
    return;
  }

  if (hotspot.clueId) {
    collectClue(hotspot.clueId);
    return;
  }

  if (hotspot.onActivate) {
    advanceTime(15);
    hotspot.onActivate((text) => {
      pendingEventText = text;
      showModal(`
        <div class="modal-header">
          <div class="modal-title">🔎 Discovery</div>
          <button class="modal-close" data-close>✕</button>
        </div>
        <div class="modal-body">
          <p style="color:#e5e7eb;font-size:0.95rem;line-height:1.8;font-style:italic;">${text}</p>
          <div style="margin-top:1.2rem;text-align:center;">
            <button class="btn-primary" data-close>Continue Investigation →</button>
          </div>
        </div>
      `);
      playSfx('reveal');
      updateHUD();
      // Re-render scene to remove activated hotspots
      renderScene(state.currentLocation, onHotspotClick);
    });
    return;
  }
}

// ===== CLUE COLLECTION =====
function collectClue(clueId) {
  const clue = state.clues[clueId];
  if (!clue || clue.found) return;

  const timeOut = advanceTime(clue.timeToFind);
  clue.found = true;
  addTimelineEntry(undefined, `Evidence collected: ${clue.name} (${LOCATIONS[clue.location]?.name})`);
  updateHUD();
  playSfx('clue');

  // Auto-analyze
  clue.analyzed = true;

  // Unlock board
  rebuildPins();
  if (document.getElementById('board-screen') && !document.getElementById('board-screen').classList.contains('hidden')) {
    renderBoard();
  }

  showNotification('Evidence Found', clue.name, 'clue-found');

  showModal(`
    <div class="modal-header">
      <div class="modal-title">${clue.icon} ${clue.name}</div>
      <button class="modal-close" data-close>✕</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;gap:0.5rem;margin-bottom:0.8rem;flex-wrap:wrap;">
        <span class="clue-badge badge-${clue.type}">${clue.type}</span>
        <span class="status-tag tag-info">📍 ${LOCATIONS[clue.location]?.name}</span>
        ${clue.keyClue ? '<span class="status-tag tag-critical">★ KEY CLUE</span>' : ''}
      </div>
      <p style="color:#e5e7eb;font-size:0.95rem;line-height:1.8;margin-bottom:1.2rem;font-style:italic;">"${clue.desc}"</p>
      <div style="background:rgba(59,130,246,0.08);border:1px solid #1e3a5f;padding:0.7rem;font-size:0.78rem;color:#93c5fd;">
        💡 Add this to your Deduction Board to connect it with suspects and locations.
      </div>
      <div style="margin-top:1.2rem;text-align:center;">
        <button class="btn-primary" data-close>Log Evidence →</button>
      </div>
    </div>
  `);

  // Re-render scene
  setTimeout(() => renderScene(state.currentLocation, onHotspotClick), 100);

  if (timeOut) triggerTimeUp();
}

// ===== INTERVIEW SYSTEM =====
function startInterview(suspectId) {
  const suspect = state.suspects[suspectId];
  if (!suspect) return;

  const tree = getDialogueTree(suspectId);
  if (!tree) return;

  suspect.interviewCount++;
  activeDialogue = tree;
  activeDialogueSuspect = suspectId;

  advanceTime(5); // Opening cost
  updateHUD();

  showDialogue(suspect, tree.intro, tree.options);
}

function showDialogue(suspect, text, options) {
  const panel = document.getElementById('dialogue-panel');
  if (!panel) return;
  panel.classList.remove('hidden');

  const s = state.suspects[activeDialogueSuspect];
  const trustPct = s ? s.trust : 50;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.8rem;">
      <div class="char-portrait">${suspect.icon}</div>
      <div class="char-info">
        <div class="char-name">${suspect.name}</div>
        <div class="char-role">${suspect.role}</div>
        <div class="char-trust">
          <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#6b7280;margin-bottom:2px;">
            <span>Trust</span><span id="trust-val">${trustPct}%</span>
          </div>
          <div class="trust-bar"><div class="trust-fill" id="trust-fill-bar" style="width:${trustPct}%"></div></div>
        </div>
      </div>
      <button style="background:none;border:none;color:#6b7280;font-size:1.2rem;cursor:pointer;align-self:flex-start;padding:0.2rem 0.4rem;" id="close-dialogue-btn">✕</button>
    </div>
    <div class="dialogue-speaker">
      <span class="speaker-tag">${suspect.name.split(' ')[0].toUpperCase()}</span>
    </div>
    <div class="dialogue-text" id="dialogue-text-el">"${text}"</div>
    <div class="dialogue-options" id="dialogue-opts">
      ${renderDialogueOptions(options)}
    </div>
  `;

  wireDialogueOptions(panel);
  panel.querySelector('#close-dialogue-btn')?.addEventListener('click', closeDialogue);
}

function renderDialogueOptions(options) {
  return options.map((opt, i) => {
    const locked = opt.requires && !isFactKnown(opt.requires);
    return `
      <button class="dialogue-opt ${locked ? 'locked' : ''}" data-opt="${i}" ${locked ? 'disabled' : ''}>
        ${opt.text}
        ${opt.cost > 0 ? `<span class="opt-cost">(${opt.cost} min)</span>` : ''}
        ${locked ? ' <span style="color:#4b5563;font-size:0.65rem;">[Requires more information]</span>' : ''}
      </button>
    `;
  }).join('');
}

function wireDialogueOptions(panel) {
  panel.querySelectorAll('.dialogue-opt:not(.locked)').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.opt);
      handleDialogueChoice(idx);
    });
  });
}

function handleDialogueChoice(idx) {
  if (!activeDialogue) return;
  const opt = activeDialogue.options[idx];
  if (!opt) return;

  if (opt.isExit) {
    closeDialogue();
    return;
  }

  const timeOut = advanceTime(opt.cost);
  updateHUD();

  if (opt.onChoose) opt.onChoose();

  if (opt.response) {
    const suspect = state.suspects[activeDialogueSuspect];
    const trustPct = suspect.trust;
    const panel = document.getElementById('dialogue-panel');
    if (panel) {
      activeDialogue = getDialogueTree(activeDialogueSuspect) || activeDialogue;
      const trustFill = panel.querySelector('#trust-fill-bar');
      if (trustFill) trustFill.style.width = `${trustPct}%`;
      const textEl = panel.querySelector('#dialogue-text-el');
      if (textEl) textEl.innerHTML = `"${opt.response}"`;
      const trustVal = panel.querySelector('#trust-val');
      if (trustVal) trustVal.textContent = `${trustPct}%`;
      const optsEl = panel.querySelector('#dialogue-opts');
      if (optsEl) {
        optsEl.innerHTML = renderDialogueOptions(activeDialogue.options);
        wireDialogueOptions(panel);
      }
    }
    playSfx('connect');
  }

  if (timeOut) { closeDialogue(); triggerTimeUp(); }
}

function closeDialogue() {
  const panel = document.getElementById('dialogue-panel');
  if (panel) panel.classList.add('hidden');
  activeDialogue = null;
  activeDialogueSuspect = null;
}

// ===== MODAL SYSTEM =====
function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;
  box.innerHTML = html;
  overlay.classList.remove('hidden');

  // Wire close buttons
  box.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
}

// ===== BOARD SCREEN =====
function openBoard() {
  closeDialogue();
  closeModal();
  const boardEl = document.getElementById('board-screen');
  boardEl.classList.remove('hidden');
  currentModal = 'board';

  rebuildPins();
  const canvas = document.getElementById('board-canvas');

  // Always init/re-render; use flag to avoid stacking canvas click listeners
  initBoard(canvas, (connections) => {
    const keyCount = getKeyConnectionsMade();
    if (keyCount >= 3 && !isFactKnown('board_unlocked_chapel')) {
      markFactDiscovered('board_unlocked_chapel');
      unlockLocation('chapel');
      showNotification('Board Insight', 'Connections reveal: the chapel is key. New location unlocked!', 'clue-found');
    }
    if (keyCount >= 5 && !isFactKnown('board_unlocked_tunnels')) {
      markFactDiscovered('board_unlocked_tunnels');
      unlockLocation('tunnels');
      showNotification('Breakthrough!', 'The tunnel system under the chapel — this is where she is.', 'clue-found');
    }
  });

  if (!boardInitialized) {
    boardInitialized = true;

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const result = handleBoardClick(e.clientX, e.clientY, rect);
      if (result) {
        const hintEl = document.getElementById('board-hint');
        if (result.type === 'selected' && hintEl) {
          hintEl.textContent = `${result.pin.label} selected — click another to connect`;
          hintEl.style.color = '#e8c87a';
        }
        if (result.type === 'connected') {
          playSfx('connect');
          if (result.isKey) {
            showNotification('Key Connection!', 'This link reveals something important.', 'clue-found');
          }
          if (hintEl) { hintEl.textContent = 'Connection made'; hintEl.style.color = '#22c55e'; }
          setTimeout(() => {
            if (hintEl) { hintEl.textContent = 'Select two pins to connect them with string'; hintEl.style.color = '#6b7280'; }
          }, 2000);
        }
        if (result.type === 'disconnected') {
          playSfx('wrong');
          if (hintEl) { hintEl.textContent = 'Connection removed'; hintEl.style.color = '#ef4444'; }
          setTimeout(() => {
            if (hintEl) { hintEl.textContent = 'Select two pins to connect them with string'; hintEl.style.color = '#6b7280'; }
          }, 2000);
        }
      }
    });

    document.getElementById('board-close-btn').addEventListener('click', () => {
      boardEl.classList.add('hidden');
      currentModal = null;
    });
  }
}

// ===== MAP SCREEN =====
function openMap() {
  closeDialogue();
  closeModal();
  document.getElementById('map-screen').classList.remove('hidden');
  currentModal = 'map';
  renderMapScreen(state.currentLocation, (locId) => {
    document.getElementById('map-screen').classList.add('hidden');
    currentModal = null;
    navigateTo(locId);
  }, () => {
    document.getElementById('map-screen').classList.add('hidden');
    currentModal = null;
  });
}

// ===== CLUES MODAL =====
function openClues() {
  showModal(renderCluePanel(() => {}));

  document.getElementById('modal-box')?.querySelectorAll('.clue-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const clue = state.clues[id];
      if (!clue) return;
      clue.analyzed = true;
    });
  });
}

// ===== NOTEBOOK MODAL =====
function openNotebook() {
  showModal(renderNotebook());
}

// ===== SUSPECTS MODAL =====
function openSuspectsModal() {
  const suspects = Object.values(state.suspects);
  showModal(`
    <div class="modal-header">
      <div class="modal-title">👥 Suspect Profiles</div>
      <button class="modal-close" data-close>✕</button>
    </div>
    <div class="modal-body">
      ${suspects.map(s => `
        <div style="display:flex;gap:0.8rem;padding:0.8rem 0;border-bottom:1px solid #111827;cursor:pointer;" class="suspect-row" data-id="${s.id}">
          <div class="char-portrait">${s.icon}</div>
          <div style="flex:1;">
            <div style="color:#e5e7eb;font-size:0.95rem;">${s.name}</div>
            <div style="color:#6b7280;font-size:0.72rem;margin-bottom:0.3rem;">${s.role} · Age ${s.age}</div>
            <div style="color:#9ca3af;font-size:0.78rem;font-style:italic;margin-bottom:0.5rem;">${s.notes}</div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              <span style="font-size:0.65rem;color:#6b7280;">Trust: ${s.trust}%</span>
              <span style="font-size:0.65rem;color:${(state.suspectSuspicion[s.id]||0) > 50 ? '#ef4444' : '#6b7280'};">
                Suspicion: ${state.suspectSuspicion[s.id] || 0}%
              </span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `);
}

// ===== ACCUSATION SCREEN =====
function openAccusation() {
  const keyClues = countKeyCluesFound();
  if (keyClues < 2) {
    showModal(`
      <div class="modal-header">
        <div class="modal-title">⚖️ Make Accusation</div>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div class="modal-body">
        <p style="color:#fca5a5;font-style:italic;">You need more evidence before making a formal accusation. Keep investigating.</p>
        <p style="color:#6b7280;font-size:0.8rem;margin-top:0.5rem;">Collect at least 2 key pieces of evidence first.</p>
        <div style="margin-top:1rem;text-align:center;"><button class="btn-secondary" data-close>Continue Investigating</button></div>
      </div>
    `);
    return;
  }

  const suspects = Object.values(state.suspects);
  showModal(`
    <div class="modal-header">
      <div class="modal-title">⚖️ Formal Accusation</div>
      <button class="modal-close" data-close>✕</button>
    </div>
    <div class="modal-body">
      <div style="background:rgba(239,68,68,0.08);border:1px solid #7f1d1d;padding:0.8rem;margin-bottom:1rem;color:#fca5a5;font-size:0.8rem;line-height:1.6;">
        ⚠️ Accusing the wrong person wastes critical time and damages your credibility. Are you certain?
      </div>
      <div style="color:#9ca3af;font-size:0.82rem;margin-bottom:1rem;">Select who you believe is responsible for Emily's disappearance:</div>
      ${suspects.map(s => `
        <div class="clue-card" data-accuse="${s.id}" style="cursor:pointer;">
          <div class="clue-icon">${s.icon}</div>
          <div class="clue-info">
            <div class="clue-name">${s.name}</div>
            <div class="clue-desc">${s.role} · Suspicion: ${state.suspectSuspicion[s.id] || 0}%</div>
          </div>
        </div>
      `).join('')}
      <div style="margin-top:0.8rem;text-align:center;">
        <button class="btn-secondary" data-close>Not Yet — Keep Investigating</button>
      </div>
    </div>
  `);

  document.getElementById('modal-box').querySelectorAll('[data-accuse]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.accuse;
      makeAccusation(id);
    });
  });
}

function makeAccusation(suspectId) {
  state.accusation = suspectId;
  const suspect = state.suspects[suspectId];
  const isCorrect = suspectId === 'dr_hayes';
  advanceTime(30);
  addTimelineEntry(undefined, `Formal accusation made against ${suspect.name}.`);

  if (isCorrect) {
    state.suspectSuspicion['dr_hayes'] = 100;
    showModal(`
      <div class="modal-header">
        <div class="modal-title" style="color:#22c55e;">✓ Arrest Warrant Issued</div>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div class="modal-body">
        <p style="color:#e5e7eb;font-size:0.95rem;line-height:1.8;font-style:italic;">
          Dr. Hayes is placed under formal suspicion. Based on your evidence, a search warrant for the chapel and tunnels has been authorized.
          <strong style="color:#e8c87a;">Now find Emily before it's too late.</strong>
        </p>
        <div style="margin-top:1rem;text-align:center;">
          <button class="btn-primary" data-close>Search the Chapel →</button>
        </div>
      </div>
    `);
    unlockLocation('chapel');
    unlockLocation('tunnels');
    showNotification('Warrant Issued!', 'Search the chapel tunnels now!', 'clue-found');
  } else {
    showModal(`
      <div class="modal-header">
        <div class="modal-title" style="color:#ef4444;">✗ Wrong Accusation</div>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div class="modal-body">
        <p style="color:#e5e7eb;font-size:0.95rem;line-height:1.8;font-style:italic;">
          ${suspect.name} has a confirmed alibi for the critical window. The accusation falls apart under scrutiny, and the real culprit knows you're not watching them.
        </p>
        <div style="margin-top:1rem;text-align:center;">
          <button class="btn-secondary" data-close>Re-examine the evidence</button>
        </div>
      </div>
    `);
    advanceTime(30); // Extra time penalty
    trustModifier(suspectId, -30);
    playSfx('wrong');
  }

  updateHUD();
}

// ===== RESCUE ACTION =====
function openRescue() {
  if (!canTravel('tunnels')) {
    showModal(`
      <div class="modal-header">
        <div class="modal-title">🔦 Search & Rescue</div>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div class="modal-body">
        <p style="color:#9ca3af;font-style:italic;">You don't have enough information to launch a rescue operation yet. Find out where Emily is being held first.</p>
        <div style="margin-top:1rem;text-align:center;"><button class="btn-secondary" data-close>Keep Investigating</button></div>
      </div>
    `);
    return;
  }
  closeModal();
  navigateTo('chapel');
}

// ===== TIME UP =====
function triggerTimeUp() {
  if (state.gameOver) return;
  state.gameOver = true;

  if (!state.rescueAttempted) {
    state.keyDeductions.hideLocation = null;
  }

  const endingType = determineEnding();
  state.endingType = endingType;

  setTimeout(() => {
    closeDialogue();
    closeModal();
    const endHtml = renderEndingScreen(endingType);
    const endEl = document.createElement('div');
    endEl.innerHTML = endHtml;
    document.getElementById('game-root').appendChild(endEl.firstElementChild);

    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      location.reload();
    });
  }, 500);
}

// ===== TRIGGER ENDING MANUALLY =====
function triggerEnding() {
  state.gameOver = true;
  const endingType = determineEnding();
  state.endingType = endingType;

  const endHtml = renderEndingScreen(endingType);
  const endEl = document.createElement('div');
  endEl.innerHTML = endHtml;
  document.getElementById('game-root').appendChild(endEl.firstElementChild);

  document.getElementById('play-again-btn')?.addEventListener('click', () => {
    location.reload();
  });
}

// ===== WIRE HUD BUTTONS =====
function wireHUDButtons() {
  document.getElementById('btn-board')?.addEventListener('click', openBoard);
  document.getElementById('btn-clues')?.addEventListener('click', openClues);
  document.getElementById('btn-map')?.addEventListener('click', openMap);
  document.getElementById('btn-notebook')?.addEventListener('click', openNotebook);
}

// ===== WIRE BOTTOM NAV =====
function wireBottomNav() {
  document.getElementById('nav-hotel')?.addEventListener('click', () => navigateTo('hotel'));
  document.getElementById('nav-suspects')?.addEventListener('click', openSuspectsModal);
  document.getElementById('nav-accuse')?.addEventListener('click', openAccusation);
  document.getElementById('nav-rescue')?.addEventListener('click', openRescue);
}

// ===== TICKING CLOCK =====
function startClock() {
  // No real-time deadline. Time advances only through investigative actions.
  setInterval(() => {
    if (state.gameOver || !state.gameStarted) return;
    updateHUD();
  }, 60000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  buildRoot();
  spawnRain();
  await initAudio();
  showTitle();

  document.getElementById('start-btn')?.addEventListener('click', () => {
    startGame();
    startClock();
  });
});
