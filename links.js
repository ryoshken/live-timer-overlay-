function build(base, idx, opts) {
  const q = new URLSearchParams();
  q.set('overlay','1');
  q.set('timer', String(idx));
  if (opts.transparent) q.set('transparent','1');
  if (opts.controls) q.set('overlay_controls','1');
  q.set('size', String(opts.size));
  if (opts.autostart) q.set('autostart','1');
  if (opts.minutes && opts.minutes > 0) q.set('minutes', String(opts.minutes));
  if (opts.room) q.set('room', String(opts.room));
  return `${base.replace(/\/$/,'')}/timer/?${q.toString()}`;
}

const el = {
  links: document.querySelector('#links'),
  optTransparent: document.querySelector('#optTransparent'),
  optControls: document.querySelector('#optControls'),
  optSize: document.querySelector('#optSize'),
  optAutostart: document.querySelector('#optAutostart'),
  optMinutes: document.querySelector('#optMinutes'),
  optRoom: document.querySelector('#optRoom')
};

function row(title, url) {
  const wrap = document.createElement('div');
  wrap.className = 'timer';
  const display = document.createElement('div');
  display.className = 'display';
  display.textContent = '00:00';
  const panel = document.createElement('div');
  panel.className = 'panel';
  const r = document.createElement('div');
  r.className = 'row';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = url;
  input.style.width = '520px';
  const copy = document.createElement('button');
  copy.className = 'primary';
  copy.textContent = 'Copy URL';
  const test = document.createElement('button');
  test.textContent = 'Test';
  test.className = 'ghost';
  copy.addEventListener('click', () => {
    navigator.clipboard.writeText(url);
    copy.textContent = 'Copied';
    setTimeout(() => copy.textContent = 'Copy URL', 1200);
  });
  test.addEventListener('click', () => {
    window.open(url, '_blank');
  });
  r.append(input, copy, test);
  panel.append(r);
  wrap.append(display, panel);
  const label = document.createElement('div');
  label.style.fontFamily = 'system-ui, sans-serif';
  label.style.color = '#ddd';
  label.textContent = title;
  wrap.insertBefore(label, display);
  return wrap;
}

function render() {
  const base = location.origin;
  const opts = {
    transparent: el.optTransparent.checked,
    controls: el.optControls.checked,
    size: parseInt(el.optSize.value,10),
    autostart: el.optAutostart.checked,
    minutes: parseInt(el.optMinutes.value,10),
    room: el.optRoom.value.trim() || 'default'
  };
  el.links.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const url = build(base, i, opts);
    el.links.appendChild(row(`Overlay Timer ${i}`, url));
  }
}

['change','input'].forEach(evt => {
  el.optTransparent.addEventListener(evt, render);
  el.optControls.addEventListener(evt, render);
  el.optSize.addEventListener(evt, render);
});

render();