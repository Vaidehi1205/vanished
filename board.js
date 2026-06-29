// ===== DEDUCTION BOARD =====
// Interactive string-and-pin board for connecting evidence

import { state, LOCATIONS } from './gamestate.js';

let selectedPin = null;
let boardPins = [];
let boardConnections = [];
let canvas = null;
let ctx = null;
let onBoardUpdate = null;

export function initBoard(canvasEl, updateCallback) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  onBoardUpdate = updateCallback;
  rebuildPins();
  render();
}

export function rebuildPins() {
  boardPins = [];

  // Suspects row
  const suspects = Object.values(state.suspects);
  suspects.forEach((s, i) => {
    boardPins.push({
      id: `suspect_${s.id}`,
      type: 'suspect',
      label: s.name,
      sublabel: s.role,
      icon: s.icon,
      x: 0.08 + i * 0.18,
      y: 0.15,
      data: s,
    });
  });

  // Clue row
  const foundClues = Object.values(state.clues).filter(c => c.found);
  foundClues.forEach((c, i) => {
    boardPins.push({
      id: `clue_${c.id}`,
      type: 'evidence',
      label: c.name,
      sublabel: c.type,
      icon: c.icon,
      x: 0.05 + i * 0.15,
      y: 0.72,
      data: c,
    });
  });

  // Location row
  const locs = Object.values(LOCATIONS).filter(l => state.unlockedLocations.has(l.id));
  locs.forEach((l, i) => {
    boardPins.push({
      id: `loc_${l.id}`,
      type: 'location',
      label: l.name,
      sublabel: '',
      icon: l.icon,
      x: 0.05 + i * 0.17,
      y: 0.43,
      data: l,
    });
  });
}

const BOARD_BG_URL = 'https://vtelpopqybfytrgzkomj.supabase.co/storage/v1/object/public/game-assets/public/328347c7-7766-4ebb-a220-e039d09228a2/1a9a28f9-9e58-4322-a785-cf1e05dadcca/57ced2ba-ca6b-4505-bf89-d87f51f851e0.png';
let boardBgImage = null;

function getBoardBg() {
  if (!boardBgImage) {
    boardBgImage = new Image();
    boardBgImage.src = BOARD_BG_URL;
    boardBgImage.onload = () => { if (canvas) render(); };
  }
  return boardBgImage;
}

