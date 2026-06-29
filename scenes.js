// ===== SCENE DEFINITIONS =====
// Each location: hotspots, events, available actions

import { state, advanceTime, addTimelineEntry, markFactDiscovered, isFactKnown, unlockLocation, canTravel } from './gamestate.js';

const HOTEL_BG    = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/195647c0-2a0b-4c17-a7a5-158ecf27b9cc.png';
const HOTEL_ROOM_BG = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/86784426-6d89-4cb2-935d-27a0817f20ca.png';
const LOBBY_BG    = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/5415261c-d570-4b78-9ae1-b83ee17d71fb.png';
const FOREST_BG   = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/d872ceec-405b-40f3-8d80-68dd3cf9b539.png';
const LAKE_BG     = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/a6f8eb7a-1973-4871-afb3-f61498abcd70.png';
const CHAPEL_BG   = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/3b53b518-3bb4-453c-9944-97be6eb582e9.png';
const TUNNELS_BG  = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/ef1c1df5-5883-4ab2-b4e3-9f44201290ea.png';
const CAVE_BG     = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/cba7e9ec-9ab0-4183-ae2a-ad9435bf60d6.png';
const MUSEUM_BG   = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/68f136de-6dc5-4c7e-9b52-cb1af0199312.png';
const OBS_BG      = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/5b1118cb-bc90-426f-82f9-b49382e6b863.png';

export function getSceneBg(locationId) {
  const bgMap = {
    hotel:        HOTEL_BG,
    hotel_room:   HOTEL_ROOM_BG,
    hotel_lobby:  LOBBY_BG,
    forest:       FOREST_BG,
    lake:         LAKE_BG,
    chapel:       CHAPEL_BG,
    observatory:  OBS_BG,
    tunnels:      TUNNELS_BG,
    cave:         CAVE_BG,
    museum:       MUSEUM_BG,
  };
  return bgMap[locationId] || HOTEL_BG;
}

// Returns hotspots for a given location
export function getHotspots(locationId) {
  const all = {
    hotel:        hotelHotspots,
    hotel_room:   hotelRoomHotspots,
    hotel_lobby:  lobbyHotspots,
    forest:       forestHotspots,
    lake:         lakeHotspots,
    chapel:       chapelHotspots,
    tunnels:      tunnelHotspots,
    museum:       museumHotspots,
    observatory:  observatoryHotspots,
    cave:         caveHotspots,
  };
  const fn = all[locationId];
  return fn ? fn() : [];
}

// Hotspot format: { id, label, icon, x, y (% of container), type, clueId?, suspectId?, action }

function hotelHotspots() {
  return [
    { id: 'go_room',   label: "Emily's Room",  icon: '🚪', x: 28, y: 45, type: 'exit',   toLocation: 'hotel_room' },
    { id: 'go_lobby',  label: 'Hotel Lobby',   icon: '🛎️', x: 55, y: 55, type: 'exit',   toLocation: 'hotel_lobby' },
    { id: 'go_outside',label: 'Forest Trail',  icon: '🌲', x: 75, y: 40, type: 'exit',   toLocation: 'forest' },
    { id: 'talk_sarah',  label: 'Sarah Kim',   icon: '👧', x: 40, y: 60, type: 'person', suspectId: 'sarah' },
    { id: 'talk_marcus', label: 'Marcus Webb', icon: '👦', x: 65, y: 62, type: 'person', suspectId: 'marcus' },
  ];
}

function hotelRoomHotspots() {
  const hotspots = [
    { id: 'back_hotel', label: 'Back to Hotel', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'hotel' },
  ];
  const cluePositions = {
    muddy_boots:      { x: 20, y: 72, label: 'Muddy Boots' },
    torn_photo:       { x: 48, y: 35, label: 'Torn Photo' },
    notebook:         { x: 65, y: 55, label: 'Notebook' },
    phone:            { x: 75, y: 42, label: 'Damaged Phone' },
    confession_letter:{ x: 35, y: 50, label: 'Letter (Luggage)' },
    guide_note:       { x: 55, y: 70, label: 'Crumpled Note' },
  };
  for (const [clueId, pos] of Object.entries(cluePositions)) {
    const clue = state.clues[clueId];
    if (clue && !clue.found) {
      hotspots.push({ id: `clue_${clueId}`, label: pos.label, icon: '🔍', x: pos.x, y: pos.y, type: 'clue', clueId });
    }
  }
  return hotspots;
}

