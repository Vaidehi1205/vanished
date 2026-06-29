// ===== UI RENDERING =====
// All DOM rendering helpers

import { state, getTimeLabel, getTimePeriod, getTimePercent, LOCATIONS, ALL_CLUES } from './gamestate.js';

let notifTimeout = null;

export function showNotification(title, body, type = '') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.innerHTML = `<div class="notif-title">${title}</div><div class="notif-body">${body}</div>`;
  document.getElementById('game-root').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function updateHUD() {
  const timeEl = document.getElementById('hud-time');
  const periodEl = document.getElementById('hud-period');
  const fillEl = document.getElementById('hud-time-fill');
  const dayEl = document.getElementById('hud-day');

  if (timeEl) timeEl.textContent = getTimeLabel();
  if (periodEl) periodEl.textContent = getTimePeriod().toUpperCase();
  if (dayEl) dayEl.textContent = `Day ${state.day}`;
  if (fillEl) {
    const pct = getTimePercent() * 100;
    fillEl.style.width = `${Math.min(100, pct)}%`;
  }

  // Update trust display
  const trustEl = document.getElementById('hud-morality');
  if (trustEl) {
    const label = state.morality >= 70 ? 'Empathetic' : state.morality >= 40 ? 'Balanced' : 'Aggressive';
    trustEl.textContent = label;
  }
}

export function renderHUD() {
  const hud = document.getElementById('game-hud');
  if (!hud) return;
  hud.innerHTML = `
    <div class="hud-clock">
      <span class="day-label" id="hud-day">Day 2</span>
      <span id="hud-time">${getTimeLabel()}</span>
      <span style="color:#6b7280;font-size:0.7rem" id="hud-period">${getTimePeriod().toUpperCase()}</span>
    </div>
    <div class="hud-actions">
      <button class="hud-btn" id="btn-board">📌 Board</button>
      <button class="hud-btn" id="btn-clues">🔍 Clues</button>
      <button class="hud-btn" id="btn-map">🗺️ Map</button>
      <button class="hud-btn" id="btn-notebook">📓 Notes</button>
    </div>
    <div class="hud-trust">
      <div class="trust-dot"></div>
      <span id="hud-morality">Balanced</span>
    </div>
  `;
}

const SCENE_MOOD = {
  hotel:       { tint: 'rgba(10,5,0,0.35)',  vignette: 'rgba(0,0,0,0.6)' },
  hotel_room:  { tint: 'rgba(15,5,0,0.4)',   vignette: 'rgba(0,0,0,0.65)' },
  hotel_lobby: { tint: 'rgba(5,0,0,0.3)',    vignette: 'rgba(0,0,0,0.55)' },
  forest:      { tint: 'rgba(0,8,0,0.4)',    vignette: 'rgba(0,0,0,0.7)' },
  lake:        { tint: 'rgba(0,5,15,0.4)',   vignette: 'rgba(0,0,0,0.65)' },
  chapel:      { tint: 'rgba(5,0,10,0.45)',  vignette: 'rgba(0,0,0,0.7)' },
  observatory: { tint: 'rgba(0,3,10,0.35)',  vignette: 'rgba(0,0,0,0.6)' },
  tunnels:     { tint: 'rgba(5,0,0,0.55)',   vignette: 'rgba(0,0,0,0.75)' },
  cave:        { tint: 'rgba(0,0,5,0.5)',    vignette: 'rgba(0,0,0,0.75)' },
  museum:      { tint: 'rgba(8,5,0,0.4)',    vignette: 'rgba(0,0,0,0.6)' },
};

