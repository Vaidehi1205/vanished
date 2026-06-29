// ===== GAME STATE =====
// Central source of truth for all game data

export const LOCATIONS = {
  hotel: { id: 'hotel', name: 'Heritage Hotel', icon: '🏨', bg: 'hotel', unlocked: true, timeCost: 0 },
  hotel_room: { id: 'hotel_room', name: "Emily's Room", icon: '🚪', bg: 'hotel', unlocked: true, timeCost: 15 },
  hotel_lobby: { id: 'hotel_lobby', name: 'Hotel Lobby', icon: '🛎️', bg: 'hotel', unlocked: true, timeCost: 10 },
  forest: { id: 'forest', name: 'Forest Trail', icon: '🌲', bg: 'forest', unlocked: true, timeCost: 30 },
  lake: { id: 'lake', name: 'Lakeside Dock', icon: '🌊', bg: 'forest', unlocked: true, timeCost: 25 },
  chapel: { id: 'chapel', name: 'Old Chapel', icon: '⛪', bg: 'chapel', unlocked: false, timeCost: 35 },
  observatory: { id: 'observatory', name: 'Observatory', icon: '🔭', bg: 'forest', unlocked: false, timeCost: 40 },
  tunnels: { id: 'tunnels', name: 'Underground Tunnels', icon: '🕳️', bg: 'chapel', unlocked: false, timeCost: 45 },
  cave: { id: 'cave', name: 'Mountain Cave', icon: '⛰️', bg: 'forest', unlocked: false, timeCost: 50 },
  museum: { id: 'museum', name: 'Local Museum', icon: '🏛️', bg: 'hotel', unlocked: true, timeCost: 20 },
};

export const SUSPECTS = {
  sarah: {
    id: 'sarah',
    name: 'Sarah Kim',
    role: 'Best Friend',
    age: 17,
    icon: '👧',
    trust: 30,
    truthLevel: 40, // Higher = more honest
    guilty: false,
    knowledgeable: true,
    notes: 'Hiding something. Avoids eye contact when Emily is mentioned.',
    alibi: "Claims she was in her room after 9pm. Roommate confirms but seems nervous.",
    secret: 'She and Emily had a huge fight the morning before Emily disappeared. She knows Emily was meeting someone at the chapel.',
    revealed: false,
    interviewCount: 0,
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus Webb',
    role: 'Classmate / Secret Admirer',
    age: 17,
    icon: '👦',
    trust: 20,
    truthLevel: 55,
    guilty: false,
    knowledgeable: true,
    notes: "Left a confession letter in Emily's locker. She never responded.",
    alibi: 'Says he went for a walk alone near the lake around 8:30pm.',
    secret: "Followed Emily from the hotel but claims he turned back. Saw her walking toward the forest with someone.",
    revealed: false,
    interviewCount: 0,
  },
  dr_hayes: {
    id: 'dr_hayes',
    name: 'Dr. Richard Hayes',
    role: 'History Teacher',
    age: 44,
    icon: '👨‍🏫',
    trust: 50,
    truthLevel: 25,
    guilty: true,
    knowledgeable: true,
    notes: 'Was seen leaving the hotel at 9:15pm. Returned past midnight.',
    alibi: "Claims he was on a solo walk for 'fresh air.' Phone was off.",
    secret: "Knows Emily found old documents in the museum about illegal land seizure involving his family. Followed her to retrieve the documents and locked her in the chapel tunnels.",
    revealed: false,
    interviewCount: 0,
  },
  guide_torres: {
    id: 'guide_torres',
    name: 'Ramon Torres',
    role: 'Local Tour Guide',
    age: 38,
    icon: '🧑‍🌾',
    trust: 40,
    truthLevel: 70,
    guilty: false,
    knowledgeable: true,
    notes: 'Knows the mountain paths better than anyone. Was hired by the school.',
    alibi: 'Confirmed by his partner to be home by 10pm.',
    secret: "Told Emily about the secret tunnel beneath the old chapel during the day tour. Feels responsible.",
    revealed: false,
    interviewCount: 0,
  },
  henderson: {
    id: 'henderson',
    name: 'Mr. Henderson',
    role: 'Hotel Manager',
    age: 58,
    icon: '👴',
    trust: 35,
    truthLevel: 45,
    guilty: false,
    knowledgeable: true,
    notes: 'Has old hotel ledgers and is protective about them.',
    alibi: 'At the front desk all evening. Confirmed by night staff.',
    secret: "The hotel was built on property that was seized illegally in the 1960s. Emily found the original deeds. He saw Dr. Hayes threatening Emily in the lobby.",
    revealed: false,
    interviewCount: 0,
  },
};

