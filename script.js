const params = new URLSearchParams(location.search);
const overlay = params.get('overlay') === '1';
const overlayControls = params.get('overlay_controls') === '1';
const initTimers = (params.get('timers') || '').split('|').filter(Boolean);
const singleIdx = parseInt(params.get('timer'), 10);
const isSingle = !isNaN(singleIdx) && singleIdx >= 1 && singleIdx <= 3;
const singleMinutesParam = params.get('minutes');
const autostart = params.get('autostart') === '1' || params.get('auto') === '1' || params.get('start') === '1';
const room = params.get('room') || 'default';
const sizeParam = params.get('size');
const transparentParam = params.get('transparent') === '1';

if (overlay) document.body.classList.add('overlay');
if (transparentParam) document.body.classList.add('transparent');
if (overlay && (typeof singleIdx === 'number') && !isNaN(singleIdx)) document.body.classList.add('single');

const sizeInput = document.querySelector('#size');
const transparentChk = document.querySelector('#transparent');
const timersEl = document.querySelector('#timers');
const linksEl = document.querySelector('#links');

if (sizeParam) {
  document.documentElement.style.setProperty('--digit-size', `${parseInt(sizeParam,10)}px`);
  if (sizeInput) sizeInput.value = parseInt(sizeParam,10);
}
if (transparentChk) transparentChk.checked = transparentParam;

function pad(n) { return String(n).padStart(2,'0'); }
function format(total) {
  const mm = Math.floor(total/60);
  const ss = total%60;
  return `${pad(mm)}:${pad(ss)}`;
}