export function renderScene(locationId, onHotspotClick) {
  const { getHotspots, getSceneBg } = window.__sceneAPI__;
  const container = document.getElementById('scene-view');
  if (!container) return;

  const loc = LOCATIONS[locationId];
  const hotspots = getHotspots(locationId);
  const bg = getSceneBg(locationId);
  const mood = SCENE_MOOD[locationId] || SCENE_MOOD.hotel;

  container.innerHTML = `
    <img class="scene-bg" src="${bg}" alt="${loc.name}" draggable="false" style="transition:opacity 0.4s;opacity:0;" id="scene-bg-img">
    <div class="scene-overlay" style="background:linear-gradient(to bottom, ${mood.tint} 0%, ${mood.vignette} 100%);"></div>
    <div class="scene-vignette"></div>
    <div class="scene-title">${loc.icon} ${loc.name}</div>
    <div class="scene-time-badge">${getTimeLabel()}</div>
    ${hotspots.map(h => `
      <div class="hotspot" style="left:${h.x}%;top:${h.y}%;animation-delay:${Math.random()*0.4}s" data-id="${h.id}" data-type="${h.type}">
        <div class="hotspot-ring ${h.type}">${h.icon}</div>
        <div class="hotspot-label">${h.label}</div>
      </div>
    `).join('')}
  `;

  // Fade in background image once loaded
  const bgImg = container.querySelector('#scene-bg-img');
  if (bgImg) {
    bgImg.onload = () => { bgImg.style.opacity = '1'; };
    if (bgImg.complete) bgImg.style.opacity = '1';
  }

  // Bind hotspot clicks
  container.querySelectorAll('.hotspot').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const hs = hotspots.find(h => h.id === id);
      if (hs) onHotspotClick(hs);
    });
  });
}

export function renderCluePanel(onClueClick) {
  const found = Object.values(state.clues).filter(c => c.found);
  const html = found.length === 0
    ? '<p style="color:#4b5563;font-style:italic;text-align:center;padding:2rem;">No clues collected yet.<br>Explore locations and search for evidence.</p>'
    : found.map(c => `
        <div class="clue-card ${c.analyzed ? '' : 'new-clue'}" data-id="${c.id}">
          <div class="clue-icon">${c.icon}</div>
          <div class="clue-info">
            <div class="clue-name ${c.analyzed ? '' : 'new'}">${c.name}</div>
            <div class="clue-desc">${c.analyzed ? c.desc : 'Click to analyze this piece of evidence.'}</div>
            <div class="clue-loc">${LOCATIONS[c.location]?.name || c.location}</div>
          </div>
          <div class="clue-badge badge-${c.type}">${c.type}</div>
        </div>
      `).join('');

  return `
    <div class="modal-header">
      <div class="modal-title">🔍 Evidence Locker</div>
      <button class="modal-close" data-close>✕</button>
    </div>
    <div class="modal-body">
      <p style="color:#6b7280;font-size:0.75rem;margin-bottom:1rem;">
        ${found.length} of ${Object.keys(state.clues).length} pieces collected. Click to analyze.
      </p>
      ${html}
    </div>
  `;
}