// All possible clues — randomized subset available per playthrough
export const ALL_CLUES = [
  { id: 'muddy_boots', name: 'Muddy Boots', icon: '👢', type: 'physical', location: 'hotel_room', desc: "Emily's boots near the door — caked with mud and pine needles, consistent with the forest trail.", found: false, analyzed: false, connectedTo: ['forest', 'dr_hayes'], keyClue: true, timeToFind: 20 },
  { id: 'torn_photo', name: 'Torn Photograph', icon: '📷', type: 'physical', location: 'hotel_room', desc: "Half a photo — Emily with someone whose face is torn away. Timestamp: day of disappearance, 6:30pm.", found: false, analyzed: false, connectedTo: ['dr_hayes', 'sarah'], keyClue: true, timeToFind: 15 },
  { id: 'notebook', name: "Emily's Notebook", icon: '📓', type: 'document', location: 'hotel_room', desc: "Cryptic sketches of a tunnel, a chapel cross, dates from 1963, and the words: 'They covered it up. Hayes knows.'", found: false, analyzed: false, connectedTo: ['dr_hayes', 'tunnels', 'chapel'], keyClue: true, timeToFind: 20 },
  { id: 'phone', name: 'Damaged Phone', icon: '📱', type: 'digital', location: 'hotel_room', desc: "Screen cracked. Partial text readable: '...meet at 9 tonigh... bring the doc...' — last message sent 8:47pm.", found: false, analyzed: false, connectedTo: ['dr_hayes', 'henderson'], keyClue: true, timeToFind: 25 },
  { id: 'bracelet', name: 'Broken Bracelet', icon: '📿', type: 'physical', location: 'forest', desc: "Silver bracelet charm — broken clasp. Initials 'E.C.' engraved. Found on the forest trail at the split path.", found: false, analyzed: false, connectedTo: ['forest', 'chapel'], keyClue: false, timeToFind: 30 },
  { id: 'footprints', name: 'Muddy Footprints', icon: '👣', type: 'physical', location: 'forest', desc: "Two sets of footprints in the mud — one small (Emily?), one large adult male. Trail leads toward the chapel.", found: false, analyzed: false, connectedTo: ['chapel', 'dr_hayes'], keyClue: true, timeToFind: 30 },
  { id: 'camera_footage', name: 'Security Footage', icon: '📹', type: 'digital', location: 'hotel_lobby', desc: "Hotel camera at 9:03pm: Emily exits toward east wing. 9:08pm: Dr. Hayes follows. Camera angle doesn't cover the side exit.", found: false, analyzed: false, connectedTo: ['dr_hayes', 'chapel'], keyClue: true, timeToFind: 25 },
  { id: 'old_documents', name: 'Land Seizure Documents', icon: '📜', type: 'document', location: 'museum', desc: "1963 county records: The Hayes family legally contested ownership of the chapel estate. Original owners were displaced. Criminal fraud suspected but case closed.", found: false, analyzed: false, connectedTo: ['dr_hayes', 'henderson', 'chapel'], keyClue: true, timeToFind: 35 },
  { id: 'confession_letter', name: 'Confession Letter', icon: '💌', type: 'document', location: 'hotel_room', desc: "Handwritten. 'Emily — I've liked you since year 9. Please give me a chance. — M' — found in her suitcase, opened.", found: false, analyzed: false, connectedTo: ['marcus'], keyClue: false, timeToFind: 15 },
  { id: 'voice_recording', name: 'Voice Recording', icon: '🎙️', type: 'digital', location: 'lake', desc: "Partial audio on a waterproof recorder near the dock: '...you can't show anyone those papers... it'll ruin everything...' — male voice, agitated.", found: false, analyzed: false, connectedTo: ['dr_hayes', 'museum'], keyClue: true, timeToFind: 40 },
  { id: 'tunnel_map', name: 'Hand-Drawn Tunnel Map', icon: '🗺️', type: 'document', location: 'museum', desc: "Old map of tunnel system under the chapel. One section marked 'storage — sealed 1965.' Emily's pencil marks trace a route.", found: false, analyzed: false, connectedTo: ['tunnels', 'chapel'], keyClue: true, timeToFind: 30 },
  { id: 'hayes_phone', name: "Dr. Hayes' Phone Record", icon: '📋', type: 'digital', location: 'hotel_lobby', desc: "Hotel reception printout: Incoming call to Hayes room at 8:50pm — 4 minutes. No answer. Hayes' alibi says he was walking — so who called?", found: false, analyzed: false, connectedTo: ['dr_hayes'], keyClue: false, timeToFind: 20 },
  { id: 'guide_note', name: 'Tour Guide Note', icon: '📝', type: 'document', location: 'hotel_room', desc: "Small torn page: 'The chapel's east wing has a trapdoor under the altar — leads to old storage tunnels. Keep safe.' — Ramon's handwriting.", found: false, analyzed: false, connectedTo: ['guide_torres', 'chapel', 'tunnels'], keyClue: true, timeToFind: 20 },
  { id: 'hotel_ledger', name: 'Old Hotel Ledger', icon: '📒', type: 'document', location: 'hotel_lobby', desc: "1963 entries — guests included a 'R. Hayes Sr.' The notes mention a meeting about 'transfer of property rights.' Names match the land records.", found: false, analyzed: false, connectedTo: ['henderson', 'dr_hayes', 'chapel'], keyClue: false, timeToFind: 30 },
];

