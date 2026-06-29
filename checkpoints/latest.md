# Checkpoint — Vanished Detective Game

## Completed (Original Build)
- `index.html` — shell with Tailwind, module entry
- `style.css` — full UI system (HUD, modals, dialogue panel, board, map, hotspots, ending screens, rain effect, animations)
- `gamestate.js` — all game state: 10 locations, 5 suspects, 14 clues, time system, trust/morality, ending logic
- `dialogue.js` — full interview trees for all 5 suspects with trust-gated responses, fact discovery, location unlocks
- `scenes.js` — hotspot definitions for all 10 locations, clue positions, event triggers, secret ending branch at lake
- `ui.js` — all rendering: HUD, scenes, clue panel, notebook, map, ending screen
- `board.js` — canvas-drawn deduction board with pin-and-string connections, key connection detection
- `main.js` — full game loop: title, start, navigation, clue collection, interviews, board, map, accusation, rescue, time-up/ending trigger, ambient audio

## Completed (Visuals & Buttons Session)

### New Scene Backgrounds Generated
All 10 scenes now have unique AI backgrounds:
- `hotel` → uploaded hotel_bg.png
- `hotel_room` → new hotel_room_bg.png (moody vintage room)
- `hotel_lobby` → new lobby_bg.png (dark mahogany reception)
- `forest` → uploaded forest_bg.png
- `lake` → new lake_bg.png (misty night dock)
- `chapel` → uploaded chapel_bg.png
- `tunnels` → new tunnels_bg.png (stone tunnels with lantern glow)
- `observatory` → new observatory_bg.png (broken dome with telescope)
- `cave` → new cave_bg.png (mountain cave with flashlight)
- `museum` → new museum_bg.png (antique display cases)
- `board` → uploaded board_bg.png (now renders as board canvas background)

### Bug Fixes
1. **Board duplicate event listeners** — `boardInitialized` flag prevents stacking on every open
2. **Map close button** — `renderMapScreen` now accepts `onClose` 3rd param; wired correctly
3. **Modal close wiring** — uses `box.querySelectorAll('[data-close]')` + `overlay.onclick` = no stacking
4. **Dialogue close button** — larger tap target

### Visual Enhancements
- Per-scene mood tints (forest=green tint, lake=blue, tunnels=red, chapel=purple overlay)
- Radial vignette overlay `.scene-vignette` for cinematic depth
- Background images fade in smoothly on load
- Hotspots have entrance animations (`hotspot-appear` keyframes) with stagger
- Deduction board renders board_bg.png with dark overlay

## Architecture
```
index.html → main.js (orchestrator)
  ├── gamestate.js  (state, time, locations, suspects, clues, endings)
  ├── dialogue.js   (interview trees per suspect)
  ├── scenes.js     (hotspots per location + all 10 bg URL constants)
  ├── ui.js         (all DOM rendering, scene mood system)
  └── board.js      (canvas deduction board + board bg image)
```

## Remaining / Optional
- Character portrait images (AI faces) for suspects in dialogue panel
- Scene-specific ambient sound variations (tunnel drip, forest rain)
- Board canvas resize observer for window resize

## Journal
- Visuals+buttons session: Generated 7 new scene backgrounds, wired all unique BGs. Fixed board duplicate listeners, map close button param mismatch, modal close button stacking. Added cinematic vignette + hotspot animations. Board now shows its cork-board background.
