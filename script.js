const params = new URLSearchParams(location.search);
const overlay = params.get('overlay') === '1';
const overlayControls = params.get('overlay_controls') === '1';
const initTimers = (params.get('timers') || '').split('|').filter(Boolean);
const singleIdx = parseInt(params.get('timer'), 10);
const isSingle = !isNaN(singleIdx) && singleIdx >= 1 && singleIdx <= 3;
const singleMinutesParam = params.get('minutes');
const sizeParam = params.get('size');
const transparentParam = params.get('transparent') === '1';

if (overlay) document.body.classList.add('overlay');
if (transparentParam) document.body.classList.add('transparent');
if (overlay && (typeof singleIdx === 'number') && !isNaN(singleIdx)) document.body.classList.add('single');

const sizeInput = document.querySelector('#size');
const transparentChk = document.querySelector('#transparent');
const timersEl = document.querySelector('#timers');

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

function addTimer(presetMinutes) {
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
  let running = false;
  let t0 = 0;
  let intervalId = 0;

  function render(ms) {
    const sec = Math.max(0, Math.ceil(ms/1000));
    display.textContent = format(sec);
  }
  function stopTick() {
    running = false;
    pauseBtn.disabled = true;
    startBtn.disabled = false;
    if (intervalId) { clearInterval(intervalId); intervalId = 0; }
  }
  function start() {
    if (remainingMs <= 0) {
      const m = parseInt(setInput.value,10);
      if (!isNaN(m) && m > 0) remainingMs = m*60*1000;
      else return;
    }
    running = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    t0 = performance.now();
    intervalId = setInterval(() => {
      const now = performance.now();
      const dt = now - t0;
      t0 = now;
      remainingMs -= dt;
      if (remainingMs <= 0) {
        remainingMs = 0;
        render(0);
        display.classList.add('done');
        stopTick();
      } else {
        render(remainingMs);
      }
    }, 200);
  }
  function pause() { stopTick(); }
  function reset() {
    stopTick();
    const m = parseInt(setInput.value,10);
    remainingMs = !isNaN(m) ? Math.max(0, m)*60*1000 : 0;
    display.classList.remove('done');
    render(remainingMs);
  }
  function addMinutes(m) {
    if (isNaN(m) || m <= 0) return;
    remainingMs += m*60*1000;
    display.classList.remove('done');
    render(remainingMs);
  }

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

  if (typeof presetMinutes === 'number' && presetMinutes > 0) {
    remainingMs = presetMinutes*60*1000;
    setInput.value = String(presetMinutes);
    render(remainingMs);
  } else {
    render(0);
  }

  if (overlay && !overlayControls) panel.style.display = 'none';
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
  addTimer(preset);
} else {
  if (initTimers.length) {
    for (let i = 0; i < COUNT; i++) {
      const v = initTimers[i];
      const m = parseInt(v ?? '', 10);
      addTimer(!isNaN(m) ? m : undefined);
    }
  } else {
    for (let i = 0; i < COUNT; i++) addTimer();
  }
}