export function render() {
  if (!canvas || !ctx) return;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  canvas.width = W;
  canvas.height = H;

  // Background
  const bg = getBoardBg();
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, W, H);
    // dark overlay for readability
    ctx.fillStyle = 'rgba(5,5,15,0.72)';
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);
  }

  // Subtle grid
  ctx.strokeStyle = 'rgba(31,41,55,0.4)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Section labels
  ctx.font = '10px Georgia';
  ctx.letterSpacing = '2px';
  ctx.fillStyle = 'rgba(232,200,122,0.3)';
  ctx.fillText('SUSPECTS', 12, H * 0.08);
  ctx.fillText('LOCATIONS', 12, H * 0.36);
  ctx.fillText('EVIDENCE', 12, H * 0.65);

  // Draw connection strings
  boardConnections.forEach(conn => {
    const a = boardPins.find(p => p.id === conn.from);
    const b = boardPins.find(p => p.id === conn.to);
    if (!a || !b) return;
    const ax = a.x * W, ay = a.y * H;
    const bx = b.x * W, by = b.y * H;
    const isKey = conn.isKey;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    // Slightly curved string
    const mx = (ax + bx) / 2 + (Math.random() * 20 - 10);
    const my = (ay + by) / 2 - 15;
    ctx.quadraticCurveTo(mx, my, bx, by);
    ctx.strokeStyle = isKey ? 'rgba(239,68,68,0.7)' : 'rgba(232,200,122,0.5)';
    ctx.lineWidth = isKey ? 2 : 1.5;
    ctx.setLineDash(isKey ? [] : [4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Draw pins
  boardPins.forEach(pin => {
    const px = pin.x * W;
    const py = pin.y * H;
    const isSelected = selectedPin === pin.id;
    const isConnected = boardConnections.some(c => c.from === pin.id || c.to === pin.id);

    // Card bg
    const cardW = 100, cardH = 54;
    const cx = px - cardW / 2;
    const cy = py - cardH / 2;

    ctx.fillStyle = isSelected ? 'rgba(232,200,122,0.15)' : 'rgba(17,24,39,0.92)';
    ctx.fillRect(cx, cy, cardW, cardH);

    // Border
    const borderColor = {
      suspect: isSelected ? '#ef4444' : (isConnected ? '#ef444488' : '#374151'),
      evidence: isSelected ? '#3b82f6' : (isConnected ? '#3b82f688' : '#374151'),
      location: isSelected ? '#22c55e' : (isConnected ? '#22c55e88' : '#374151'),
    }[pin.type] || '#374151';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(cx, cy, cardW, cardH);

    // Pin dot
    ctx.beginPath();
    ctx.arc(px, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();

    // Icon
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(pin.icon, px, cy + 24);

    // Label
    ctx.font = '9px Georgia';
    ctx.fillStyle = isSelected ? '#e8c87a' : '#d1d5db';
    const shortLabel = pin.label.length > 14 ? pin.label.slice(0, 13) + '…' : pin.label;
    ctx.fillText(shortLabel, px, cy + 38);

    ctx.font = '7px Georgia';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(pin.sublabel, px, cy + 49);

    ctx.textAlign = 'left';
  });
}

export function handleBoardClick(clientX, clientY, rect) {
  const W = canvas.width;
  const H = canvas.height;
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;

  // Find clicked pin (within 55px tolerance in pin coords)
  const clicked = boardPins.find(pin => {
    const dx = (pin.x - relX) * W;
    const dy = (pin.y - relY) * H;
    return Math.abs(dx) < 55 && Math.abs(dy) < 30;
  });

  if (!clicked) {
    selectedPin = null;
    render();
    return null;
  }

  if (!selectedPin) {
    selectedPin = clicked.id;
    render();
    return { type: 'selected', pin: clicked };
  }

  if (selectedPin === clicked.id) {
    selectedPin = null;
    render();
    return null;
  }

  // Connect two pins
  const fromId = selectedPin;
  const toId = clicked.id;
  selectedPin = null;

  const existing = boardConnections.find(c =>
    (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  );

  if (existing) {
    // Disconnect
    boardConnections = boardConnections.filter(c => c !== existing);
    render();
    return { type: 'disconnected', from: fromId, to: toId };
  }

  // Check if this is a meaningful connection
  const isKey = isKeyConnection(fromId, toId);
  boardConnections.push({ from: fromId, to: toId, isKey });
  render();

  if (onBoardUpdate) onBoardUpdate(boardConnections);
  return { type: 'connected', from: fromId, to: toId, isKey };
}

function isKeyConnection(a, b) {
  const KEY_CONNECTIONS = [
    ['suspect_dr_hayes', 'clue_footprints'],
    ['suspect_dr_hayes', 'clue_camera_footage'],
    ['suspect_dr_hayes', 'clue_old_documents'],
    ['suspect_dr_hayes', 'loc_chapel'],
    ['suspect_dr_hayes', 'loc_tunnels'],
    ['clue_notebook', 'loc_chapel'],
    ['clue_tunnel_map', 'loc_tunnels'],
    ['suspect_dr_hayes', 'clue_voice_recording'],
    ['clue_guide_note', 'loc_tunnels'],
  ];
  return KEY_CONNECTIONS.some(([x, y]) =>
    (a === x && b === y) || (a === y && b === x)
  );
}

export function getKeyConnectionsMade() {
  return boardConnections.filter(c => c.isKey).length;
}

export function clearSelection() {
  selectedPin = null;
}