export function renderNotebook() {
  const facts = [...state.discoveredFacts];
  const timeline = [...state.timeline].slice(0, 12);

  const factLabels = {
    sarah_dinner: "Emily was distracted at dinner, checking her phone.",
    sarah_fight: "Sarah and Emily argued about Dr. Hayes the morning of disappearance.",
    emily_found_docs: "Emily found incriminating documents about the Hayes family.",
    emily_went_chapel: "Emily was heading to the chapel that night.",
    hayes_alibi: "Hayes claims he went for a solo walk 9pm-11pm.",
    hayes_followed_emily: "Security footage contradicts Hayes' stated walking direction.",
    hayes_knows_docs: "Hayes reacted with fear when documents were mentioned.",
    hayes_footprint_match: "Large footprints at forest trail match Hayes' shoe size.",
    marcus_followed: "Marcus followed Emily from the hotel but claims he turned back.",
    emily_had_destination: "Emily left the hotel with clear purpose — heading somewhere specific.",
    emily_direction_east: "Marcus saw Emily heading east — toward the forest/chapel path.",
    torres_told_emily_tunnel: "Torres told Emily about the tunnel system beneath the chapel.",
    tunnels_real: "The tunnel system is real and Emily knew how to access it.",
    tunnel_escape_route: "Multiple exits from the tunnels — she could still be alive.",
    hayes_chapel_connection: "Hayes family once owned the chapel property.",
    henderson_saw_emily: "Henderson saw Emily cross the lobby at 9pm.",
    henderson_saw_hayes_follow: "EYEWITNESS: Henderson saw Hayes follow Emily through the lobby.",
    henderson_full_truth: "Henderson confirms the 1963 land fraud involving Hayes Senior.",
    hayes_family_crime: "Hayes family committed property fraud in 1963 — covered up for decades.",
    found_trapdoor: "Trapdoor found under chapel altar — fresh scratches on lock.",
    secret_branch_hint: "Emily may have staged her disappearance to expose Hayes.",
    hayes_suspicious: "Multiple witnesses note Hayes was behaving unusually all trip.",
    searched_tunnels: "Tunnels searched.",
    hayes_chapel_key: "Sarah says Hayes had access to the chapel gate.",
    emily_photo_signature: "Emily photographed a 1963 document bearing Hayes Sr.'s signature.",
    hayes_muddy_cuffs: "Marcus saw mud on Hayes' cuffs before the storm intensified.",
    adult_voice_signal: "Marcus heard an adult voice call Emily after a flashlight signal from the trees.",
    hayes_waited_for_call: "Hayes became evasive about the 8:50pm call to his room.",
    hayes_voice_match: "Hayes reacted badly to the lake recording of a man threatening Emily over the papers.",
    cistern_carries_sound: "Torres says sound from the tunnel cistern can carry toward the lake dock.",
    hayes_threatened_emily: "Henderson heard Hayes threaten Emily after she said she had copies.",
  };

  const factItems = facts.map(f => factLabels[f] ? `
    <div style="padding:0.4rem 0;border-bottom:1px solid #111827;color:#d1d5db;font-size:0.82rem;line-height:1.5;">
      • ${factLabels[f]}
    </div>
  ` : '').filter(Boolean).join('');

  const timelineItems = timeline.map(t => `
    <div class="timeline-item">
      <div class="timeline-time">${t.time}</div>
      <div class="timeline-dot"></div>
      <div class="timeline-text">${t.text}</div>
    </div>
  `).join('');

  const suspectRows = Object.values(state.suspects).map(s => `
    <div style="display:flex;align-items:center;gap:0.8rem;padding:0.5rem 0;border-bottom:1px solid #111827;">
      <div style="font-size:1.5rem;">${s.icon}</div>
      <div style="flex:1;">
        <div style="color:#e5e7eb;font-size:0.85rem;">${s.name}</div>
        <div style="color:#6b7280;font-size:0.7rem;">${s.role}</div>
        <div class="trust-bar" style="margin-top:4px;width:80px;">
          <div class="trust-fill" style="width:${s.trust}%"></div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.65rem;color:#9ca3af;">Suspicion</div>
        <div style="font-size:1rem;color:${(state.suspectSuspicion[s.id]||0) > 60 ? '#ef4444' : '#6b7280'};">
          ${state.suspectSuspicion[s.id] || 0}%
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="modal-header">
      <div class="modal-title">📓 Detective's Notebook</div>
      <button class="modal-close" data-close>✕</button>
    </div>
    <div class="modal-body">
      <div class="notebook-section">
        <div class="notebook-section-title">⏰ Timeline of Events</div>
        ${timelineItems || '<p style="color:#4b5563;font-style:italic;font-size:0.8rem;">No events logged yet.</p>'}
      </div>
      <div class="notebook-section">
        <div class="notebook-section-title">💡 Discovered Facts</div>
        ${factItems || '<p style="color:#4b5563;font-style:italic;font-size:0.8rem;">No facts recorded yet.</p>'}
      </div>
      <div class="notebook-section">
        <div class="notebook-section-title">👥 Suspect Profiles</div>
        ${suspectRows}
      </div>
    </div>
  `;
}

export function renderBoardScreen(connections, onPinClick, onConnect, onClose) {
  const BOARD_BG = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/57ced2ba-ca6b-4505-bf89-d87f51f851e0.png';

  // Board pins: suspects + found clues
  const suspectPins = Object.values(state.suspects).map((s, i) => ({
    id: `suspect_${s.id}`, type: 'suspect', label: s.name, icon: s.icon,
    x: 10 + i * 18, y: 20,
  }));
  const cluePins = Object.values(state.clues).filter(c => c.found).map((c, i) => ({
    id: `clue_${c.id}`, type: 'evidence', label: c.name, icon: c.icon,
    x: 5 + i * 16, y: 65,
  }));
  const locationPins = Object.values(LOCATIONS).filter(l => l.unlocked).slice(0, 5).map((l, i) => ({
    id: `loc_${l.id}`, type: 'location', label: l.name, icon: l.icon,
    x: 8 + i * 18, y: 42,
  }));

  const allPins = [...suspectPins, ...cluePins, ...locationPins];

  return { allPins };
}

export function renderMapScreen(currentLocationId, onLocationClick, onClose) {
  const mapEl = document.getElementById('map-screen');
  if (!mapEl) return;

  // Map layout positions (% x, % y)
  const positions = {
    hotel: { x: 50, y: 45 },
    hotel_room: { x: 40, y: 32 },
    hotel_lobby: { x: 60, y: 32 },
    forest: { x: 72, y: 55 },
    lake: { x: 82, y: 70 },
    chapel: { x: 85, y: 38 },
    observatory: { x: 88, y: 22 },
    tunnels: { x: 82, y: 45 },
    cave: { x: 90, y: 30 },
    museum: { x: 30, y: 60 },
  };

  const connections = [
    ['hotel', 'hotel_room'], ['hotel', 'hotel_lobby'], ['hotel', 'forest'],
    ['hotel', 'museum'], ['forest', 'lake'], ['forest', 'chapel'],
    ['chapel', 'tunnels'], ['forest', 'observatory'], ['forest', 'cave'],
  ];

  const locs = Object.values(LOCATIONS);

  mapEl.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;height:56px;background:rgba(0,0,0,0.95);border-bottom:1px solid #1f2937;display:flex;align-items:center;justify-content:space-between;padding:0 1rem;z-index:10;">
      <div style="color:#e8c87a;letter-spacing:0.1em;font-size:1rem;">🗺️ MOUNTAIN MAP</div>
      <button class="hud-btn" id="map-close-btn">✕ Close</button>
    </div>
    <div class="map-wrap" style="background:radial-gradient(ellipse at 60% 55%, #0d1a10 0%, #050810 100%);">
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
        ${connections.map(([a, b]) => {
          const pa = positions[a];
          const pb = positions[b];
          if (!pa || !pb) return '';
          const unlock = state.unlockedLocations.has(a) && state.unlockedLocations.has(b);
          return `<line x1="${pa.x}%" y1="${pa.y}%" x2="${pb.x}%" y2="${pb.y}%"
            stroke="${unlock ? '#4b5563' : '#1f2937'}" stroke-width="${unlock ? 1.5 : 1}" stroke-dasharray="${unlock ? '0' : '4,4'}"/>`;
        }).join('')}
      </svg>
      ${locs.map(loc => {
        const pos = positions[loc.id];
        if (!pos) return '';
        const isUnlocked = state.unlockedLocations.has(loc.id);
        const isCurrent = loc.id === currentLocationId;
        return `
          <div class="map-location ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}"
               style="left:${pos.x}%;top:${pos.y}%;"
               data-loc="${loc.id}">
            <div class="map-dot"></div>
            <div class="map-label">${loc.icon} ${loc.name}</div>
            ${!isUnlocked ? '<div style="font-size:0.55rem;color:#4b5563;text-align:center;">🔒</div>' : ''}
            ${isCurrent ? '<div style="font-size:0.55rem;color:#22c55e;text-align:center;">◉ HERE</div>' : ''}
          </div>
        `;
      }).join('')}
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:50px;background:rgba(0,0,0,0.95);border-top:1px solid #1f2937;display:flex;align-items:center;justify-content:center;gap:1rem;padding:0 1rem;">
      <div style="display:flex;gap:1.5rem;font-size:0.7rem;color:#6b7280;">
        <span><span style="color:#22c55e;">●</span> Current</span>
        <span><span style="color:#e8c87a;">●</span> Unlocked — click to travel</span>
        <span><span style="color:#374151;">●</span> Locked</span>
      </div>
    </div>
  `;

  mapEl.querySelector('#map-close-btn')?.addEventListener('click', () => {
    if (onClose) onClose();
  });

  mapEl.querySelectorAll('.map-location:not(.locked)').forEach(el => {
    if (el.dataset.loc !== currentLocationId) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => onLocationClick(el.dataset.loc));
    }
  });
}

export function renderEndingScreen(endingType) {
  const endings = {
    true: {
      color: '#22c55e',
      title: '★ TRUE ENDING ★',
      subtitle: 'The Full Truth',
      body: "Emily Carter is found alive in the chapel tunnels. Dr. Hayes is arrested, the 1963 land fraud exposed, and the original families receive justice after sixty years. Emily, it turns out, had engineered enough of her own situation to force the truth into the open — a dangerous gamble that paid off, thanks to you. The case makes national news. The mountain town will never be the same.",
      score: 'CASE SOLVED — PERFECT',
    },
    secret: {
      color: '#a855f7',
      title: '✦ SECRET ENDING ✦',
      subtitle: 'The Architect',
      body: "Emily Carter had planned everything. She staged her disappearance, leaked herself into the tunnels to copy the original documents, and left breadcrumbs only a brilliant detective could follow. Hayes fell into her trap. The fraud is exposed. Emily walks free — not as a victim, but as the most cunning seventeen-year-old you've ever met. She smiles when you find her. 'Took you long enough.'",
      score: 'MASTER DETECTIVE',
    },
    good: {
      color: '#3b82f6',
      title: 'GOOD ENDING',
      subtitle: 'Emily Saved',
      body: "Emily is found alive, shaken but unharmed. Hayes is taken into custody. Some questions remain unanswered — the full extent of the conspiracy stays in the shadows, at least for now. The town breathes a sigh of relief. Emily is going home. That's what matters.",
      score: 'CASE MOSTLY SOLVED',
    },
    neutral: {
      color: '#f59e0b',
      title: 'NEUTRAL ENDING',
      subtitle: 'Wrong Conclusion',
      body: "Emily is found, but the wrong person is arrested. The real culprit slips away. Hayes boards a train before dawn. Emily will be safe — for now — but the truth remains buried, and justice will have to wait for another day. Or another detective.",
      score: 'INCOMPLETE INVESTIGATION',
    },
    bad: {
      color: '#ef4444',
      title: 'BAD ENDING',
      subtitle: 'The Case Goes Cold',
      body: "The evidence never locks into place. The tunnels are searched too late, the trapdoor has been wiped clean, and Dr. Hayes has a prepared alibi. Emily Carter becomes another unsolved disappearance in the mountain town files. You sit on the hotel steps as rain continues to fall, replaying every decision. There was a moment. A choice. What did you miss?",
      score: 'CASE COLD',
    },
  };

  const e = endings[endingType] || endings.bad;
  return `
    <div class="ending-screen" id="ending-screen">
      <div style="color:${e.color};font-size:0.8rem;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:0.5rem;">
        INVESTIGATION COMPLETE
      </div>
      <div class="ending-title" style="color:${e.color};text-shadow:0 0 30px ${e.color}55;">
        ${e.title}
      </div>
      <div style="color:${e.color};opacity:0.7;letter-spacing:0.15em;font-size:1rem;margin-bottom:2rem;">
        ${e.subtitle}
      </div>
      <p class="ending-body">${e.body}</p>
      <div style="color:${e.color};font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:2rem;border:1px solid ${e.color}44;padding:0.5rem 1.5rem;">
        ${e.score}
      </div>
      <button class="btn-primary" id="play-again-btn">↺ Investigate Again</button>
    </div>
  `;
}
