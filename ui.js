// Plain DOM overlay: player health, enemy guard gauge, a big outcome readout and a centre message.
const OUTCOME_STYLE = {
  perfect: { text: '#ffe066', bg: 'rgba(122,88,0,0.55)', border: '#ffd34d' },
  block: { text: '#8fd8ff', bg: 'rgba(0,52,84,0.55)', border: '#4fb8e8' },
  hit: { text: '#ff6b5a', bg: 'rgba(108,0,0,0.6)', border: '#ff5a4d' },
  ready: { text: '#cfc6b8', bg: 'rgba(30,28,26,0.5)', border: '#6b6459' },
};
// The full-screen tint that answers a press: warm gold for a perfect parry, a cold whisper for a block,
// blood red for a hit. One element that is retriggered — never one element per call, so it cannot stack.
const FLASH_STYLE = {
  perfect: { tint: 'radial-gradient(circle at 50% 42%, rgba(255,238,190,0.55), rgba(255,178,56,0.16) 72%)', strength: 1 },
  block: { tint: 'radial-gradient(circle at 50% 42%, rgba(139,196,255,0.22), rgba(60,120,200,0.06) 72%)', strength: 0.5 },
  hit: { tint: 'radial-gradient(circle at 50% 42%, rgba(255,60,40,0.6), rgba(150,10,10,0.28) 75%)', strength: 1 },
};
const FLASH_FADE_MS = 150;
const FONT = 'system-ui,-apple-system,"Segoe UI",sans-serif';

export function createUI() {
  const hud = document.createElement('div');
  hud.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:10;font-family:${FONT}`;
  document.body.appendChild(hud);

  // The screen tint goes in first, so it paints underneath the readouts instead of washing them out.
  const flashLayer = document.createElement('div');
  flashLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0';
  hud.appendChild(flashLayer);

  // Last outcome, top left — this is the M1 check, so it is big and colour-coded.
  const outcome = document.createElement('div');
  outcome.style.cssText =
    'position:absolute;left:24px;top:20px;padding:8px 18px;border-radius:6px;border:2px solid #6b6459;' +
    `font:700 30px/1.1 ${FONT};letter-spacing:2px;color:#cfc6b8;background:rgba(30,28,26,0.5)`;
  outcome.textContent = 'READY';
  hud.appendChild(outcome);

  const health = makeBar(hud, 'left:24px;bottom:24px;width:280px', 'YOU');
  const gauge = makeBar(hud, 'left:50%;top:22px;transform:translateX(-50%);width:340px', 'GUARD');

  const message = document.createElement('div');
  message.style.cssText =
    'position:absolute;left:0;right:0;top:38%;text-align:center;display:none;' +
    `font:600 26px/1.4 ${FONT};color:#e8dfd0;text-shadow:0 2px 6px #000`;
  hud.appendChild(message);
  let messageShown = false;

  // Which fight this is, along the very bottom edge — below the health bar's band (bottom 24px) and
  // clear of the guard gauge up top and the outcome readout up left.
  const fight = document.createElement('div');
  fight.style.cssText =
    'position:absolute;left:50%;bottom:8px;transform:translateX(-50%);display:none;' +
    `font:600 11px/1 ${FONT};letter-spacing:3px;color:#9d948a;text-shadow:0 2px 6px #000`;
  hud.appendChild(fight);

  return {
    setOutcome(text, kind) {
      const style = OUTCOME_STYLE[kind] || OUTCOME_STYLE.ready;
      outcome.textContent = text;
      outcome.style.color = style.text;
      outcome.style.background = style.bg;
      outcome.style.borderColor = style.border;
    },
    setHealth(value, max) {
      setFill(health, value, max);
      health.style.background = value / max > 0.5 ? '#7ee26a' : value / max > 0.25 ? '#f0c040' : '#ff5a4d';
    },
    setGauge(value, max) {
      setFill(gauge, value, max);
    },
    setMessage(text) {
      if (messageShown && message.textContent === text) return;
      message.textContent = text;
      message.style.display = 'block';
      messageShown = true;
    },
    hideMessage() {
      if (!messageShown) return;
      message.style.display = 'none';
      messageShown = false;
    },
    // kind is 'perfect' | 'block' | 'hit'; anything else fades in like a block rather than throwing.
    flash(kind) {
      const style = FLASH_STYLE[kind] || FLASH_STYLE.block;
      flashLayer.style.transition = 'none';
      flashLayer.style.background = style.tint;
      flashLayer.style.opacity = String(style.strength);
      void flashLayer.offsetWidth; // commit the tint before the fade is armed, so a rapid retrigger still reads
      flashLayer.style.transition = `opacity ${FLASH_FADE_MS}ms linear`;
      flashLayer.style.opacity = '0';
    },
    setFight(text) {
      fight.textContent = text || '';
      fight.style.display = text ? 'block' : 'none';
    },
  };
}

function makeBar(parent, position, label) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:absolute;${position}`;

  const tag = document.createElement('div');
  tag.style.cssText = `font:600 11px/1 ${FONT};letter-spacing:3px;color:#9d948a;margin-bottom:4px`;
  tag.textContent = label;

  const track = document.createElement('div');
  track.style.cssText =
    'height:14px;border:1px solid rgba(220,210,190,0.35);border-radius:3px;' +
    'background:rgba(0,0,0,0.55);overflow:hidden';

  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:100%;background:#7ee26a;transition:width 80ms linear';
  track.appendChild(fill);

  wrap.appendChild(tag);
  wrap.appendChild(track);
  parent.appendChild(wrap);
  return fill;
}

function setFill(fill, value, max) {
  const fraction = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  fill.style.width = `${fraction * 100}%`;
}