function lobbyHotspots() {
  const hotspots = [
    { id: 'back_hotel', label: 'Back', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'hotel' },
    { id: 'talk_henderson', label: 'Mr. Henderson', icon: '👴', x: 55, y: 45, type: 'person', suspectId: 'henderson' },
  ];
  const cluePositions = {
    camera_footage: { x: 75, y: 25, label: 'Security Camera' },
    hayes_phone:    { x: 38, y: 65, label: 'Phone Records' },
    hotel_ledger:   { x: 60, y: 70, label: 'Old Ledger' },
  };
  for (const [clueId, pos] of Object.entries(cluePositions)) {
    const clue = state.clues[clueId];
    if (clue && !clue.found) {
      hotspots.push({ id: `clue_${clueId}`, label: pos.label, icon: '🔍', x: pos.x, y: pos.y, type: 'clue', clueId });
    }
  }
  return hotspots;
}

function forestHotspots() {
  const hotspots = [
    { id: 'back_hotel', label: 'Back to Hotel', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'hotel' },
    { id: 'go_lake',    label: 'Lakeside Dock', icon: '🌊', x: 25, y: 65, type: 'exit', toLocation: 'lake' },
  ];
  if (canTravel('chapel')) {
    hotspots.push({ id: 'go_chapel', label: 'Old Chapel', icon: '⛪', x: 72, y: 40, type: 'exit', toLocation: 'chapel' });
  }
  if (canTravel('observatory')) {
    hotspots.push({ id: 'go_obs', label: 'Observatory', icon: '🔭', x: 55, y: 30, type: 'exit', toLocation: 'observatory' });
  }
  const cluePositions = {
    bracelet:    { x: 45, y: 75, label: 'Something Shining' },
    footprints:  { x: 62, y: 68, label: 'Muddy Tracks' },
  };
  for (const [clueId, pos] of Object.entries(cluePositions)) {
    const clue = state.clues[clueId];
    if (clue && !clue.found) {
      hotspots.push({ id: `clue_${clueId}`, label: pos.label, icon: '🔍', x: pos.x, y: pos.y, type: 'clue', clueId });
    }
  }
  hotspots.push({ id: 'talk_guide', label: 'Ramon Torres', icon: '🧑‍🌾', x: 82, y: 58, type: 'person', suspectId: 'guide_torres' });
  return hotspots;
}

function lakeHotspots() {
  const hotspots = [
    { id: 'back_forest', label: 'Back to Forest', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'forest' },
  ];
  const clue = state.clues['voice_recording'];
  if (clue && !clue.found) {
    hotspots.push({ id: 'clue_voice_recording', label: 'Waterproof Recorder', icon: '🔍', x: 55, y: 78, type: 'clue', clueId: 'voice_recording' });
  }
  // Secret ending trigger
  if (isFactKnown('emily_found_docs') && isFactKnown('emily_went_chapel')) {
    hotspots.push({
      id: 'secret_note', label: 'Floating Envelope', icon: '✉️', x: 40, y: 65, type: 'event',
      onActivate: (cb) => {
        markFactDiscovered('secret_branch_hint');
        addTimelineEntry(undefined, "A sealed envelope found at the dock — Emily's handwriting on the outside: 'To whoever finds this — I planned this.'");
        state.keyDeductions.secretStaging = true;
        cb && cb("Sealed envelope in the water — it's addressed to you. Inside, Emily's own handwriting: 'I knew you'd come looking. I'm safe. But you need to find what Hayes has been hiding. Check the 1963 files — both copies.'");
      }
    });
  }
  return hotspots;
}