function addTimer(presetMinutes, idx) {
  const wrap = document.createElement('div');
  wrap.className = 'timer';
  const display = document.createElement('div');
  display.className = 'display';
  display.textContent = '00:00';
  const panel = document.createElement('div');
  panel.className = 'panel';
  const row1 = document.createElement('div');
  row1.className = 'row';
  const startBtn = document.createElement('button');
  startBtn.className = 'primary';
  startBtn.textContent = 'Start';
  const pauseBtn = document.createElement('button');
  pauseBtn.textContent = 'Pause';
  pauseBtn.disabled = true;
  const resetBtn = document.createElement('button');
  resetBtn.className = 'ghost';
  resetBtn.textContent = 'Reset';
  row1.append(startBtn, pauseBtn, resetBtn);
  const row2 = document.createElement('div');
  row2.className = 'row';
  const quick1 = document.createElement('button');
  quick1.className = 'green';
  quick1.textContent = '+1m';
  const quick5 = document.createElement('button');
  quick5.className = 'green';
  quick5.textContent = '+5m';
  const quick10 = document.createElement('button');
  quick10.className = 'green';
  quick10.textContent = '+10m';
  const addInput = document.createElement('input');
  addInput.type = 'number';
  addInput.min = '0';
  addInput.step = '1';
  addInput.placeholder = 'min';
  addInput.style.width = '80px';
  const addBtnM = document.createElement('button');
  addBtnM.textContent = 'Add m';
  const setInput = document.createElement('input');
  setInput.type = 'number';
  setInput.min = '0';
  setInput.step = '1';
  setInput.placeholder = 'set min';
  setInput.style.width = '100px';
  const setBtnM = document.createElement('button');
  setBtnM.textContent = 'Set';
  row2.append(quick1, quick5, quick10, addInput, addBtnM, setInput, setBtnM);
  panel.append(row1, row2);
  wrap.append(display, panel);
  timersEl.appendChild(wrap);

  let remainingMs = 0;

  function render(ms) {
    const sec = Math.max(0, Math.ceil(ms/1000));
    display.textContent = format(sec);
  }
  function send(type, minutes) {
    fetch('/api/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room, timer: idx, type, minutes }) });
  }
  function start() {
    const m = parseInt(setInput.value,10);
    send('start', !isNaN(m) ? m : undefined);
  }
  function pause() { send('pause'); }
  function reset() {
    const m = parseInt(setInput.value,10);
    send('reset', !isNaN(m) ? m : 0);
  }
  function addMinutes(m) { if (!isNaN(m) && m > 0) send('add', m); }

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', pause);
  resetBtn.addEventListener('click', reset);
  quick1.addEventListener('click', () => addMinutes(1));
  quick5.addEventListener('click', () => addMinutes(5));
  quick10.addEventListener('click', () => addMinutes(10));
  addBtnM.addEventListener('click', () => {
    const m = parseInt(addInput.value,10);
    addMinutes(m);
  });
  setBtnM.addEventListener('click', reset);

  if (typeof presetMinutes === 'number' && presetMinutes > 0) { setInput.value = String(presetMinutes); }
  render(0);

  if (overlay && !overlayControls) panel.style.display = 'none';
  const es = new EventSource(`/sse?room=${encodeURIComponent(room)}`);
  es.onmessage = e => {
    const data = JSON.parse(e.data);
    const t = data.timers[idx];
    remainingMs = t.remainingMs;
    render(remainingMs);
    startBtn.disabled = t.running;
    pauseBtn.disabled = !t.running;
  };
  if (overlay && isSingle && autostart && (typeof presetMinutes === 'number') && presetMinutes > 0) start();
}

if (sizeInput) sizeInput.addEventListener('input', e => {
  document.documentElement.style.setProperty('--digit-size', `${e.target.value}px`);
});
if (transparentChk) transparentChk.addEventListener('change', e => {
  document.body.classList.toggle('transparent', e.target.checked);
});

const COUNT = 3;
if (isSingle) {
  let preset;
  if (singleMinutesParam) {
    const m = parseInt(singleMinutesParam, 10);
    preset = !isNaN(m) ? m : undefined;
  } else if (initTimers.length) {
    const v = initTimers[singleIdx - 1];
    const m = parseInt(v ?? '', 10);
    preset = !isNaN(m) ? m : undefined;
  }
  addTimer(preset, singleIdx);
} else {
  if (initTimers.length) {
    for (let i = 0; i < COUNT; i++) {
      const v = initTimers[i];
      const m = parseInt(v ?? '', 10);
      addTimer(!isNaN(m) ? m : undefined, i+1);
    }
  } else {
    for (let i = 0; i < COUNT; i++) addTimer(undefined, i+1);
  }
}

function buildLink(idx) {
  const base = location.origin.replace(/\/$/,'');
  const size = sizeInput ? parseInt(sizeInput.value,10) : (sizeParam ? parseInt(sizeParam,10) : 120);
  const q = new URLSearchParams();
  q.set('overlay','1');
  q.set('transparent','1');
  q.set('timer', String(idx));
  q.set('room', room);
  q.set('size', String(size));
  return `${base}/timer/?${q.toString()}`;
}

function renderLinks() {
  if (!linksEl) return;
  linksEl.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'timer';
    const display = document.createElement('div');
    display.className = 'display';
    display.textContent = '00:00';
    const panel = document.createElement('div');
    panel.className = 'panel';
    const row = document.createElement('div');
    row.className = 'row';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = buildLink(i);
    input.style.width = '520px';
    const copy = document.createElement('button');
    copy.className = 'primary';
    copy.textContent = 'Copy URL';
    const test = document.createElement('button');
    test.className = 'ghost';
    test.textContent = 'Test';
    copy.addEventListener('click', () => { navigator.clipboard.writeText(input.value); copy.textContent = 'Copied'; setTimeout(() => copy.textContent = 'Copy URL', 1200); });
    test.addEventListener('click', () => { window.open(input.value, '_blank'); });
    row.append(input, copy, test);
    panel.append(row);
    wrap.append(display, panel);
    linksEl.appendChild(wrap);
  }
}

renderLinks();
if (sizeInput) sizeInput.addEventListener('input', renderLinks);