// Core game state
export const state = {
  // Time: minutes since 6:00pm Day 2 (start of investigation).
  // There is no fail deadline; time remains as case atmosphere and timeline context.
  time: 0,
  maxTime: Infinity,
  day: 2,

  currentLocation: 'hotel',
  previousLocation: null,

  clues: {},          // id -> clue object (found ones)
  suspects: {},       // id -> suspect with mutable trust
  suspectSuspicion: {}, // id -> 0-100 suspicion level player has set

  timeline: [],       // { time, text } entries

  connections: [],    // board connections: { from, to, type }
  boardPins: [],      // currently pinned items on board

  morality: 50,       // 0=ruthless, 100=compassionate — affects cooperation

  gameStarted: false,
  gameOver: false,
  endingType: null,   // 'true' | 'good' | 'neutral' | 'bad' | 'secret'

  discoveredFacts: new Set(), // set of fact IDs discovered
  unlockedLocations: new Set(['hotel', 'hotel_room', 'hotel_lobby', 'forest', 'lake', 'museum']),
  interviewedSuspects: new Set(),

  keyDeductions: {
    emilyLeft: null,          // 'voluntary' | 'abducted'
    primarySuspect: null,     // suspect id
    hideLocation: null,       // location id
    motive: null,             // 'coverup' | 'jealousy' | 'personal' | etc
    secretStaging: false,     // did player discover the secret ending branch?
  },

  accusation: null,           // who player formally accuses
  rescueAttempted: false,
};

// Initialize state copies from templates
export function initState() {
  // Deep copy suspects
  for (const [k, v] of Object.entries(SUSPECTS)) {
    state.suspects[k] = { ...v };
  }
  // Randomize clue availability (keep all key clues, shuffle some optional ones)
  const keyClues = ALL_CLUES.filter(c => c.keyClue);
  const optClues = ALL_CLUES.filter(c => !c.keyClue);
  // Pick 3 of 4 optional clues randomly
  const shuffled = [...optClues].sort(() => Math.random() - 0.5).slice(0, 3);
  const available = [...keyClues, ...shuffled];
  for (const clue of available) {
    state.clues[clue.id] = { ...clue };
  }
  // Init suspicion
  for (const k of Object.keys(SUSPECTS)) {
    state.suspectSuspicion[k] = 0;
  }
  state.gameStarted = true;
  addTimelineEntry(0, "Investigation begins. Emily Carter, 17, last seen at 9pm. Heavy rain outside. Take the time to build the case properly.");
}

export function addTimelineEntry(minutesOverride, text) {
  const t = minutesOverride !== undefined ? minutesOverride : state.time;
  const hour = 18 + Math.floor(t / 60); // starts at 6pm
  const min = t % 60;
  const label = `${String(hour > 23 ? hour - 24 : hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
  state.timeline.unshift({ time: label, text });
}

export function advanceTime(minutes) {
  state.time += minutes;
  return false;
}

export function getTimeLabel() {
  const h = 18 + Math.floor(state.time / 60);
  const m = state.time % 60;
  const hour = h > 23 ? h - 24 : h;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

export function getTimePeriod() {
  const h = 18 + Math.floor(state.time / 60);
  const hour = h > 23 ? h - 24 : h;
  if (hour >= 18 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 3) return 'night';
  return 'dawn';
}

export function getTimePercent() {
  if (!Number.isFinite(state.maxTime)) return 0;
  return Math.min(1, state.time / state.maxTime);
}

export function trustModifier(suspectId, delta) {
  const s = state.suspects[suspectId];
  if (!s) return;
  s.trust = Math.max(0, Math.min(100, s.trust + delta));
}

export function moralityShift(delta) {
  state.morality = Math.max(0, Math.min(100, state.morality + delta));
}

export function markFactDiscovered(factId) {
  state.discoveredFacts.add(factId);
}

export function isFactKnown(factId) {
  return state.discoveredFacts.has(factId);
}

export function unlockLocation(locId) {
  state.unlockedLocations.add(locId);
  LOCATIONS[locId].unlocked = true;
}

export function canTravel(locId) {
  return state.unlockedLocations.has(locId);
}

export function countFoundClues() {
  return Object.values(state.clues).filter(c => c.found).length;
}

export function countKeyCluesFound() {
  return Object.values(state.clues).filter(c => c.found && c.keyClue).length;
}

// Determine ending based on player actions
export function determineEnding() {
  const keyClues = countKeyCluesFound();
  const hayesSuspicion = state.suspectSuspicion['dr_hayes'] || 0;
  const rescuedEmily = state.rescueAttempted && state.keyDeductions.hideLocation === 'tunnels';
  const correctSuspect = state.accusation === 'dr_hayes';
  const hasSecretBranch = state.keyDeductions.secretStaging;

  if (hasSecretBranch && keyClues >= 7 && correctSuspect) {
    return 'secret';
  }
  if (keyClues >= 7 && correctSuspect && rescuedEmily) {
    return 'true';
  }
  if (rescuedEmily && keyClues >= 4) {
    if (correctSuspect) return 'good';
    return 'neutral';
  }
  if (keyClues >= 3 && correctSuspect) {
    return 'good';
  }
  if (!correctSuspect && state.accusation) {
    return 'neutral';
  }
  return 'bad';
}