function chapelHotspots() {
  const hotspots = [
    { id: 'back_forest', label: 'Back to Forest', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'forest' },
  ];
  if (isFactKnown('hayes_follows')) {
    hotspots.push({ id: 'talk_hayes', label: 'Dr. Hayes is here', icon: '👨‍🏫', x: 58, y: 42, type: 'person', suspectId: 'dr_hayes' });
  }
  // Trapdoor — requires guide note or tunnel knowledge
  if (isFactKnown('tunnels_real') || isFactKnown('torres_told_emily_tunnel')) {
    hotspots.push({
      id: 'trapdoor', label: 'Altar Trapdoor', icon: '🕳️', x: 48, y: 72, type: 'event',
      onActivate: (cb) => {
        markFactDiscovered('found_trapdoor');
        state.keyDeductions.hideLocation = 'tunnels';
        unlockLocation('tunnels');
        addTimelineEntry(undefined, "Trapdoor discovered beneath the altar — padlocked from above. Fresh scratches on the lock.");
        cb && cb("A heavy trapdoor beneath the altar rug. It's padlocked — but the scratches are fresh. Someone was here recently. The lock could be broken.");
      }
    });
  }
  return hotspots;
}

function tunnelHotspots() {
  const hotspots = [
    { id: 'back_chapel', label: 'Back to Chapel', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'chapel' },
  ];
  hotspots.push({
    id: 'search_tunnels', label: 'Search Tunnels', icon: '🔦', x: 50, y: 50, type: 'event',
    onActivate: (cb) => {
      markFactDiscovered('searched_tunnels');
      state.rescueAttempted = true;
      if (isFactKnown('found_trapdoor') || state.keyDeductions.hideLocation === 'tunnels') {
        state.keyDeductions.hideLocation = 'tunnels';
        addTimelineEntry(undefined, "EMILY FOUND — alive in the sealed storage chamber. Dehydrated but unharmed.");
        cb && cb("You push through the tunnel... and there — huddled against a stone wall — is Emily Carter. Alive. Frightened. She looks up at you with exhausted eyes: 'I knew someone would come. Hayes locked me in. I have everything — the original documents are in my bag.'");
      } else {
        cb && cb("The tunnels branch in every direction. Without knowing where to look, you search for over an hour but find nothing. Time is slipping away.");
      }
    }
  });
  return hotspots;
}

function museumHotspots() {
  const hotspots = [
    { id: 'back_hotel', label: 'Back to Hotel', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'hotel' },
  ];
  const cluePositions = {
    old_documents: { x: 55, y: 45, label: '1963 County Records' },
    tunnel_map:    { x: 38, y: 65, label: 'Old Tunnel Map' },
  };
  for (const [clueId, pos] of Object.entries(cluePositions)) {
    const clue = state.clues[clueId];
    if (clue && !clue.found) {
      hotspots.push({ id: `clue_${clueId}`, label: pos.label, icon: '🔍', x: pos.x, y: pos.y, type: 'clue', clueId });
    }
  }
  return hotspots;
}

function observatoryHotspots() {
  return [
    { id: 'back_forest', label: 'Back to Forest', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'forest' },
    {
      id: 'obs_view', label: 'Telescope View', icon: '🔭', x: 50, y: 45, type: 'event',
      onActivate: (cb) => {
        unlockLocation('cave');
        addTimelineEntry(undefined, "From the observatory, you spot a light moving near the mountain cave.");
        cb && cb("Through the telescope, you see a faint light moving near the cave entrance on the mountain's east face. It blinks three times — like a signal.");
      }
    }
  ];
}

function caveHotspots() {
  return [
    { id: 'back_forest', label: 'Back to Forest', icon: '⬅️', x: 8, y: 20, type: 'exit', toLocation: 'forest' },
    {
      id: 'cave_search', label: 'Search Cave', icon: '⛏️', x: 50, y: 55, type: 'event',
      onActivate: (cb) => {
        addTimelineEntry(undefined, "Cave search — no sign of Emily. But scratched into the wall: 'E.C. — not here by choice.'");
        cb && cb("The cave is empty — but scratched into the stone wall near the entrance: 'E.C. — not here by choice. They know.' She was here. Recently.");
      }
    }
  ];
}
